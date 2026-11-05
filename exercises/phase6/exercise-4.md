### Exercise 4 — Applied challenge: end-to-end change analysis on real data

**Scenario.** A forestry agency wants a map of vegetation loss between two summers in a 10 km × 10 km area of interest (AOI), with an honest accuracy statement, a hotspot map to target field inspection, and a classifier-based second opinion.

**Task.**

1. **Data.** Choose an AOI (an area you know, with some visible change such as clearing, burn, or construction). Using STAC, find cloud-filtered Sentinel-2 L2A scenes for the same season in two different years. Build a median composite for each year after applying scale/offset and cloud masks.
2. **Indices.** Compute NDVI and NBR for both composites. Produce $\Delta$NDVI and dNBR.
3. **Change map.** Threshold with a method you can defend (reference-based or Otsu). Apply a minimum mapping unit of your choice. Report the area of change in hectares.
4. **Hotspots.** Aggregate the change to a 500 m grid as the **fraction of changed pixels per cell**. Compute global Moran's I and $G_i^*$ with queen weights, and map cells with significant hot spots (state your multiple-testing approach).
5. **Accuracy.** Create a stratified random reference sample of at least 100 points (strata: mapped change and mapped no-change). Label them from high-resolution imagery or independent evidence. Report the confusion matrix, UA/PA/F1 and an **area-adjusted** change estimate with a confidence interval.
6. **ML second opinion.** Train a random forest to predict your reference labels (or a larger labeled set) from per-pixel features (bands, indices, slope if available). Evaluate with **spatial block CV** where the block size is justified by a semivariogram or Moran's I analysis, and compare with random CV.
7. **Optional 3D extension.** If a LiDAR tile covers part of the AOI, derive a CHM with PDAL and examine whether the cleared areas show reduced canopy height.

**Prerequisites.** Exercises 1–3 and Sections B.1–B.5, D.3 (and C.3 for the extension).

**Sample input.**

```text
AOI:      bbox = [min_lon, min_lat, max_lon, max_lat]   (about 10 km x 10 km, your choice)
Dates:    summer window year A, summer window year B (e.g. 2024-06-01/2024-08-31 and 2026-06-01/2026-08-31)
Catalog:  a public STAC API and the "sentinel-2-l2a" collection
```

**Expected deliverable.** A reproducible repository containing: a README with the AOI, dates, STAC item IDs, software versions, and random seeds; scripts or a notebook that run end to end; outputs (change raster as a COG, hotspot GeoPackage, reference sample, accuracy tables); and a 2-page report with maps, the accuracy statement, and a limitations section.

**Success criteria.**
- The workflow re-runs from raw STAC queries to final tables without manual edits.
- Scale/offset and cloud masking are unit-tested on a pixel you verified by hand.
- The report states the **area-adjusted** change area with an interval, not only the pixel-count area.
- The random-versus-spatial CV gap is reported and discussed.
- Every threshold, bandwidth, weight scheme, and block size is stated and justified.

**Hint.** Start with a tiny sub-AOI (1 km × 1 km) and a single scene pair to debug, then scale up. Keep the reference sample out of every training and threshold-tuning step. For the area-adjusted estimator, use the formula in Section B.4 with the two mapped classes as strata.

---

