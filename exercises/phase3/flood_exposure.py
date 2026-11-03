"""flood_exposure.py: synthetic flood-exposure workflow in EPSG:32631."""
import numpy as np
import geopandas as gpd
import rasterio
from rasterio.mask import mask
from rasterio.transform import from_origin
from shapely.geometry import Point, box

CRS = "EPSG:32631"
X0, Y0 = 500_000, 5_700_000            # origin on the 3°E central meridian


def rect(xmin, ymin, xmax, ymax):
    """Rectangle in local metres, shifted into real EPSG:32631 coordinates."""
    return box(X0 + xmin, Y0 + ymin, X0 + xmax, Y0 + ymax)


def close(a, b, tol=1.0):
    return abs(a - b) <= tol


def counts(a):
    """{class: number of cells} with plain Python ints."""
    k, n = np.unique(a, return_counts=True)
    return {int(i): int(j) for i, j in zip(k, n)}


# ── 1. Build layers ─────────────────────────────────────────────────────────
districts = gpd.GeoDataFrame(
    {"name": ["A", "B", "C"], "pop": [4000, 6000, 2000], "region": ["R1", "R1", "R2"]},
    geometry=[rect(0, 0, 1000, 1000), rect(1000, 0, 2000, 1000), rect(0, 1000, 1000, 2000)],
    crs=CRS,
)
flood = gpd.GeoDataFrame({"zone": ["F1"]}, geometry=[rect(500, 0, 1500, 1000)], crs=CRS)
clinics = gpd.GeoDataFrame(
    {"clinic": ["P1", "P2", "P3", "P4"]},
    geometry=[Point(X0 + 250, Y0 + 500), Point(X0 + 1250, Y0 + 500),
              Point(X0 + 250, Y0 + 1500), Point(X0 + 2500, Y0 + 500)],
    crs=CRS,
)

# Defensive checks BEFORE any analysis
assert districts.crs == flood.crs == clinics.crs
assert districts.is_valid.all() and flood.is_valid.all()
print("district areas (m²):", districts.area.tolist())

# ── 2. CRS sanity check ─────────────────────────────────────────────────────
origin_ll = gpd.GeoSeries([Point(X0, Y0)], crs=CRS).to_crs(4326).iloc[0]
print("origin lon/lat:", round(origin_ll.x, 6), round(origin_ll.y, 4))   # x = lon, y = lat

# ── 3. Spatial join: which district contains each clinic? ───────────────────
joined = gpd.sjoin(clinics, districts[["name", "region", "geometry"]],
                   how="left", predicate="within")
print(joined[["clinic", "name", "region"]])

# ── 4. Buffer clinics by 400 m, then intersect with the flood zone ──────────
buffers = clinics.copy()
buffers["geometry"] = clinics.buffer(400)               # CRS units are metres → 400 m
print("buffer area (m²):", buffers.area.round(0).unique())
catch_in_flood = gpd.overlay(buffers, flood, how="intersection")   # empty results are dropped
print(catch_in_flood[["clinic"]].assign(area_m2=catch_in_flood.area.round(0)))

# ── 5. Exposure: district ∩ flood, areal weighting ──────────────────────────
expo = gpd.overlay(districts, flood, how="intersection")
full_area = districts.set_index("name").area
expo["share"] = expo.area / expo["name"].map(full_area)
expo["pop_exposed"] = expo["pop"] * expo["share"]
print(expo[["name", "share", "pop_exposed"]])
print("total exposed:", expo["pop_exposed"].sum())

# ── 6. Dissolve districts into regions ──────────────────────────────────────
regions = districts.dissolve(by="region", aggfunc={"pop": "sum"}, as_index=False)
print(regions.assign(area_m2=regions.area)[["region", "pop", "area_m2"]])

# ── 7. Full overlay (union): the planar partition of districts and flood ────
parts = gpd.overlay(districts, flood, how="union")
print(len(parts), sorted(parts.area.round(0).tolist()))

# ── 8. Raster: build, mask, zonal stats, reclassify ─────────────────────────
elev = np.tile(np.arange(10, 30, dtype="float32"), (20, 1))          # elevation = 10 + column
transform = from_origin(X0, Y0 + 2000, 100, 100)                      # west, north, xsize, ysize
profile = dict(driver="GTiff", height=20, width=20, count=1, dtype="float32",
               crs=CRS, transform=transform, nodata=-9999.0)
with rasterio.open("elev.tif", "w", **profile) as dst:
    dst.write(elev, 1)

with rasterio.open("elev.tif") as src:
    out, out_tf = mask(src, flood.geometry, crop=True, nodata=src.nodata)
    band = out[0]
    vals = band[band != src.nodata]                                    # cells whose centres lie in F1
    cell_area = abs(src.transform.a * src.transform.e)
    print("masked shape:", band.shape)
    print("count/mean/min/max:", vals.size, vals.mean(), vals.min(), vals.max())
    print("raster flood area (m²):", vals.size * cell_area)

    full = src.read(1)
    classes = np.digitize(full, bins=[15, 20]) + 1                     # 1: <15, 2: 15–<20, 3: ≥20
    print("class counts (all):", counts(classes))
    inside = np.digitize(vals, bins=[15, 20]) + 1
    print("class counts (flood):", counts(inside))

# ── 9. Assertions that encode the expected results ──────────────────────────
assert close(expo["pop_exposed"].sum(), 5000.0, 1e-6)
assert close(vals.size * cell_area, expo.area.sum(), 1e-6)             # raster and vector agree
