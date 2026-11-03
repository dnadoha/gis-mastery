#!/usr/bin/env python3
"""Validated Web Mercator XYZ/TMS teaching helpers. Standard library only."""
import math

R = 6378137.0
ORIGIN = math.pi * R
MAX_LAT = math.degrees(math.atan(math.sinh(math.pi)))


def zoom(z):
    if isinstance(z, bool) or not isinstance(z, int) or not 0 <= z <= 30:
        raise ValueError("zoom must be an integer from 0 to 30")
    return 2 ** z


def lonlat_to_3857(lon, lat):
    if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in (lon, lat)):
        raise ValueError("coordinates must be finite numbers")
    if not -180 <= lon <= 180 or not -90 <= lat <= 90:
        raise ValueError("coordinates outside longitude/latitude range")
    lat = min(max(lat, -MAX_LAT), MAX_LAT)
    return R * math.radians(lon), R * math.asinh(math.tan(math.radians(lat)))


def tile_xyz(lon, lat, z):
    n = zoom(z)
    x, y = lonlat_to_3857(lon, lat)
    col = math.floor((x + ORIGIN) / (2 * ORIGIN) * n)
    row = math.floor((ORIGIN - y) / (2 * ORIGIN) * n)
    return min(max(col, 0), n - 1), min(max(row, 0), n - 1)


def tms_y(y, z):
    n = zoom(z)
    if isinstance(y, bool) or not isinstance(y, int) or not 0 <= y < n:
        raise ValueError("row outside tile grid")
    return n - 1 - y


def tile_bounds_3857(x, y, z):
    n = zoom(z)
    if any(isinstance(v, bool) or not isinstance(v, int) or not 0 <= v < n for v in (x, y)):
        raise ValueError("tile outside grid")
    size = 2 * ORIGIN / n
    minx, maxy = -ORIGIN + x * size, ORIGIN - y * size
    return minx, maxy - size, minx + size, maxy


if __name__ == "__main__":
    print("EPSG:3857 x,y = %.2f, %.2f" % lonlat_to_3857(4.8926, 52.3731))
    for z in (0, 5, 10, 14):
        x, y = tile_xyz(4.8926, 52.3731, z)
        print(f"z={z:2d}  x={x:5d}  y={y:5d}  tms_y={tms_y(y, z):5d}")
    print("z14 bounds: %.3f %.3f %.3f %.3f" % tile_bounds_3857(8414, 5384, 14))
