#!/usr/bin/env python3
"""Exercise 2 worked implementation; writes the theoretical eight-row cover."""
import csv
from tiles_cover import cover

if __name__ == "__main__":
    counts = {}
    with open("tiles.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["z", "x", "y", "tms_y"])
        for z, x, y, ty in cover((4.892, 52.3728, 4.8945, 52.3744), 10, 16):
            writer.writerow([z, x, y, ty])
            counts[z] = counts.get(z, 0) + 1
    print(counts, "total", sum(counts.values()))
