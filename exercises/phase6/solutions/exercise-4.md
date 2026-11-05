### Solution 4 (Applied Challenge) — approach and grading rubric

Because the data and area are your own, there is no single numeric answer. A strong solution follows this structure:

1. **Skeleton (unexecuted sketch).**

```python
# 1. Search and load (see B.1), with per-asset scale/offset verified
items = search(bbox, "YEAR_A-06-01/YEAR_A-08-31", cloud_lt=30) ; items_b = search(bbox, "YEAR_B-06-01/YEAR_B-08-31", cloud_lt=30)
ds_a, ds_b = load(items_a), load(items_b)

# 2. Mask, convert, composite
def composite(ds):
    refl = {b: s2_l2a_reflectance(ds[b]) for b in ("red", "nir", "swir22")}
    valid = ~ds.scl.isin([0, 1, 3, 8, 9, 10, 11])
    return {b: refl[b].where(valid).median("time") for b in refl}

# 3. Indices, difference, threshold (Otsu or reference-based), minimum mapping unit
# 4. Aggregate to a 500 m grid -> fraction changed; Moran + Gi* (libpysal/esda); FDR adjustment
# 5. Stratified random reference sample -> confusion matrix -> Olofsson area-adjusted estimate + CI
# 6. RandomForest with random vs. spatial-block CV (block size from the semivariogram)
```

2. **Self-checks that verify your work.**
   - Pick one pixel, read its raw DN values from the COG, and compute NDVI by hand; it must equal your pipeline's value.
   - The sum of the confusion-matrix cells equals the number of reference samples.
   - The area-adjusted change area is generally *different from* the pixel-counted area (it corrects for commission and omission error); if they are identical, you did not use the estimator.
   - The random-CV score is greater than or equal to the spatial-CV score in most repeated runs; if not, check for a bug or a very small autocorrelation range.
   - Re-running with a different random seed changes the permutation p-values only in the last digits.

3. **Rubric (100 points).** Data handling and masking correctness (20); change map and justification of threshold/MMU (15); hotspot analysis with weights stated and multiple testing addressed (15); accuracy assessment with sound sampling and area-adjusted estimate (25); ML with spatially valid CV and block-size justification (15); reproducibility and report quality (10). The optional CHM extension can earn up to 10 bonus points.

---

