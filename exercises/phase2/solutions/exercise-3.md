# Source solution (read the correction notes first)

### Solution 3

```bash
python3 make_dem.py
gdal_translate -of GTiff -a_srs EPSG:28992 -a_nodata -9999 \
  -co TILED=YES -co COMPRESS=DEFLATE -co PREDICTOR=3 dem.asc dem.tif
gdal_translate -of COG dem.tif dem_cog.tif -co COMPRESS=DEFLATE -co PREDICTOR=3 -co BLOCKSIZE=256 -co RESAMPLING=AVERAGE
gdal_translate -of GTiff -a_srs EPSG:28992 dem.asc dem_no_nodata.tif      # no NoData set on purpose
gdalinfo -stats dem.tif
gdalinfo -stats dem_no_nodata.tif
gdalinfo dem_cog.tif
ls -l dem.asc dem.tif dem_cog.tif
```

**Hand calculations (verified).**
- Origin: `(121000.0, 486000.0 + 800 × 2.5) = (121000.0, 488000.0)`; pixel size `(2.5, −2.5)`; lower-right `(124000.0, 486000.0)`.
- Overview sizes with `ceil(size / factor)`: factor 2 → `600 × 400`; factor 4 → `300 × 200`; factor 8 → `150 × 100`.
- Uncompressed base pixel data: `1200 × 800 × 4 bytes = 3,840,000 bytes`.
- `dem.tif` with `DEFLATE` + predictor 3 should be **smaller** than 3,840,000 bytes plus overhead (a smooth surface compresses well); `dem_cog.tif` is somewhat larger than `dem.tif` because it also stores overviews (about one third more pixels before compression).

**Statistics.** With NoData set: valid cells 955,000; min `2`, max `10`, mean ≈ `3.0096`. Without NoData: the 5,000 cells of `-9999` count as data, so the minimum is `-9999` and the mean becomes `(2,874,135.74 + 5,000 × (−9999)) / 960,000 ≈ −49.08`. **Explanation:** a missing NoData declaration turns a sentinel value into "elevation", which corrupts statistics, colour ramps, resampling (averaging `-9999` with real heights creates fake slopes) and any analysis. **Verify** by comparing `gdalinfo -stats` of both files with `make_dem.py` output (mean `3.0096` for valid cells).

**Resampling.** (a) DEM = continuous data → `bilinear` or `cubic` (and `average` when downsampling strongly) so values vary smoothly; `nearest` would create blocky steps but would not invent new values. (b) A class raster = categorical → `near` or `mode`, because bilinear/average produce class codes that do not exist (the average of classes 1 and 3 is 2, a different class). The same logic applies to **COG overviews**: use `-co RESAMPLING=NEAREST` (or `MODE`) for categorical data.

---

