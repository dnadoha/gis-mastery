# Source solution (read the correction notes first)

### Solution 5

**Directory layout**

```text
release/
├── README.md
├── checks.json
├── verify_package.py            (plus the helper modules it imports)
├── requests.md
├── metadata/parcels.xml
├── raster/dem_cog.tif
├── tiles/parcels.pmtiles
└── vector/
    ├── parcels.gpkg
    ├── parcels.geojson           (RFC 7946, from parcels.gpkg)
    └── parcels.fgb
```

**Build**

```bash
mkdir -p release/vector release/tiles release/raster release/metadata
ogr2ogr -f GPKG release/vector/parcels.gpkg parcels.geojson -nln parcels -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom
ogr2ogr -f GeoJSON release/vector/parcels.geojson release/vector/parcels.gpkg -t_srs EPSG:4326 -lco RFC7946=YES
ogr2ogr -f FlatGeobuf release/vector/parcels.fgb release/vector/parcels.gpkg
ogr2ogr -f MVT release/tiles/parcels.mbtiles release/vector/parcels.gpkg \
        -dsco FORMAT=MBTILES -dsco MINZOOM=10 -dsco MAXZOOM=16 -dsco NAME=parcels
pmtiles convert release/tiles/parcels.mbtiles release/tiles/parcels.pmtiles && rm release/tiles/parcels.mbtiles
cp dem_cog.tif release/raster/dem_cog.tif
```

`verify_package.py` (standard library only; it reports PASS on all 11 checks against my test fixtures. Note that the GeoPackage fixture was a hand-built SQLite file with the same registry fields, not a GDAL-written file, so run it on yours. Adapt file names to your tree: it reads `parcels_rfc7946.geojson`, `parcels.gpkg` and `dem.asc` in the current directory):

```python
#!/usr/bin/env python3
"""Verify the Phase 2 publishing package. Standard library only.
Expects in the current directory: parcels_rfc7946.geojson, parcels.gpkg, dem.asc
plus check_geojson.py, gpkg_blob.py, tilemath.py, tiles_cover.py from this note."""
import json, sqlite3, sys
from check_geojson import check_polygon
from gpkg_blob import parse_gpkg_blob
from tiles_cover import cover

EXPECTED_BBOX = (4.892, 52.3728, 4.8945, 52.3744)
results = []

def check(name, ok, detail=""):
    results.append({"check": name, "ok": bool(ok), "detail": detail})

# --- GeoJSON (RFC 7946 output) ---
fc = json.load(open("parcels_rfc7946.geojson", encoding="utf-8"))
n_json = len(fc["features"])
problems = []
xs, ys = [], []
for f in fc["features"]:
    g = f["geometry"]
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]   # MultiPolygon: list of polygons
    for poly in polys:
        problems += check_polygon(poly, f"feature {f.get('id', '?')}")
        for ring in poly:
            xs += [p[0] for p in ring]; ys += [p[1] for p in ring]
bbox = (min(xs), min(ys), max(xs), max(ys))
check("geojson: 3 features", n_json == 3, n_json)
check("geojson: RFC 7946 winding", not problems, problems)
check("geojson: bbox matches", all(abs(a - b) < 1e-7 for a, b in zip(bbox, EXPECTED_BBOX)), bbox)

# --- GeoPackage ---
con = sqlite3.connect("parcels.gpkg")
app_id = con.execute("PRAGMA application_id").fetchone()[0]
n_gpkg = con.execute("SELECT COUNT(*) FROM parcels").fetchone()[0]
srs = con.execute("SELECT srs_id FROM gpkg_contents WHERE table_name = 'parcels'").fetchone()[0]
blob = con.execute("SELECT geom FROM parcels LIMIT 1").fetchone()[0]
info = parse_gpkg_blob(bytes(blob))
check("gpkg: application_id is GPKG", app_id == 1196444487, app_id)
check("gpkg: feature count equals geojson", n_gpkg == n_json, n_gpkg)
check("gpkg: srs_id 4326", srs == 4326, srs)
env = info["envelope(minx,maxx,miny,maxy)"]
check("gpkg: first envelope inside dataset bbox",
      env is None or (EXPECTED_BBOX[0] <= env[0] and env[1] <= EXPECTED_BBOX[2]
                      and EXPECTED_BBOX[1] <= env[2] and env[3] <= EXPECTED_BBOX[3]), env)

# --- Tiles ---
tiles = list(cover(EXPECTED_BBOX, 10, 16))
check("tiles: 8 tiles for z10-16", len(tiles) == 8, len(tiles))

# --- DEM (independent parse of the ASCII grid) ---
with open("dem.asc") as f:
    hdr = {k.lower(): float(v) for k, v in (f.readline().split() for _ in range(6))}
    nodata = hdr["nodata_value"]
    n = s = 0; lo, hi = float("inf"), float("-inf")
    for line in f:
        for tok in line.split():
            v = float(tok)
            if v != nodata:
                n += 1; s += v; lo = min(lo, v); hi = max(hi, v)
mean = s / n
check("dem: 955000 valid cells", n == 955000, n)
check("dem: min 2.00 / max 10.00", (lo, hi) == (2.0, 10.0), (lo, hi))
check("dem: mean about 3.0096", abs(mean - 3.0096) < 5e-4, round(mean, 6))

json.dump(results, open("checks.json", "w"), indent=2)
for r in results:
    print(("PASS " if r["ok"] else "FAIL ") + r["check"], "" if r["ok"] else r["detail"])
sys.exit(0 if all(r["ok"] for r in results) else 1)
```

