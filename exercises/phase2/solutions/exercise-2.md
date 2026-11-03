# Source solution (read the correction notes first)

### Solution 2

`tiles.py`:

```python
#!/usr/bin/env python3
import csv
from tiles_cover import cover

bbox = (4.892, 52.3728, 4.8945, 52.3744)          # (minLon, minLat, maxLon, maxLat)
counts = {}
with open("tiles.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["z", "x", "y", "tms_y"])
    for z, x, y, ty in cover(bbox, 10, 16):
        w.writerow([z, x, y, ty])
        counts[z] = counts.get(z, 0) + 1
print(counts, "total", sum(counts.values()))
```

**Verified output:** `{10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 2} total 8`. The relevant `tiles.csv` rows are `14,8414,5384,10999`, `15,16829,10768,21999`, `16,33658,21536,43999`, `16,33659,21536,43999`.

*Why z=16 needs two tiles:* the bbox's west edge (lon 4.892) and east edge (lon 4.8945) fall into different columns at z=16 (33658 and 33659), because a z=16 tile is only ≈ 0.0055° (≈ 373 m on the ground at this latitude) wide, and the bbox is 0.0025° wide but straddles a column boundary. The y range stays in one row (21536).

`requests.txt`:

```text
# a. WMS 1.3.0, EPSG:4326: BBOX is minLat,minLon,maxLat,maxLon  (axis order of the authority definition)
https://example.org/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=parcels&STYLES=&CRS=EPSG:4326&BBOX=52.3728,4.892,52.3744,4.8945&WIDTH=512&HEIGHT=512&FORMAT=image/png

# b. WMS 1.1.1, SRS=EPSG:4326: BBOX is minLon,minLat,maxLon,maxLat
https://example.org/ows?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=parcels&STYLES=&SRS=EPSG:4326&BBOX=4.892,52.3728,4.8945,52.3744&WIDTH=512&HEIGHT=512&FORMAT=image/png

# c. WMS 1.3.0 with CRS:84 (WGS 84, lon/lat order): BBOX is minLon,minLat,maxLon,maxLat
https://example.org/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=parcels&STYLES=&CRS=CRS:84&BBOX=4.892,52.3728,4.8945,52.3744&WIDTH=512&HEIGHT=512&FORMAT=image/png

# d1. WMS 1.3.0, EPSG:3857, exactly tile 14/8414/5384
https://example.org/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=parcels&STYLES=&CRS=EPSG:3857&BBOX=543008.649,6865879.629,545454.634,6868325.614&WIDTH=256&HEIGHT=256&FORMAT=image/png

# d2. WMTS KVP GetTile for the same tile (TileRow counts from the top)
https://example.org/ows?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=parcels&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX=14&TILEROW=5384&TILECOL=8414&FORMAT=image/png
```

**MBTiles rows (part 4):** `tile_row = 43999` for both z=16 tiles (columns `33658` and `33659`), because `65535 − 21536 = 43999`.

**Explanation.** WMS 1.3.0 follows the EPSG axis order, so `EPSG:4326` means *latitude first*; WMS 1.1.1 and `CRS:84` are longitude-first. A WMS request for exactly a tile's `EPSG:3857` bbox and a WMTS `GetTile` return the same picture, but WMTS can be cached by tile address, whereas arbitrary WMS bboxes cannot. **Verify** by decoding each `BBOX` back to lon/lat for a sanity check.

---

