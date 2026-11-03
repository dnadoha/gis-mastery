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
