### Exercise 3 (Advanced): rasters and scale

**Task.** Write `raster_ops.py` and `scale_demo.py`:

1. **Raster build and zonal statistics.** Create the 20 × 20, 100 m cell `elev.tif` (elevation = 10 + column index, `float32`, nodata −9999, EPSG:32631, top-left corner at local (0, 2000)). Using `rasterio.mask.mask` with the flood zone from Exercise 1, compute count, mean, min, max and the flooded area (count × cell area), and compare the area with the vector overlay result from Exercise 2.
2. **Reclassify.** Classify elevation into 1 (< 15), 2 (15 to < 20), 3 (≥ 20) and write `risk.tif` as `uint8` with nodata 0. Report the class counts for the whole raster and inside the flood zone.
3. **Windowed processing.** Without reading the whole raster at once, use `src.block_windows(1)` to compute (a) class counts for the whole raster and (b) zonal count/sum/mean for the flood zone (use `rasterio.features.geometry_mask` with `src.window_transform(window)` for each window). Verify both equal the full-read results.
4. **Spatial index vs naive.** Generate 100,000 random points (`numpy.random.default_rng(42)`, uniform over local x, y ∈ [0, 2000]) and count how many fall in each district with (i) `gpd.sjoin`, (ii) `shapely.contains_xy`, and (iii) a naive Python loop over 5,000 points against the district geometries; time (iii) against an indexed query on the same 5,000 points.
5. **Memory budget.** Compute the in-memory size of a 20,000 × 20,000 `float32` raster, the size of a 512 × 512 block, and the number of such blocks.

**Prerequisites.** Exercises 1 and 2; §3.5, §4.5, §4.8.

**Sample input.** Fixtures; the raster definition above.

**Expected deliverable.** The two scripts, `elev.tif`, `risk.tif`, and printed results.

**Success criteria.**

* Zonal stats: count 100, mean 19.5, min 15.0, max 24.0, area 1,000,000 m²; area equals the vector flood area.
* Class counts all cells `{1: 100, 2: 100, 3: 200}`; inside flood `{2: 50, 3: 50}`.
* Windowed results are **identical** to the full-read results (integer counts exactly; mean within 10⁻⁹).
* Methods (i) and (ii) give identical per-district counts; each of A, B, C holds approximately 25,000 points (within ±500), and roughly 25,000 points are in no district.
* Indexed query is clearly faster than the naive loop on the same points (record both timings).
* Memory: 1.6×10⁹ bytes (1.6 GB); block 1,048,576 bytes (1 MiB); 1,600 blocks.

**Hint.** For (iii) `[any(g.contains(Point(x, y)) for g in geoms) for ...]` is the naive baseline; for the indexed version use `shapely.STRtree(geoms).query(points_array, predicate="within")`. `np.bincount(classes, minlength=4)` accumulates class counts across blocks.

---

