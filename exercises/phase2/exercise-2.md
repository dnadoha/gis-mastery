### Exercise 2 (Intermediate): Tile addressing and OGC requests

**Task.**
1. Using the bounding box of the dataset from Exercise 1, write `tiles.py` (reuse `tilemath.py`) that writes `tiles.csv` with columns `z,x,y,tms_y` for zooms 10 to 16.
2. Report the tile count per zoom and explain why z=16 needs more than one tile.
3. Write the following requests into `requests.txt` for a placeholder server `https://example.org/ows`:
   a. WMS **1.3.0** `GetMap` in `EPSG:4326` covering the dataset bbox;
   b. the **same** request as WMS **1.1.1**;
   c. a WMS 1.3.0 `GetMap` in `CRS:84`;
   d. a WMS 1.3.0 `GetMap` in `EPSG:3857` for tile `14/8414/5384` and the equivalent WMTS `GetTile`.
4. For the z=16 tiles, state the row value you would query in an **MBTiles** file.

**Prerequisites.** Exercise 1 (bbox); §4.1.2; §4.4; §4.7.1.

**Sample input.** bbox `(minLon, minLat, maxLon, maxLat) = (4.892, 52.3728, 4.8945, 52.3744)`.

**Deliverable.** `tiles.py`, `tiles.csv`, `requests.txt`, and a three-line explanation.

**Success criteria.**
- Counts per zoom: `{10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 2}`; 8 rows in total.
- The `EPSG:4326` WMS 1.3.0 `BBOX` is written **lat,lon order**; WMS 1.1.1 and `CRS:84` use **lon,lat** order.
- The WMTS request uses `TILEROW=5384`, `TILECOL=8414`, `TILEMATRIX=14`; the `EPSG:3857` bbox matches §5.2.

**Hint.** The south-west corner of the bbox gives the *largest* `y` (rows increase southward in XYZ).

---

