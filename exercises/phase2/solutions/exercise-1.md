# Source solution (read the correction notes first)

### Solution 1

```bash
python3 check_geojson.py parcels.geojson

ogr2ogr -f "ESRI Shapefile" shp_out parcels.geojson -nln parcels -lco ENCODING=UTF-8
ogr2ogr -f GPKG parcels.gpkg parcels.geojson -nln parcels -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom
ogr2ogr -f FlatGeobuf parcels.fgb parcels.gpkg
ogr2ogr -f GeoJSON parcels_rfc7946.geojson parcels.gpkg -t_srs EPSG:4326 -lco RFC7946=YES

for f in shp_out/parcels.shp parcels.gpkg parcels.fgb parcels_rfc7946.geojson; do
  echo "== $f"; ogrinfo -so -al "$f"
done
python3 check_geojson.py parcels_rfc7946.geojson
```

**Expected table** (confirm with your GDAL version):

| Output | Features | CRS | Geometry type | Field names |
|--------|---------:|-----|---------------|-------------|
| Shapefile | 3 | WGS 84 (from `.prj`) | Polygon | `parcel_id`, `land_use_c` (renamed), and two fields that both start with `population` (the driver must alter at least one name; read the actual names from `ogrinfo`) |
| GeoPackage | 3 | `EPSG:4326` | Multi Polygon | `parcel_id`, `land_use_class`, `population_total`, `population_density` (plus `fid` and `geom`) |
| FlatGeobuf | 3 | `EPSG:4326` | Multi Polygon | same four fields |
| GeoJSON (RFC 7946) | 3 | WGS 84 | Polygon or Multi Polygon (as stored) | same four fields |

**Checker results.** Original: `features: 3`, `bbox: [4.892, 52.3728, 4.8945, 52.3744]`, one problem (feature 2 exterior ring is clockwise). RFC 7946 output: `problems: none` if your GDAL re-orients rings (it should in RFC 7946 mode). *Why this works:* the shoelace area of feature 2's ring is negative (clockwise); RFC 7946 mode writes exterior rings counter-clockwise, so the area becomes positive.

**Format choices.**
- (i) **Shapefile**: the receiving system dictates it. Mitigate its limits (rename fields, set `.cpg`, ship a data dictionary).
- (ii) **GeoPackage**: one file, SQL, typed attributes, any CRS, several layers, transactional edits, R-tree index.
- (iii) **FlatGeobuf**: the packed Hilbert R-tree sits before the features, so a client can use HTTP range requests to fetch only features inside a bounding box; GeoPackage is not designed for efficient remote random reads and GeoJSON must be downloaded and parsed in full.

**How to verify.** Counts match; field names equal in GPKG/FGB; the checker's winding result flips from one problem to none; `sqlite3 parcels.gpkg "PRAGMA application_id;"` returns `1196444487`.

---

