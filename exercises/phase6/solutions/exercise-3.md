### Solution 3

**Part A.**

```python
def queen(nr, nc):
    W = np.zeros((nr * nc, nr * nc))
    for i in range(nr):
        for j in range(nc):
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    if (di or dj) and 0 <= i + di < nr and 0 <= j + dj < nc:
                        W[i * nc + j, (i + di) * nc + j + dj] = 1
    return W

idx = np.flatnonzero(valid.ravel())
Wv = queen(4, 4)[np.ix_(idx, idx)]            # drop the cloud pixel from the weights
x = d.ravel()[idx]                            # and from the values

def morans_i(x, W):
    z = x - x.mean()
    return len(x) / W.sum() * (z @ W @ z) / (z @ z)

rng = np.random.default_rng(42)
I = morans_i(x, Wv)
sims = np.array([morans_i(rng.permutation(x), Wv) for _ in range(9999)])
p_two = (1 + np.sum(np.abs(sims - sims.mean()) >= abs(I - sims.mean()))) / 10000
p_up  = (1 + np.sum(sims >= I)) / 10000
print(f"3a n={len(x)} S0={Wv.sum():.0f} I={I:.3f} E[I]={-1/(len(x)-1):.3f} "
      f"sim_mean={sims.mean():.3f} sim_sd={sims.std():.3f} z={(I-sims.mean())/sims.std():.2f} "
      f"p_two={p_two:.4f} p_upper={p_up:.4f}")

Ws = Wv + np.eye(len(x))                      # include the pixel itself for Gi*
nn, xb = len(x), x.mean()
S = np.sqrt((x**2).mean() - xb**2)
gi = []
for i in range(nn):
    w = Ws[i]; sw = w.sum()
    gi.append((w @ x - xb * sw) / (S * np.sqrt((nn * (w**2).sum() - sw**2) / (nn - 1))))
G = np.full(16, np.nan); G[idx] = gi
print("3b Gi*\n", G.reshape(4, 4))
```

**Output:**

```text
3a n=15 S0=78 I=0.169 E[I]=-0.071 sim_mean=-0.071 sim_sd=0.126 z=1.91 p_two=0.0534 p_upper=0.0435
3b Gi*
 [[-2.925 -2.861 -0.95   0.411]
 [-1.76  -1.54   0.371  1.251]
 [-0.843 -0.58   0.95   1.54 ]
 [   nan  1.444  1.83   1.95 ]]
```

**Answers.**

- (a) $I=0.169$ versus $E[I]=-0.071$: weakly positive autocorrelation. The two-sided permutation p-value is $0.053$ (not significant at 5%) while the one-sided upper-tail p-value is $0.0435$ (significant). This is exactly why the **alternative hypothesis must be chosen before looking at the data**: with positive clustering expected (a clearing is contiguous), a one-sided test is defensible, but switching to it only after a borderline two-sided result is not.
- (b) Pixels with $|z|>1.96$: **(0,0) with $-2.93$** and **(0,1) with $-2.86$**, both **cold spots** (clustered large losses). The pixel at (3,3) is $1.95$, just below the threshold.
- (c) The global statistic averages over the whole scene, where most pixels have $\Delta\text{NDVI}=0$ and several isolated pixels differ; the *local* statistic focuses on the neighborhood around the clearing, where a large concentration of strongly negative values stands out. A **positive $G_i^*$** here means "less negative than the scene average": the scene mean is negative because of the clearing, so unchanged pixels sit above it. It is **not** a sign of vegetation gain. With $n=15$ the analytic z-score's normality assumption is weak, edge pixels have few neighbors (so $G_i^*$ is noisier there), and testing 15 locations at 5% means about one false alarm is expected; adjust for multiple testing and treat results as exploratory.

**Part B.**

