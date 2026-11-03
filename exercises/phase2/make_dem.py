#!/usr/bin/env python3
"""Write a synthetic DEM as an Esri ASCII grid (dem.asc) and print reference statistics.
Grid: 1200 x 800 cells, 2.5 m cells, lower-left corner (121000, 486000) in EPSG:28992 (RD New).
Surface: a smooth hill (metres above an arbitrary datum) plus a NoData block."""
import math

NCOLS, NROWS, CELL = 1200, 800, 2.5
XLL, YLL, NODATA = 121000.0, 486000.0, -9999

def height(x, y):
    return 2.0 + 8.0 * math.exp(-(((x - 122500.0) / 600.0) ** 2 + ((y - 487000.0) / 400.0) ** 2))

def is_nodata(col, row):                    # row 0 is the TOP row of the file
    return 100 <= col < 200 and 100 <= row < 150

valid, total, vmin, vmax = 0, 0.0, float("inf"), float("-inf")
with open("dem.asc", "w") as f:
    f.write(f"ncols {NCOLS}\nnrows {NROWS}\nxllcorner {XLL}\nyllcorner {YLL}\ncellsize {CELL}\nNODATA_value {NODATA}\n")
    for row in range(NROWS):
        y = YLL + (NROWS - row - 0.5) * CELL       # cell-centre northing
        vals = []
        for col in range(NCOLS):
            if is_nodata(col, row):
                vals.append(str(NODATA)); continue
            x = XLL + (col + 0.5) * CELL           # cell-centre easting
            h = round(height(x, y), 2)
            vals.append(f"{h:.2f}")
            valid += 1; total += h; vmin = min(vmin, h); vmax = max(vmax, h)
        f.write(" ".join(vals) + "\n")

print("cells:", NCOLS * NROWS, "valid:", valid, "nodata:", NCOLS * NROWS - valid)
print("min %.2f  max %.2f  mean %.4f" % (vmin, vmax, total / valid))
print("extent x: %.1f..%.1f  y: %.1f..%.1f" % (XLL, XLL + NCOLS * CELL, YLL, YLL + NROWS * CELL))
