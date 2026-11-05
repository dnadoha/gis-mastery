### Solution 2 — polygon layer: vector tiles + OGC API

**1. Load and prepare**

```bash
ogr2ogr -f PostgreSQL PG:"host=localhost dbname=gis user=postgres password=postgres" \
  ne_10m_admin_1_states_provinces.shp \
  -lco SCHEMA=city -nln areas -lco GEOMETRY_NAME=geom -lco FID=id \
  -nlt PROMOTE_TO_MULTI -t_srs EPSG:4326 -overwrite
```

```sql
UPDATE city.areas SET geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3)) WHERE NOT ST_IsValid(geom);
ALTER TABLE city.areas ADD COLUMN area_m2 double precision;
UPDATE city.areas SET area_m2 = ST_Area(geom::geography);      -- true area on the ellipsoid
ANALYZE city.areas;
GRANT SELECT ON city.areas TO tile_reader;
```
(`ogr2ogr` creates a GiST index by default; adjust the attribute names — here `name` — to your dataset.)

**2. Tile function** (same pattern as `parcels_mvt` in Section 4.3)

```sql
CREATE OR REPLACE FUNCTION postgisftw.areas_mvt(z integer, x integer, y integer)
RETURNS bytea LANGUAGE sql STABLE PARALLEL SAFE AS $$
  WITH env AS (
    SELECT ST_TileEnvelope(z, x, y) AS g3857, 156543.03392804097 / (2 ^ z) AS res
  ),
  mvtgeom AS (
    SELECT a.id, a.name, a.area_m2,
           ST_AsMVTGeom(ST_SimplifyPreserveTopology(ST_Transform(a.geom, 3857), env.res),
                        env.g3857, 4096, 64, true) AS geom
    FROM city.areas a, env
    WHERE a.geom && ST_Transform(env.g3857, 4326)
      AND (z >= 8 OR a.area_m2 >= env.res * env.res * 16)
  )
  SELECT COALESCE(ST_AsMVT(mvtgeom.*, 'areas', 4096, 'geom', 'id'), ''::bytea) FROM mvtgeom;
$$;
GRANT EXECUTE ON FUNCTION postgisftw.areas_mvt(integer, integer, integer) TO tile_reader;
```

**3. Client** (add to the MapLibre page from Section 5.7)

```js
map.addSource('areas', { type: 'vector', tiles: ['http://localhost:7800/postgisftw.areas_mvt/{z}/{x}/{y}.pbf'], maxzoom: 12 });
map.addLayer({ id: 'areas-fill', type: 'fill', source: 'areas', 'source-layer': 'areas',
  paint: { 'fill-opacity': 0.7,
           'fill-color': ['step', ['get', 'area_m2'], '#edf8fb', 1e9, '#b3cde3', 1e10, '#8c96c6', 1e11, '#88419d'] } });
map.addLayer({ id: 'areas-line', type: 'line', source: 'areas', 'source-layer': 'areas',
  paint: { 'line-color': '#333', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.3, 10, 1.5] } });

map.on('click', 'areas-fill', async (e) => {
  const id = e.features[0].id;                                   // from ST_AsMVT's id column
  const f = await (await fetch(`http://localhost:9000/collections/city.areas/items/${id}`)).json();
  const div = document.createElement('div');
  div.textContent = `${f.properties.name}: ${Math.round(f.properties.area_m2 / 1e6).toLocaleString()} km²`;
  new maplibregl.Popup().setLngLat(e.lngLat).setDOMContent(div).addTo(map);     // textContent, not HTML: no XSS
});
```

**4. Verify**

```bash
# tile for your landmark: compute (z, x, y) with Exercise 1, then
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://localhost:7800/postgisftw.areas_mvt/10/<x>/<y>.pbf
curl -s "http://localhost:9000/collections/city.areas/items?limit=5" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['features']))"   # expected 5
```

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM city.areas a WHERE a.geom && ST_Transform(ST_TileEnvelope(10, <x>, <y>), 4326);
-- expect a Bitmap/Index scan on the GiST index (its name varies) for a small tile;
-- a very large tile covering most of the table may legitimately choose a sequential scan.
```

**Showing the LOD/simplification benefit.** Create a copy of the function without `ST_SimplifyPreserveTopology` and without the area test (`areas_mvt_raw`), request the same low-zoom tile from both, and record `size_download`. The reduction is dataset-dependent; the point is to measure it rather than assume it. Decode the tile with `mapbox_vector_tile` (Section 5.5) to confirm the layer name is `areas` and that the polygon containing your landmark is present in the tile Exercise 1 predicted.

