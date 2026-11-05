### Solution 1 — tile-math toolkit

`tile_math.py`:

```python
"""Web Mercator tile helpers (Exercise 1). Pure standard library."""
import math

R = 6378137.0                         # spherical radius used by EPSG:3857 (metres)
C = 2 * math.pi * R                   # world width: 40 075 016.685578... m
HALF = C / 2                          # 20 037 508.342789... m
MAX_LAT = math.degrees(math.atan(math.sinh(math.pi)))   # 85.0511287798066

def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int, int]:
    """XYZ tile (x, y) containing (lon, lat) at zoom z. Latitude is clamped to the Mercator limit."""
    lat = max(min(lat, MAX_LAT), -MAX_LAT)
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n
    return min(max(int(math.floor(x)), 0), n - 1), min(max(int(math.floor(y)), 0), n - 1)

def tile_bounds_3857(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """(minX, minY, maxX, maxY) in EPSG:3857 metres."""
    size = C / 2 ** z
    min_x = -HALF + x * size
    max_y = HALF - y * size
    return (min_x, max_y - size, min_x + size, max_y)

def tile_bounds_4326(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """(west, south, east, north) in degrees."""
    n = 2 ** z
    def lat(row: float) -> float:
        return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * row / n))))
    return (x / n * 360 - 180, lat(y + 1), (x + 1) / n * 360 - 180, lat(y))

def resolution(z: int, lat: float = 0.0, tile_size: int = 256) -> float:
    """Ground metres per pixel at zoom z and latitude lat."""
    return C / (tile_size * 2 ** z) * math.cos(math.radians(lat))

def tms_y(z: int, y_xyz: int) -> int:
    """Flip between XYZ and TMS row numbering (the operation is its own inverse)."""
    return 2 ** z - 1 - y_xyz

def tiles_for_bbox(west: float, south: float, east: float, north: float, z: int):
    """Yield every XYZ tile (z, x, y) intersecting the lon/lat bbox."""
    x0, y1 = lonlat_to_tile(west, south, z)      # south-west corner -> largest y
    x1, y0 = lonlat_to_tile(east, north, z)      # north-east corner -> smallest y
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            yield (z, x, y)

if __name__ == "__main__":
    assert lonlat_to_tile(4.9, 52.37, 12) == (2103, 1346)
    assert lonlat_to_tile(4.9, 52.37, 14) == (8415, 5384)
    assert lonlat_to_tile(-74.0060, 40.7128, 10) == (301, 385)
    assert lonlat_to_tile(139.6917, 35.6895, 16) == (58198, 25804)
    assert lonlat_to_tile(0, 0, 1) == (1, 1)
    assert lonlat_to_tile(180, 90, 3) == (7, 0)            # clamped, never out of range
    w, s, e, n = tile_bounds_4326(12, 2103, 1346)
    assert w <= 4.9 < e and s <= 52.37 < n                 # the point lies inside its tile
    assert abs(resolution(0) - 156543.03392804097) < 1e-6
    assert tms_y(12, tms_y(12, 1346)) == 1346
    counts = {z: len(list(tiles_for_bbox(4.85, 52.34, 4.95, 52.40, z))) for z in range(10, 15)}
    assert counts == {10: 2, 11: 4, 12: 4, 13: 9, 14: 30}, counts
    print("all checks passed")
    print("bounds 3857:", [round(v, 2) for v in tile_bounds_3857(12, 2103, 1346)])
    print("bounds 4326:", [round(v, 6) for v in tile_bounds_4326(12, 2103, 1346)])
    print("tms y:", tms_y(12, 1346))
    print("bbox tile counts:", counts)
```

**Expected output**

| Call | Result |
|---|---|
| `lonlat_to_tile(4.9, 52.37, 12)` | `(2103, 1346)` |
| `lonlat_to_tile(4.9, 52.37, 14)` | `(8415, 5384)` |
| `lonlat_to_tile(-74.0060, 40.7128, 10)` | `(301, 385)` |
| `lonlat_to_tile(139.6917, 35.6895, 16)` | `(58198, 25804)` |
| `lonlat_to_tile(0, 0, 1)` | `(1, 1)` |
| `lonlat_to_tile(180, 90, 3)` | `(7, 0)` (clamped) |
| `tile_bounds_3857(12, 2103, 1346)` | `(538116.68, 6858541.67, 547900.62, 6868325.61)` |
| `tile_bounds_4326(12, 2103, 1346)` | `(4.833984, 52.321911, 4.921875, 52.375599)` |
| `tms_y(12, 1346)` | `2749` |
| `tiles_for_bbox(4.85, 52.34, 4.95, 52.40, z)` for z = 10…14 | 2, 4, 4, 9, 30 tiles (at z = 14: x 8412–8417, y 5382–5386) |

**Reasoning.**
- `(0, 0)` at z = 1 lies exactly on the corner shared by all four tiles; the `floor` rule assigns it to the south-east tile `(1, 1)` — a useful reminder that tile boundaries are half-open intervals.
- Counts grow roughly ×4 per zoom for a *large* area, but for a small bbox they depend on how the bbox aligns with tile edges (4 → 4 → 9 → 30 here), which is why the number of tiles needed is not a clean power of four.
- `lonlat_to_tile` clamps both latitude (Mercator limit) and the index (so `lon = 180` does not produce `x = 2^z`).

**Verify against PostGIS.**

```sql
SELECT round(ST_XMin(g)::numeric, 2), round(ST_YMin(g)::numeric, 2),
       round(ST_XMax(g)::numeric, 2), round(ST_YMax(g)::numeric, 2)
FROM (SELECT ST_TileEnvelope(12, 2103, 1346) AS g) s;
-- expected: 538116.68 | 6858541.67 | 547900.62 | 6868325.61
```

