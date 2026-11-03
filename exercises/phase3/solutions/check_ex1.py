import numpy as np
import geopandas as gpd
from pyproj import Transformer
from fixtures import make_districts, make_flood, make_clinics

d, f, c = make_districts(), make_flood(), make_clinics()

# 1. one CRS, valid geometries
assert d.crs == f.crs == c.crs == "EPSG:32631"
assert d.is_valid.all() and f.is_valid.all() and c.is_valid.all()

# 2. areas
print(d.area.tolist())                                   # [1000000.0, 1000000.0, 1000000.0]
assert np.allclose(d.area, 1e6)

# 3. lon/lat -> UTM 31N
fwd = Transformer.from_crs(4326, 32631, always_xy=True)
x, y = fwd.transform(3.0, 52.0)
print(x, y)                                              # 500000.0  5761038.2...
assert abs(x - 500_000) < 1e-6 and abs(y - 5_761_038.2) < 0.1

# 4. round trip
inv = Transformer.from_crs(32631, 4326, always_xy=True)
lon, lat = inv.transform(*fwd.transform(3.7, 51.9))
assert abs(lon - 3.7) < 1e-8 and abs(lat - 51.9) < 1e-8

# 5. the degrees pitfall
ll = c.to_crs(4326)
print(ll.geometry.iloc[0].buffer(400).area)              # ≈ 501,847.8 (square DEGREES)

# 6. GeoPackage round trip
d.to_file("ex1.gpkg", layer="districts", driver="GPKG")
f.to_file("ex1.gpkg", layer="flood", driver="GPKG")
c.to_file("ex1.gpkg", layer="clinics", driver="GPKG")
for layer, n in [("districts", 3), ("flood", 1), ("clinics", 4)]:
    back = gpd.read_file("ex1.gpkg", layer=layer)
    assert back.crs.to_epsg() == 32631 and len(back) == n
