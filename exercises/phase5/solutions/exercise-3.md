### Solution 3 — one million points

**1. Reproducible data**

```sql
SELECT setseed(0.42);
CREATE TABLE city.poi AS
SELECT g AS id,
       ST_SetSRID(ST_MakePoint(4.70 + random() * 0.40, 52.28 + random() * 0.17), 4326) AS geom,
       (ARRAY['cafe','shop','school','park'])[1 + floor(random() * 4)::int] AS kind
FROM generate_series(1, 1000000) AS g;
ALTER TABLE city.poi ADD PRIMARY KEY (id);
CREATE INDEX poi_geom_gix ON city.poi USING gist (geom);
ANALYZE city.poi;
GRANT SELECT ON city.poi TO tile_reader;
```

**2. Why aggregate? Estimate points per tile.** The bbox is about 27.2 km × 18.8 km ≈ 511 km², so the density is ≈ 1 957 points/km². Ground tile width at this latitude is `tile width × cos φ`:

| z | Ground tile width (km) | Points per tile (≈) |
|---:|---:|---:|
| 10 | 23.9 | 1 117 000 (the whole dataset) |
| 11 | 11.95 | 279 000 |
| 12 | 5.97 | 70 000 |
| 13 | 2.99 | 17 500 |
| 14 | 1.49 | 4 400 |

Even at an optimistic ~10 bytes per point, a z = 11 tile would be ≈ 2.8 MB — far beyond the 500 KB budget (this is an order-of-magnitude estimate; measure real sizes). Hence: aggregate below z = 13, individual points from z = 13.

**3. Hybrid tile function**

```sql
CREATE OR REPLACE FUNCTION postgisftw.poi_mvt(z integer, x integer, y integer)
RETURNS bytea LANGUAGE sql STABLE PARALLEL SAFE AS $$
  WITH env AS (
    SELECT ST_TileEnvelope(z, x, y) AS g3857, 156543.03392804097 / (2 ^ z) AS res
  ),
  agg AS (                                                   -- z < 13: ~32-pixel grid cells with counts
    SELECT ST_SnapToGrid(ST_Transform(p.geom, 3857), env.res * 32) AS cell, count(*) AS n
    FROM city.poi p, env
    WHERE z < 13 AND p.geom && ST_Transform(env.g3857, 4326)
    GROUP BY 1
  ),
  mvtgeom AS (
    SELECT NULL::bigint AS id, agg.n AS point_count,
           ST_AsMVTGeom(agg.cell, env.g3857, 4096, 64, true) AS geom
    FROM agg, env
    UNION ALL
    SELECT p.id, 1 AS point_count,
           ST_AsMVTGeom(ST_Transform(p.geom, 3857), env.g3857, 4096, 64, true)
    FROM city.poi p, env
    WHERE z >= 13 AND p.geom && ST_Transform(env.g3857, 4326)
  )
  SELECT COALESCE(ST_AsMVT(mvtgeom.*, 'poi', 4096, 'geom', 'id'), ''::bytea) FROM mvtgeom;
$$;
GRANT EXECUTE ON FUNCTION postgisftw.poi_mvt(integer, integer, integer) TO tile_reader;
```

The predicates `z < 13` / `z >= 13` depend only on the function parameter, so PostgreSQL can skip the branch that does not apply (look for a *One-Time Filter* in the plan). Cells are snapped to a global grid, so a cell that straddles a tile edge may appear with partial counts in two tiles (pitfall 12).

**4. Pre-generated alternative**

```bash
ogr2ogr -f GeoJSONSeq poi.geojsonl PG:"host=localhost dbname=gis user=postgres password=postgres" city.poi
tippecanoe -o poi.mbtiles -l poi -zg --drop-densest-as-needed --force poi.geojsonl
martin poi.mbtiles                         # http://localhost:3000/poi/{z}/{x}/{y}
```