The script checks the *independent facts* you derived by hand (counts, bbox, winding, `application_id`, DEM statistics from the ASCII source). Add GDAL-based checks in your environment (for example compare `ogrinfo -so -al release/vector/parcels.fgb` feature count and extent, and `gdalinfo -stats release/raster/dem_cog.tif` min/max/mean against the same constants). **Verified run (test fixtures)**:

```text
PASS geojson: 3 features
PASS geojson: RFC 7946 winding
PASS geojson: bbox matches
PASS gpkg: application_id is GPKG
PASS gpkg: feature count equals geojson
PASS gpkg: srs_id 4326
PASS gpkg: first envelope inside dataset bbox
PASS tiles: 8 tiles for z10-16
PASS dem: 955000 valid cells
PASS dem: min 2.00 / max 10.00
PASS dem: mean about 3.0096
```

`requests.md`:

```text
# (a) OGC API - Features (first page, bbox in lon,lat order; CRS84 by default)
GET https://example.org/features/                       # landing page: find links first
GET https://example.org/features/conformance            # which conformance classes are implemented?
GET https://example.org/features/collections/parcels/items?limit=100&bbox=4.892,52.3728,4.8945,52.3744
#  -> follow the rel="next" link for further pages

# (b) Classic view services for tile 14/8414/5384 (first: GetCapabilities)
GET https://example.org/ows?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0
GET https://example.org/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=parcels&STYLES=&CRS=EPSG:3857&BBOX=543008.649,6865879.629,545454.634,6868325.614&WIDTH=256&HEIGHT=256&FORMAT=image/png
GET https://example.org/ows?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=parcels&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX=14&TILEROW=5384&TILECOL=8414&FORMAT=image/png

# (c) Classic WFS 2.0 equivalent of (a): capabilities first, then GetFeature with paging parameters
GET https://example.org/ows?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=2.0.0
GET https://example.org/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ns:parcels&COUNT=100&STARTINDEX=0&OUTPUTFORMAT=application/json&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=52.3728,4.892,52.3744,4.8945,urn:ogc:def:crs:EPSG::4326
```

In (c) the WFS 2.0 bbox in the `urn:ogc:def:crs:EPSG::4326` form is **lat,lon**, the opposite order of the OGC API request in (a); a mismatch is the classic bug. The first call for each family is the discovery document: `GetCapabilities` for classic services, `/` and `/conformance` for OGC APIs. Server specifics (namespace `ns`, layer names, supported `OUTPUTFORMAT`) must be read from the capabilities document, so treat the strings above as templates.

`metadata/parcels.xml`: start from the abridged record in §4.8.1, add a creation date, `lineage` text such as *"Converted from GeoJSON with ogr2ogr (GDAL version X) into GeoPackage (EPSG:4326, MultiPolygon). Derived RFC 7946 GeoJSON, FlatGeobuf and PMTiles (zoom 10–16). Elevation grid converted to COG with gdal_translate."*, and fill in a bbox of `4.892, 4.8945, 52.3728, 52.3744`. Produce a *valid* record with a catalogue editor; validate it with your catalogue's validator.

`README.md` skeleton (every claim backed by a check or a command output):

| File | Format and reason | CRS | Known limitation |
|------|-------------------|-----|------------------|
| `vector/parcels.gpkg` | GeoPackage: authoritative, editable, typed, indexed | EPSG:4326 | single writer; poor remote random access |
| `vector/parcels.geojson` | GeoJSON (RFC 7946): ubiquitous, for APIs/small payloads | WGS 84 (implicit) | no index, no schema, text bloat |
| `vector/parcels.fgb` | FlatGeobuf: Hilbert-indexed, HTTP-range friendly | EPSG:4326 | static index; one layer |
| `tiles/parcels.pmtiles` | PMTiles of MVT: serverless web-map delivery, z10–16 | EPSG:3857 tile grid | generalized geometry; not for analysis |
| `raster/dem_cog.tif` | COG: tiled, compressed, with overviews | EPSG:28992 | continuous-data resampling only; do not edit in place |
| `metadata/parcels.xml` | ISO 19139-style record | n/a | abridged: **not** an INSPIRE-conformity claim |

Add the output of `gdal-config --version` (or `gdalinfo --version`), the exact commands, and the statement "checks passed: see checks.json".

**What a strong solution shows.** A single authoritative source; every derived file traceable to a command; independent checks (not GDAL grading itself); correct axis orders in every request; honest limitations.

---

