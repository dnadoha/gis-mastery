### Exercise 3 (Intermediate): From ASCII grid to verified COG

**Task.**
1. Run `make_dem.py` (§5.6) to create `dem.asc`.
2. Create `dem.tif` (with CRS `EPSG:28992`, NoData `-9999`, tiled, `DEFLATE`, predictor 3) and `dem_cog.tif` with `gdal_translate`.
3. Compare `gdalinfo -stats` output with the statistics printed by `make_dem.py`.
4. Compute by hand the sizes of overview levels 2, 4 and 8 of the base raster, and the uncompressed size in bytes of the base `Float32` pixel data.
5. Create `dem_no_nodata.tif` **without** setting NoData and compare its statistics to `dem.tif`. Explain the difference.
6. Answer: which resampling would you use when reprojecting (a) this DEM and (b) a land-use class raster? Why?

**Prerequisites.** Exercise 1 working environment; §4.3; §4.6.2–4.6.3.

**Sample input.** Output of `make_dem.py` (`dem.asc`, 1200 × 800 cells, 2.5 m, lower-left `(121000, 486000)`).

**Deliverable.** `raster_report.md` with the `gdalinfo` excerpts, your hand calculations and the answers.

**Success criteria.**
- Size `1200 × 800`; upper-left origin `(121000.0, 488000.0)`; pixel size `(2.5, -2.5)`.
- Valid-cell statistics: min 2.00, max 10.00, mean ≈ 3.0096; without NoData the minimum becomes `-9999`.
- Correct overview sizes and byte count; correct resampling answers with reasons.

**Hint.** `Float32` uses 4 bytes per cell. GDAL derives the upper-left origin from the *lower-left* header values of an Esri ASCII grid.

---

