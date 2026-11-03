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
