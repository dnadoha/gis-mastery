# Source solution — read the website clarifications before running

### Solution 3: rasters and scale

`raster_ops.py`

```python
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.mask import mask
from rasterio.transform import from_origin
from fixtures import CRS, X0, Y0, make_flood


def build_elev(path="elev.tif"):
    elev = np.tile(np.arange(10, 30, dtype="float32"), (20, 1))          # 10 + column
    profile = dict(driver="GTiff", height=20, width=20, count=1, dtype="float32", crs=CRS,
                   transform=from_origin(X0, Y0 + 2000, 100, 100), nodata=-9999.0)
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(elev, 1)


def counts(a):
    k, n = np.unique(a, return_counts=True)
    return {int(i): int(j) for i, j in zip(k, n)}


def zonal_and_classes(path, flood):
    with rasterio.open(path) as src:
        out, _ = mask(src, flood.geometry, crop=True, nodata=src.nodata)
        vals = out[0][out[0] != src.nodata]
        cell_area = abs(src.transform.a * src.transform.e)
        stats = dict(count=int(vals.size), mean=float(vals.mean()), min=float(vals.min()),
                     max=float(vals.max()), area=float(vals.size * cell_area))
        full = src.read(1)
        profile = src.profile.copy()
    classes = (np.digitize(full, bins=[15, 20]) + 1).astype("uint8")
    inside = np.digitize(vals, bins=[15, 20]) + 1
    profile.update(dtype="uint8", nodata=0)
    with rasterio.open("risk.tif", "w", **profile) as dst:
        dst.write(classes, 1)
    return stats, counts(classes), counts(inside)


def windowed(path, zone_geom):
    """Class counts (whole raster) and zonal count/sum/mean, one block at a time."""
    cls_counts = np.zeros(4, dtype=np.int64)
    n, total = 0, 0.0
    with rasterio.open(path) as src:
        for _, win in src.block_windows(1):
            data = src.read(1, window=win)
            valid = data != src.nodata
            cls_counts += np.bincount(np.digitize(data[valid], [15, 20]) + 1, minlength=4)
            zone = geometry_mask([zone_geom], out_shape=data.shape,
                                 transform=src.window_transform(win), invert=True) & valid
            n += int(zone.sum()); total += float(data[zone].sum())
    return {i: int(cls_counts[i]) for i in (1, 2, 3)}, n, total, total / n


if __name__ == "__main__":
    flood = make_flood()
    build_elev()
    stats, all_cls, flood_cls = zonal_and_classes("elev.tif", flood)
    print(stats)       # {'count': 100, 'mean': 19.5, 'min': 15.0, 'max': 24.0, 'area': 1000000.0}
    print(all_cls)     # {1: 100, 2: 100, 3: 200}
    print(flood_cls)   # {2: 50, 3: 50}
    w_cls, n, total, mean = windowed("elev.tif", flood.geometry.iloc[0])
    assert w_cls == all_cls and n == stats["count"] and abs(mean - stats["mean"]) < 1e-9
    print(n, total, mean)   # 100 1950.0 19.5
```

`scale_demo.py`

```python
from time import perf_counter
import numpy as np, shapely, geopandas as gpd
from shapely.geometry import Point
from fixtures import CRS, X0, Y0, make_districts

districts = make_districts()
rng = np.random.default_rng(42)
n = 100_000
xs = X0 + rng.uniform(0, 2000, n)
ys = Y0 + rng.uniform(0, 2000, n)
pts = gpd.GeoDataFrame(geometry=gpd.points_from_xy(xs, ys), crs=CRS)

# (i) sjoin  (ii) vectorised contains_xy: identical per-district counts
j = gpd.sjoin(pts, districts[["name", "geometry"]], how="left", predicate="within")
c_sjoin = j["name"].value_counts(dropna=False)
c_xy = {nm: int(shapely.contains_xy(g, xs, ys).sum())
        for nm, g in districts.set_index("name").geometry.items()}
assert all(int(c_sjoin[k]) == c_xy[k] for k in c_xy)
print(c_xy, "unmatched:", int(j["name"].isna().sum()))     # each ≈ 25,000 (binomial sd ≈ 137)

# (iii) naive Python loop vs STRtree on 5,000 points
sub = 5_000
geoms = list(districts.geometry)
t0 = perf_counter()
naive = [next((i for i, g in enumerate(geoms) if g.contains(Point(x, y))), -1)
         for x, y in zip(xs[:sub], ys[:sub])]
t_naive = perf_counter() - t0

tree = shapely.STRtree(geoms)
t0 = perf_counter()
pairs = tree.query(shapely.points(xs[:sub], ys[:sub]), predicate="within")   # 2×K: [point idx, polygon idx]
res = np.full(sub, -1); res[pairs[0]] = pairs[1]
t_tree = perf_counter() - t0
assert (res == np.array(naive)).all()
print(f"naive {t_naive:.3f}s  indexed {t_tree:.4f}s")

# Memory budget
cells = 20_000 * 20_000
print(cells * 4, 512 * 512 * 4, int(np.ceil(20_000 / 512)) ** 2)   # 1600000000  1048576  1600
```

**Explanation.**

* **Zonal statistics.** The flood polygon spans x 500–1500 and y 0–1000, i.e. columns 5–14 and rows 10–19. The default centre-in rule selects the 10 × 10 = 100 cells whose centres lie inside; their values are 15…24, so mean = 19.5, min = 15, max = 24, area = 100 × 10,000 = 1,000,000 m². This equals the vector area because polygon edges coincide with cell edges.
* **Reclassification.** `np.digitize(a, [15, 20])` returns 0/1/2 for `< 15`, `15 ≤ a < 20`, `≥ 20`; adding 1 gives classes 1–3. Columns 0–4 → class 1 (5 × 20 = 100 cells), 5–9 → class 2 (100), 10–19 → class 3 (200). Inside the flood zone: columns 5–9 (5 × 10 = 50 cells) and 10–14 (50 cells).
* **Windowed processing.** Counts and sums are *additive* across blocks, so accumulating partial counts, sums and cell counts and dividing at the end reproduces the global values exactly. Averaging block means would be wrong when blocks differ in size. `src.window_transform(win)` gives the correct georeferencing for each window so the polygon is rasterised in the right place.
* **Index vs naive.** With only three polygons the *asymptotic* advantage of the R-tree is invisible; the large speed-up here comes mainly from the **vectorised C loop** replacing Python-level `Point` construction and predicate calls. The tree pays off as polygon count grows (for 10⁴ polygons a naive scan needs 10⁴ tests per point; the tree visits roughly log₂(10⁴) ≈ 13 nodes plus candidates). Equal counts from three methods confirm correctness; the expected ≈ 25,000 per district follows from area fractions (each district is 1/4 of the 2000 × 2000 m square, as is the empty north-east corner).
* **Memory.** 20,000² = 4×10⁸ cells × 4 bytes = 1.6×10⁹ bytes; a 512 × 512 `float32` block = 1,048,576 bytes; ⌈20000/512⌉ = 40, so 40² = 1,600 blocks.