```python
# Uses the data generator from Section 5.4 (rng seed 0, n = 1500, rf = RandomForestRegressor(...)).
import numpy as np
from scipy.spatial import cKDTree
from scipy.spatial.distance import pdist
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import GroupKFold, KFold, cross_val_predict

rng = np.random.default_rng(0)
n = 1500
xy = rng.uniform(0, 100, (n, 2))
K = 40
w = rng.normal(0, 0.1, (K, 2)); phase = rng.uniform(0, 2 * np.pi, K)
field = np.sqrt(2 / K) * np.cos(xy @ w.T + phase).sum(axis=1)
x_cov = field + rng.normal(0, 0.5, n); x_noise = rng.normal(size=n)
y = field + rng.normal(0, 0.3, n)
X = np.c_[xy, x_cov, x_noise]

# (d) Moran's I with 8 nearest neighbors, then the empirical semivariogram
_, nb = cKDTree(xy).query(xy, k=9)                    # column 0 is the point itself
W = np.zeros((n, n)); W[np.repeat(np.arange(n), 8), nb[:, 1:].ravel()] = 1
z = y - y.mean()
print("Moran I (kNN=8):", round(n / W.sum() * (z @ W @ z) / (z @ z), 3), " E[I]=", round(-1 / (n - 1), 4))

dist = pdist(xy); gamma = 0.5 * pdist(y[:, None], "sqeuclidean")
bins = np.arange(0, 60, 5)
for lo, hi in zip(bins[:-1], bins[1:]):
    m = (dist >= lo) & (dist < hi)
    print(f"lag {lo:2d}-{hi:2d}: gamma={gamma[m].mean():.3f} (pairs={m.sum()})")
print("var(y) =", round(y.var(), 3))

# (e) block-size sweep
rf = RandomForestRegressor(n_estimators=200, random_state=0, n_jobs=-1)
def r2(cv, groups=None):
    return r2_score(y, cross_val_predict(rf, X, y, cv=cv, groups=groups))

print("random 5-fold:", round(r2(KFold(5, shuffle=True, random_state=0)), 3))
for size in (10, 20, 25, 34):
    nb_ = int(np.ceil(100 / size))
    g_ = (np.floor(xy[:, 0] / size) * nb_ + np.floor(xy[:, 1] / size)).astype(int)
    print(f"block size {size:2d} ({len(np.unique(g_))} blocks): R2 =", round(r2(GroupKFold(5), g_), 3))
```

**Output:**

```text
Moran I (kNN=8): 0.793  E[I]= -0.0007
lag  0- 5: gamma=0.130 (pairs=8406)
lag  5-10: gamma=0.247 (pairs=23815)
lag 10-15: gamma=0.419 (pairs=37406)
lag 15-20: gamma=0.549 (pairs=48264)
lag 20-25: gamma=0.581 (pairs=57378)
lag 25-30: gamma=0.577 (pairs=65420)
lag 30-35: gamma=0.580 (pairs=71033)
lag 35-40: gamma=0.587 (pairs=74834)
lag 40-45: gamma=0.617 (pairs=77589)
lag 45-50: gamma=0.619 (pairs=78224)
lag 50-55: gamma=0.616 (pairs=77508)
var(y) = 0.603
random 5-fold: 0.646
block size 10 (100 blocks): R2 = 0.543
block size 20 (25 blocks): R2 = 0.502
block size 25 (16 blocks): R2 = 0.464
block size 34 (9 blocks): R2 = 0.479
```

**Answers.**

- (d) Moran's I $=0.79$ is far above $E[I]\approx0$: $y$ is strongly spatially autocorrelated. The semivariogram rises from about 0.13 at short lags and **levels off near the total variance (about 0.58–0.62) at a lag of roughly 20 units**, so the **range is about 20**. The non-zero value at the shortest lag reflects the nugget (the added noise).
- (e) $R^2$ falls from 0.646 (random CV) to 0.543 (10-unit blocks, smaller than the range) to about 0.46–0.50 (blocks at or above the range). The values for blocks of 25 and 34 (0.464 and 0.479) differ by less than the noise you would expect from different fold compositions, so treat them as the same plateau.
- (f) A sound choice is a block size **at least about the range (20 units or more)**, here 20–25, because then most held-out samples have no training neighbor inside the correlated distance. The score decreases as blocks grow toward the range and then levels off; that plateau is the estimate of performance in unsampled areas. Picking the block size that gives the highest score defeats the purpose. A real study would also check that each fold still has enough samples and covers the predictor range (area of applicability).

