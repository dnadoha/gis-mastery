### Exercise 5 (Applied challenge): Build and verify a publishing package

**Task.** Assemble a small, verified "release" of the Amsterdam parcels and elevation data, as a data provider would for a municipality.

1. Directory layout `release/` with: `vector/parcels.gpkg` (authoritative), `vector/parcels.geojson` (RFC 7946), `vector/parcels.fgb`, `tiles/parcels.pmtiles` (or the MVT directory/MBTiles if the `pmtiles` tool is unavailable), `raster/dem_cog.tif`, `metadata/parcels.xml` (an abridged ISO 19139-style record), `README.md`.
2. `verify_package.py`: a standard-library script that runs the checks listed under *Success criteria* and writes `checks.json`; exit code non-zero if any check fails.
3. `requests.md`: for the released data, write (a) an OGC API – Features request for the first page of parcels inside the dataset bbox, (b) the WMS 1.3.0 and WMTS requests for the z=14 tile, and (c) the equivalent *classic* WFS 2.0 request. Name the capabilities/conformance request a client should make first for each service family.
4. In `README.md`, justify each file's format in one sentence, list the CRS of every file, the tool versions used, and one known limitation per format (use §6).
5. In `metadata/parcels.xml`, record title, abstract, bbox, a creation date, and lineage text describing the conversion commands.

**Prerequisites.** Exercises 1 to 4; §4.5; §4.7; §4.8; §6.

**Sample input.** `parcels.geojson`, `dem.asc`, and the scripts from §5 and Exercise 4.

**Deliverable.** The complete `release/` directory plus `checks.json` showing all checks passed.

**Success criteria.**
- `verify_package.py` reports **PASS** for: GeoJSON has 3 features, RFC 7946 winding, bbox `[4.892, 52.3728, 4.8945, 52.3744]` (tolerance 1e-7); GeoPackage `application_id` is `1196444487`, row count equals the GeoJSON count, `srs_id` is 4326, the first geometry envelope lies inside the bbox; tile list gives 8 tiles for z10–16; DEM has 955,000 valid cells, min 2.00, max 10.00, mean ≈ 3.0096.
- Every file's CRS is documented; the OGC API request uses `bbox` in lon,lat order; the WMS 1.3.0 `EPSG:4326` example (if shown) uses lat,lon.
- The README does not claim anything the checks did not verify (for example, it does not claim INSPIRE conformity).

**Hint.** Build checks first (they define "done"), then produce the files. Keep each script small and re-run them after any conversion.

---

