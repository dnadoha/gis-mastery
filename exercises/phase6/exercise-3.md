### Exercise 3 — Advanced: spatial structure of change, and spatial cross-validation

**Part A (builds on Exercise 2, threshold $-0.30$ map and the $\Delta\text{NDVI}$ array).**

a. Compute **global Moran's I** for $\Delta\text{NDVI}$ over the 15 valid pixels using **queen** contiguity (binary weights; drop the cloud pixel from both the values and the weights matrix). Use a permutation test with 9,999 permutations and seed 42. Report $I$, $E[I]$, the simulated mean and standard deviation, the z-score, and *both* a two-sided p-value and a one-sided (upper-tail) p-value.

b. Compute **Getis-Ord $G_i^*$** (binary queen weights including the pixel itself) for each valid pixel and list the pixels with $|z|>1.96$.

c. Explain in 3–5 sentences: Why can the local statistic find a significant cold spot even when the global statistic is only borderline? Why is a positive $G_i^*$ here *not* evidence of vegetation gain? Why should you be cautious about these p-values with $n=15$?

**Part B (links the autocorrelation concept to model validation; uses the generator from Worked Example 4).**

d. Compute Moran's I of $y$ with $k=8$ nearest-neighbor binary weights, and compute an empirical semivariogram of $y$ with 5-unit lags up to 55. Estimate the **range** (where the semivariogram levels off).

e. Run the random-forest experiment with random 5-fold CV and with block CV for block sizes 10, 20, 25, and 34 units. Plot or tabulate $R^2$ against block size.

f. Choose and defend a block size, and describe how the score changes as blocks approach and exceed the range.

**Prerequisites.** Exercises 1–2; Sections A.6 and D.3; Worked Examples 2 and 4.

**Sample input.** $\Delta\text{NDVI}$ and valid mask from Exercise 2; the generator code from Section 5.4.

**Expected deliverable.** One script or notebook with a results table for Part A (statistics and a 4 × 4 grid of $G_i^*$ z-scores with `NaN` for the cloud pixel) and Part B (semivariogram table, Moran's I, $R^2$ per block size), plus a half-page written interpretation.

**Success criteria.**
- Weights matrices are symmetric with a zero diagonal for Moran's I and a unit diagonal for $G_i^*$.
- The permutation test uses the same observed statistic and weights as the analytic calculation.
- The block-size choice is justified by the semivariogram range, not by picking the highest score.

**Hint.** Build the 16 × 16 queen matrix first, then subset rows and columns with `np.ix_` to remove the cloud pixel. For the semivariogram, `scipy.spatial.distance.pdist` gives pairwise distances and half squared differences in two calls.

---

