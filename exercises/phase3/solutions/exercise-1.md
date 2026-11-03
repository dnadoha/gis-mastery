# Source solution — read the website clarifications before running

### Solution 1: fixtures and CRS discipline

`fixtures.py`

```python
"""fixtures.py: synthetic study area in EPSG:32631 (local metres + origin)."""
import geopandas as gpd
from shapely.geometry import LineString, Point, box

CRS = "EPSG:32631"
X0, Y0 = 500_000, 5_700_000


def rect(xmin, ymin, xmax, ymax):
    return box(X0 + xmin, Y0 + ymin, X0 + xmax, Y0 + ymax)


def pt(x, y):
    return Point(X0 + x, Y0 + y)


def line(*coords):
    return LineString([(X0 + x, Y0 + y) for x, y in coords])


def make_districts():
    return gpd.GeoDataFrame(
        {"name": ["A", "B", "C"], "pop": [4000, 6000, 2000], "region": ["R1", "R1", "R2"]},
        geometry=[rect(0, 0, 1000, 1000), rect(1000, 0, 2000, 1000), rect(0, 1000, 1000, 2000)],
        crs=CRS,
    )


def make_flood():
    return gpd.GeoDataFrame({"zone": ["F1"]}, geometry=[rect(500, 0, 1500, 1000)], crs=CRS)


def make_clinics(extra_boundary=False):
    rows = [("P1", "Clinic 1", 250, 500), ("P2", "Clinic 2", 1250, 500),
            ("P3", "Clinic 3", 250, 1500), ("P4", "Clinic 4", 2500, 500)]
    if extra_boundary:
        rows.append(("P5", "Clinic 5", 1000, 500))          # exactly on the A/B shared edge
    return gpd.GeoDataFrame(
        {"clinic": [r[0] for r in rows], "label": [r[1] for r in rows]},
        geometry=[pt(r[2], r[3]) for r in rows], crs=CRS)
```

`check_ex1.py`

```python
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
```

**Explanation.**

* Step 3: lon 3°E is the central meridian of zone 31 (false easting 500,000 m), so the easting must be 500,000 regardless of latitude. The northing is 0.9996 × the meridian arc length from the equator to 52°N, which gives ≈ 5,761,038 m. Verify independently with `gdaltransform` or an online calculator.
* Step 4: pyproj transformations are numerically stable to far below a millimetre for this projection; 10⁻⁸° ≈ 1.1 mm of latitude gives ample margin.
* Step 5: the geometry lives in EPSG:4326, so `buffer(400)` creates a circle of radius **400 degrees** (a nonsense shape wrapping beyond the globe) and `.area` is in **square degrees**. The value 501,847.8 happens to equal the §5 metre-based buffer numerically because the shape is the same 64-gon scaled by the unit, which is exactly why this bug passes silently. Use a metric CRS (or geodesic tools) for distance-based operations.
* Step 6: `to_file` with different `layer=` names appends layers to one GeoPackage; re-reading checks that CRS metadata survives.