**5. Benchmark and purge helpers** — `bench.py` (needs Exercise 1's module):

```python
"""Latency / size benchmark for a tile endpoint (Exercise 3). Needs: pip install requests"""
import random
import statistics
import time

import requests
from tile_math_solution import lonlat_to_tile        # your Exercise 1 module

BBOX = (4.70, 52.28, 5.10, 52.45)                     # west, south, east, north (lon/lat)
DYNAMIC = "http://localhost:7800/postgisftw.poi_mvt/{z}/{x}/{y}.pbf"
STATIC = "http://localhost:3000/poi/{z}/{x}/{y}"      # Martin serving poi.mbtiles
random.seed(7)

def sample(n, zooms):
    for _ in range(n):
        z = random.choice(zooms)
        lon, lat = random.uniform(BBOX[0], BBOX[2]), random.uniform(BBOX[1], BBOX[3])
        x, y = lonlat_to_tile(lon, lat, z)
        yield z, x, y

def run(url_tpl, tiles):
    lat_ms, max_bytes = {}, {}
    with requests.Session() as s:
        for z, x, y in tiles:
            t0 = time.perf_counter()
            r = s.get(url_tpl.format(z=z, x=x, y=y), timeout=30)
            dt = (time.perf_counter() - t0) * 1000
            r.raise_for_status()
            lat_ms.setdefault(z, []).append(dt)
            max_bytes[z] = max(max_bytes.get(z, 0), len(r.content))   # decoded size; see Content-Length for wire size
    for z in sorted(lat_ms):
        v = sorted(lat_ms[z])
        p95 = v[min(len(v) - 1, int(0.95 * len(v)))]
        print(f"z{z:>2} n={len(v):>3} p50={statistics.median(v):7.1f} ms p95={p95:7.1f} ms max={max_bytes[z]:>8} B")

if __name__ == "__main__":
    tiles = list(sample(300, [8, 9, 10, 11, 12, 13, 14]))
    print("dynamic:"); run(DYNAMIC, tiles)
    print("static:");  run(STATIC, tiles)
```

`purge.py`:

```python
"""Which tiles must be invalidated after an edit? (Exercise 3 / 4)"""
import math

PAD = 64 / 4096          # the MVT buffer (64 of 4096 units) as a fraction of a tile

def _frac(lon: float, lat: float, z: int) -> tuple[float, float]:
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n
    return x, y

def tiles_to_purge(west, south, east, north, zmin, zmax):
    """Tiles whose content (including the buffer) can change when something inside the bbox changes."""
    for z in range(zmin, zmax + 1):
        n = 2 ** z
        xw, yn = _frac(west, north, z)
        xe, ys = _frac(east, south, z)
        for x in range(max(0, math.floor(xw - PAD)), min(n - 1, math.floor(xe + PAD)) + 1):
            for y in range(max(0, math.floor(yn - PAD)), min(n - 1, math.floor(ys + PAD)) + 1):
                yield (z, x, y)

if __name__ == "__main__":
    one = list(tiles_to_purge(4.9, 52.37, 4.9, 52.37, 12, 12))
    assert one == [(12, 2103, 1346)], one                 # interior point: a single tile
    edge_lon = 4.833984375 + 0.0001                       # just inside the west edge of tile 12/2103/1346
    two = list(tiles_to_purge(edge_lon, 52.37, edge_lon, 52.37, 12, 12))
    assert (12, 2102, 1346) in two and (12, 2103, 1346) in two, two     # buffer reaches the neighbour
    print(len(list(tiles_to_purge(4.9, 52.37, 4.9, 52.37, 8, 16))), "tiles for one point, z8-z16")
    print("ok")
```

The padding `64 / 4096` mirrors the tile buffer: an edit within that distance of a tile edge changes the *neighbouring* tile's buffered content, so the neighbour must be refreshed too. A single interior point at z = 8…16 touches 11 tiles (one per zoom plus two buffer neighbours — the exact number is what `purge.py` prints).

**6. Heatmap → points hand-over**

```js
map.addSource('poi', { type: 'vector', tiles: ['http://localhost:7800/postgisftw.poi_mvt/{z}/{x}/{y}.pbf'], maxzoom: 16 });
map.addLayer({ id: 'poi-heat', type: 'heatmap', source: 'poi', 'source-layer': 'poi', maxzoom: 13,
  paint: { 'heatmap-weight': ['interpolate', ['linear'], ['get', 'point_count'], 1, 0.05, 200, 1],
           'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 8, 12, 24] } });
map.addLayer({ id: 'poi-points', type: 'circle', source: 'poi', 'source-layer': 'poi', minzoom: 13,
  paint: { 'circle-radius': 3, 'circle-color': '#1565c0' } });
```

Below z = 13 the tiles contain aggregated cells (weight = `point_count`); from z = 13 they contain real points. Matching the heatmap's `maxzoom` with the function's switch zoom keeps the data and the symbology consistent.

**Interpretation of results (what you should find).**
- Static (Tippecanoe/Martin) tiles answer in a nearly constant, small time at every zoom, and Tippecanoe enforces the tile-size budget by construction.
- Dynamic tiles are fast at high zoom (small index-assisted scans) but become slow at the lowest benchmarked zooms because a single tile touches a large share of the million rows. Exact numbers depend on your hardware.
- Recommended pattern (justify with *your* measurements): **hybrid** — serve low zooms from pre-aggregated or pre-generated tiles (they change rarely and are expensive to compute) and high zooms dynamically (they are cheap and reflect edits immediately).

