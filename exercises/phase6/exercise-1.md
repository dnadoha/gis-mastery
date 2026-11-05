### Exercise 1 — Beginner: from digital numbers to an NDVI map

**Task.**

a. A Landsat 8 Collection 2 Level-2 pixel has digital numbers $\text{DN}_{\text{red}}=10909$ and $\text{DN}_{\text{NIR}}=14545$. Convert them to surface reflectance using $\rho=\text{DN}\times0.0000275-0.2$, then compute NDVI.

b. Build the red and NIR arrays for `T1` and `T2` from the lookup table and compute NDVI for both dates.

c. Mask the cloud pixel on date 2 (set it to `NaN`).

d. Classify the date 1 NDVI into **water** ($<0$), **bare** ($0$ to $<0.2$), **sparse vegetation** ($0.2$ to $<0.5$), and **dense vegetation** ($\ge0.5$). Report the number of pixels and the area in hectares for each class.

**Prerequisites.** NumPy; Sections B.2 and B.3.

**Sample input.** The shared dataset above.

**Expected deliverable.** A short script that prints (a) NDVI for the single pixel, (b) two 4 × 4 NDVI arrays, (c) the masked date 2 array, (d) a class table (class, pixels, hectares).

**Success criteria.**
- NDVI values are computed from reflectance, not from raw DN.
- The cloud pixel is `NaN` and not silently treated as a valid low-NDVI pixel.
- The class areas sum to $16\times0.09=1.44$ ha.

**Hint.** `np.select` with a list of conditions makes the classification a single expression. Use `np.nan` for masked values and `np.where` for the mask.

---

