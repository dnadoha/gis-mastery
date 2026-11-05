### Exercise 2 — Intermediate: publish a polygon layer as vector tiles and OGC API Features

**Task.** Using the tile math from Exercise 1 and the stack pattern of Section 5, publish a **polygon** dataset:
1. Load a polygon layer with at least ~1 000 features into PostGIS as `city.areas` (EPSG:4326, GiST index, valid geometries, an `area_m2` column).
2. Write `postgisftw.areas_mvt(z, x, y)` with ~1-pixel simplification and an area-based LOD rule.
3. Serve it with pg_tileserv; publish the table through pg_featureserv.
4. Build a MapLibre page that draws a **choropleth** (data-driven fill by `area_m2`), zoom-dependent outline width, and a click popup that fetches the full feature from the OGC API by id.

**Prerequisites.** Exercise 1; Sections 4.3–4.7 and 5.

**Sample input.** Any polygon dataset such as first-level administrative boundaries (for example the Natural Earth *admin-1* layer) or municipal boundaries from your region. Pick one landmark (lon/lat) inside the dataset.

**Expected deliverable.** `docker-compose.yml`, SQL file(s), `index.html`, and a short `RESULTS.md` containing: tile size (bytes) of one low-zoom and one high-zoom tile, the `EXPLAIN` output of the tile query, and the tile address of your landmark at z = 10 computed with your Exercise 1 module.

**Success criteria.**
- `curl` on a tile URL returns `200` with a non-empty MVT; the decoded tile has the layer name used in your style.
- The tile containing your landmark (computed by Exercise 1) includes the polygon that contains the landmark.
- Low-zoom tiles are smaller than they would be without simplification/LOD (show both numbers).
- `GET /collections/city.areas/items?limit=5` returns five GeoJSON features; the popup shows data fetched from `…/items/{id}`.
- The tile query plan uses the GiST index on tiles that cover a small part of the dataset.

**Hint.** Load with `ogr2ogr -f PostgreSQL … -lco SCHEMA=city -nln areas -lco GEOMETRY_NAME=geom -nlt PROMOTE_TO_MULTI`; run `ANALYZE`; start from the `parcels_mvt` function in Section 4.3.

