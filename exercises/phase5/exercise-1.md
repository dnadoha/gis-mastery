### Exercise 1 — Beginner: build a tile-math toolkit

**Task.** Implement a small, dependency-free Python module with: `lonlat_to_tile(lon, lat, z)`, `tile_bounds_3857(z, x, y)`, `tile_bounds_4326(z, x, y)`, `resolution(z, lat)`, `tms_y(z, y)` and `tiles_for_bbox(west, south, east, north, z)`.

**Prerequisites.** Section 4.1; basic Python.

**Sample input.**

| Call | Inputs |
|---|---|
| `lonlat_to_tile` | `(4.9, 52.37, 12)`, `(4.9, 52.37, 14)`, `(-74.0060, 40.7128, 10)`, `(139.6917, 35.6895, 16)`, `(0, 0, 1)`, `(180, 90, 3)` |
| `tile_bounds_*` | tile `12/2103/1346` |
| `tiles_for_bbox` | bbox `(4.85, 52.34, 4.95, 52.40)` for `z = 10 … 14` |
| `tms_y` | `z = 12`, `y = 1346` |

**Expected deliverable.** `tile_math.py` with `assert`-based self-tests, plus a short table of the results above.

**Success criteria.**
- All six `lonlat_to_tile` cases return in-range indices (including the clamped one).
- The point `(4.9, 52.37)` lies inside the bounds you compute for its own tile at z = 12.
- `resolution(0)` equals 156 543.034 m/px to at least 6 significant digits.
- `tms_y` applied twice returns the original `y`.
- You can predict, before running, that the bbox needs more tiles at each deeper zoom.

**Hint.** `asinh(tan φ)` is numerically friendlier than `ln(tan φ + sec φ)`; clamp the results to `0 … 2^z − 1`.

