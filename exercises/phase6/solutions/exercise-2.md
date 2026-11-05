### Solution 2

```python
d = N2 - N1
ref = np.zeros((4, 4), bool)
for rc in [(0, 0), (0, 1), (1, 0), (1, 1), (1, 2), (0, 3)]:
    ref[rc] = True

def metrics(det):
    TP = (det & ref & valid).sum();  FP = (det & ~ref & valid).sum()
    FN = (~det & ref & valid).sum(); TN = (~det & ~ref & valid).sum()
    N = TP + FP + FN + TN
    oa = (TP + TN) / N
    pe = ((TP + FP) * (TP + FN) + (FN + TN) * (FP + TN)) / N**2
    ua = TP / (TP + FP) if TP + FP else float("nan")
    pa = TP / (TP + FN)
    f1 = 2 * TP / (2 * TP + FP + FN)
    kappa = (oa - pe) / (1 - pe)
    return TP, FP, FN, TN, oa, ua, pa, f1, kappa

print("2 dNDVI\n", np.where(valid, d, np.nan))
for t in (-0.15, -0.30, -0.50, -0.70):
    det = (d < t) & valid
    TP, FP, FN, TN, oa, ua, pa, f1, kappa = metrics(det)
    print(f"2 thr {t:5.2f} detected={det.sum()} TP={TP} FP={FP} FN={FN} TN={TN} "
          f"OA={oa:.3f} UA={ua:.3f} PA={pa:.3f} F1={f1:.3f} kappa={kappa:.3f} area={det.sum()*0.09:.2f} ha")
```

**Output:**

```text
2 dNDVI
 [[-0.633 -0.633  0.    -0.167]
 [-0.633 -0.633 -0.633  0.   ]
 [ 0.     0.     0.     0.   ]
 [   nan -0.467  0.     0.   ]]
2 thr -0.15 detected=7 TP=6 FP=1 FN=0 TN=8 OA=0.933 UA=0.857 PA=1.000 F1=0.923 kappa=0.865 area=0.63 ha
2 thr -0.30 detected=6 TP=5 FP=1 FN=1 TN=8 OA=0.867 UA=0.833 PA=0.833 F1=0.833 kappa=0.722 area=0.54 ha
2 thr -0.50 detected=5 TP=5 FP=0 FN=1 TN=9 OA=0.933 UA=1.000 PA=0.833 F1=0.909 kappa=0.857 area=0.45 ha
2 thr -0.70 detected=0 TP=0 FP=0 FN=6 TN=9 OA=0.600 UA=nan PA=0.000 F1=0.000 kappa=0.000 area=0.00 ha
```

**Answers.**

- (a)/(b) At $-0.30$: 6 pixels detected (0.54 ha), $TP=5$, $FP=1$, $FN=1$, $TN=8$ (total 15). $\text{OA}=13/15=0.867$, $\text{UA}=\text{PA}=5/6=0.833$, $F_1=0.833$, $\kappa=0.722$.
- (c) The best $F_1$ in this table is at $-0.15$ (0.923), then $-0.50$ (0.909). A threshold of $-0.15$ catches the subtle loss at (0,3) (sparse vegetation becoming bare, $\Delta\text{NDVI}=-0.167$) but would be fragile on real data, where seasonal and illumination noise easily exceeds 0.15. The threshold $-0.50$ is conservative: no false alarms and one omission. A defensible choice is **$-0.50$ for a "high-confidence loss" map** (no commission error) with a note that it misses subtle loss, or $-0.15$ if the agency prefers not to miss changes and can afford to review false alarms. The key point is that the choice depends on the cost of omission vs. commission. With only 15 valid pixels, these differences are one pixel each, so no threshold can be called statistically better; a real assessment needs hundreds of independent samples.
- (d) The **false positive** at (3,1) went from dense vegetation to sparse vegetation ($\Delta=-0.467$), but the reference says no change: plausible causes are crop harvest or mowing, phenology, or a thin cloud/shadow edge next to the masked cloud pixel at (3,0). The **false negative** at (0,3) is a sparse-vegetation pixel that became bare ($\Delta=-0.167$): its NDVI started low, so a change in absolute NDVI is small even though the *relative* change is large. This hints that a ratio or a class-aware rule might help.

