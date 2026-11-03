### Exercise 1 (Beginner): Inspect, check, and convert vector data

**Task.**
1. Save `parcels.geojson` from §5.1 and run `check_geojson.py` on it.
2. Convert it to a Shapefile, a GeoPackage (layer `parcels`), and a FlatGeobuf with `ogr2ogr`.
3. With `ogrinfo -so -al`, fill in this table for each output: feature count, CRS, geometry type, field names.
4. Produce an RFC 7946-compliant GeoJSON from the GeoPackage and show that the checker now reports no problems.
5. For each scenario choose one format and justify it in two sentences: (i) delivering data to a legacy system that only reads "Shapefiles"; (ii) the editable master copy with several layers; (iii) a large read-only layer fetched by a web map with a bounding-box filter over HTTP.

**Prerequisites.** GDAL/OGR installed; §4.2; §4.6.

**Sample input.** `parcels.geojson` (§5.1).

**Deliverable.** `report_ex1.md` containing the filled table, the checker output before and after, and the three justified choices.

**Success criteria.**
- All outputs have 3 features; the GPKG and FlatGeobuf keep the full field names.
- You identify exactly which Shapefile field names were changed and why the `population_*` fields are at risk.
- The only problem reported by the checker for the *original* file is the clockwise exterior ring of feature 2, and the RFC 7946 output reports none.
- Each format choice cites a concrete property (single file, index, HTTP range reads, limits).

**Hint.** If the Shapefile output reports renamed fields, trust `ogrinfo`, not your guess. For step 4 use `-lco RFC7946=YES` and `-t_srs EPSG:4326`.

---

