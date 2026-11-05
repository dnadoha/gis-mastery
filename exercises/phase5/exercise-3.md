### Exercise 3 — Advanced: scale to one million points and engineer performance

**Task.** Extend Exercise 2's stack with a **1 000 000-point** layer and make it fast:
1. Generate reproducible random POIs in the bbox `(4.70, 52.28, 5.10, 52.45)`.
2. Write a dynamic tile function `postgisftw.poi_mvt` that returns **grid-aggregated counts below z = 13** and individual points from z = 13.
3. Build a **pre-generated** alternative with Tippecanoe and serve it with Martin.
4. Benchmark both (≥ 300 random tiles, z = 8…14) and report p50/p95 latency and maximum tile size per zoom.
5. Write `tiles_to_purge(bbox, zmin, zmax)` that lists the tiles to invalidate after an edit, accounting for the tile buffer.
6. Add a MapLibre **heatmap** at low zoom and individual points at high zoom, and decide where to hand over.

**Prerequisites.** Exercises 1–2; Sections 4.5, 4.7.3 and 4.8.

**Sample input.** The bbox above; zoom range 8–14; the changed-feature bbox `(4.9, 52.37, 4.9, 52.37)` for the purge function.

**Expected deliverable.** SQL (data generation, indexes, tile function), the Tippecanoe/Martin commands, `bench.py`, `purge.py`, and a results table with a one-paragraph recommendation (dynamic vs pre-generated vs hybrid).

**Success criteria.**
- No tile exceeds 500 000 bytes at any benchmarked zoom (state whether you measured decoded or transferred size).
- The inner tile query uses the GiST index (index or bitmap scan) for high-zoom tiles.
- You can explain, with numbers, why un-aggregated points at z = 11 would be unacceptable (estimate points per tile from density).
- `tiles_to_purge` returns exactly one tile for an interior point at z = 12 and includes a neighbouring tile when the change lies within the buffer distance of a tile edge.
- Your recommendation justifies hybrid vs single approach using measured latency.

**Hint.** `ST_SnapToGrid(geom_3857, res * 32)` makes ~32-pixel cells; `GROUP BY` the snapped point and `count(*)`. For tiles below z = 8 consider a pre-aggregated table or Tippecanoe rather than scanning a million rows per request.

