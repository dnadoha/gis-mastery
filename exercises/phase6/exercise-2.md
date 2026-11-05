### Exercise 2 — Intermediate: change detection and accuracy assessment

**Task.** Using your NDVI arrays from Exercise 1:

a. Compute $\Delta\text{NDVI}=\text{NDVI}_{t2}-\text{NDVI}_{t1}$ and flag **vegetation loss** where $\Delta\text{NDVI}<-0.30$ and the pixel is valid.

b. Build the confusion matrix against `REFERENCE_CHANGE` (valid pixels only). Report TP, FP, FN, TN, overall accuracy, user's accuracy and producer's accuracy for the *change* class, F1, and Cohen's kappa. Report the detected area in hectares.

c. Repeat (a)–(b) for thresholds $-0.15$, $-0.30$, $-0.50$, and $-0.70$. Present a table and state which threshold you would choose and why.

d. Identify the one false-positive and the one false-negative pixel at threshold $-0.30$. Propose a physically plausible explanation for each.

**Prerequisites.** Exercise 1; Sections B.4 and B.5.

**Sample input.** NDVI arrays and valid mask from Exercise 1; `REFERENCE_CHANGE`.

**Expected deliverable.** A function `evaluate(threshold)` that returns the metrics, plus the threshold table and a short written justification (3–5 sentences).

**Success criteria.**
- Counts add up to the number of valid pixels (15).
- The cloud pixel appears in neither the numerator nor the denominator of any metric.
- Your justification mentions the trade-off between omission and commission errors and acknowledges that 15 pixels is far too few for a real accuracy assessment.

**Hint.** With rows as map and columns as reference, $\text{UA}=TP/(TP+FP)$ and $\text{PA}=TP/(TP+FN)$ for the change class.

---

