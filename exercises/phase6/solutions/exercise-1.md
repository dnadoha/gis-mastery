### Solution 1

```python
# (a) DN -> reflectance -> NDVI
r = 10909 * 0.0000275 - 0.2
n = 14545 * 0.0000275 - 0.2
print("1a reflect", round(r, 4), round(n, 4), "NDVI", round((n - r) / (n + r), 4))

# (b) and (c)
red1, nir1 = bands(T1)
red2, nir2 = bands(T2)
N1, N2 = ndvi(red1, nir1), ndvi(red2, nir2)
cloud = np.array([[c == "C" for c in row] for row in T2])
valid = ~cloud
print("N1\n", N1)
print("N2 (cloud -> nan)\n", np.where(valid, N2, np.nan))

# (d) classes on date 1
def klass(v):
    return np.select([v < 0, v < 0.2, v < 0.5], ["water", "bare", "sparse"], "dense")

k1 = klass(N1)
for c in ("dense", "sparse", "bare", "water"):
    cnt = (k1 == c).sum()
    print("1d", c, cnt, "px", round(cnt * 900 / 1e4, 2), "ha")
```

**Output:**

```text
1a reflect 0.1 0.2 NDVI 0.3333
N1
 [[ 0.8    0.8    0.8    0.333]
 [ 0.8    0.8    0.8    0.333]
 [ 0.8    0.8    0.167  0.167]
 [ 0.8    0.8   -0.333 -0.333]]
N2 (cloud -> nan)
 [[ 0.167  0.167  0.8    0.167]
 [ 0.167  0.167  0.167  0.333]
 [ 0.8    0.8    0.167  0.167]
 [   nan  0.333 -0.333 -0.333]]
1d dense 10 px 0.9 ha
1d sparse 2 px 0.18 ha
1d bare 2 px 0.18 ha
1d water 2 px 0.18 ha
```

**Reasoning and verification.**

- (a) $10909\times0.0000275=0.29999$, minus $0.2$ gives $\approx0.100$; $14545\times0.0000275=0.39999$, minus $0.2$ gives $\approx0.200$. NDVI $=(0.2-0.1)/(0.2+0.1)=0.333$, which is a sparse-vegetation pixel, consistent with the `S` row of the lookup table.
- (b) Hand check for `V`: $(0.45-0.05)/(0.45+0.05)=0.80$. For `B`: $(0.28-0.20)/(0.28+0.20)=0.1667$. For `W`: $(0.02-0.04)/(0.02+0.04)=-0.333$.
- (d) The class areas are $0.90+0.18+0.18+0.18=1.44$ ha, equal to $16\times0.09$. ✓
- The cloud pixel's computed NDVI would be $0.05/0.65=0.077$, a plausible-looking "bare" value. This is the reason the mask must be applied *before* any change calculation and not inferred from NDVI values.

