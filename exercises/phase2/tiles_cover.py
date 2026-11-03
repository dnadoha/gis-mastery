#!/usr/bin/env python3
"""Inclusive-corner bbox cover, not a prediction of buffered generator outputs."""
import math
from tilemath import tile_xyz, tms_y, zoom


def cover(bbox, zmin, zmax):
    zoom(zmin)
    zoom(zmax)
    if zmin > zmax or len(bbox) != 4 or not all(math.isfinite(v) for v in bbox):
        raise ValueError("expected a finite bbox and increasing zoom range")
    west, south, east, north = bbox
    if west > east or south > north:
        raise ValueError("reversed or antimeridian bbox: split it before using this helper")
    for z in range(zmin, zmax + 1):
        x0, y1 = tile_xyz(west, south, z)
        x1, y0 = tile_xyz(east, north, z)
        if (x1 - x0 + 1) * (y1 - y0 + 1) > 100000:
            raise ValueError("teaching helper limits a bbox to 100000 tiles per zoom")
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                yield z, x, y, tms_y(y, z)


if __name__ == "__main__":
    counts = {}
    for z, x, y, ty in cover((4.892, 52.3728, 4.8945, 52.3744), 10, 16):
        counts[z] = counts.get(z, 0) + 1
    print(counts, "total", sum(counts.values()))
