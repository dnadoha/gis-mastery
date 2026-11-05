# Phase 5 source and visual coverage

The app retains all 65 sections, 25 tables, 48 code/text listings, 0 displayed equations and 6 source Mermaid diagrams. 30 original step visuals accompany 10 guided chapters. Notes are read without modification.

LF-canonical source SHA-256: `caf906edbc8d80708bf29f40dea8a070db3b9559caa8cf5cf5a0f85c9616df4f`. Source slices reconstruct the complete note. Reference outputs are not evidence of live GIS execution.

| Source section | Full reading | Guided chapter |
|---|---|---|
| Phase 5 — Web GIS and Mapping: From PostGIS to an Editable Web Map | [Read](index.html#phase5/reference/overview) | [stack](index.html#phase5/lesson/stack) |
| 1. Title and learning objectives | [Read](index.html#phase5/reference/1) | [stack](index.html#phase5/lesson/stack) |
| 1.1 Scope | [Read](index.html#phase5/reference/1-1) | [stack](index.html#phase5/lesson/stack) |
| 1.2 Prerequisites | [Read](index.html#phase5/reference/1-2) | [stack](index.html#phase5/lesson/stack) |
| 1.3 Learning objectives | [Read](index.html#phase5/reference/1-3) | [stack](index.html#phase5/lesson/stack) |
| 1.4 Suggested 8-week plan (compress to 4 weeks by skipping the optional items) | [Read](index.html#phase5/reference/1-4) | [stack](index.html#phase5/lesson/stack) |
| 2. Conceptual foundations | [Read](index.html#phase5/reference/2) | [stack](index.html#phase5/lesson/stack) |
| 2.1 What "Web GIS" means | [Read](index.html#phase5/reference/2-1) | [stack](index.html#phase5/lesson/stack) |
| 2.2 Three ways to ship geometry to a browser | [Read](index.html#phase5/reference/2-2) | [stack](index.html#phase5/lesson/stack) |
| 2.3 Key terminology | [Read](index.html#phase5/reference/2-3) | [stack](index.html#phase5/lesson/stack) |
| 2.4 The OGC service families at a glance | [Read](index.html#phase5/reference/2-4) | [services](index.html#phase5/lesson/services) |
| 2.5 The map-library landscape | [Read](index.html#phase5/reference/2-5) | [services](index.html#phase5/lesson/services) |
| 3. Visual explanations | [Read](index.html#phase5/reference/3) | [stack](index.html#phase5/lesson/stack) |
| 3.1 Conceptual overview of the stack | [Read](index.html#phase5/reference/3-1) | [stack](index.html#phase5/lesson/stack) |
| 3.2 Tile pyramid (ASCII schematic, XYZ scheme) | [Read](index.html#phase5/reference/3-2) | [tile-math](index.html#phase5/lesson/tile-math) |
| 3.3 Sequence: lifecycle of a vector-tile request | [Read](index.html#phase5/reference/3-3) | [performance](index.html#phase5/lesson/performance) |
| 3.4 Sequence: editing workflow with optimistic concurrency | [Read](index.html#phase5/reference/3-4) | [editing](index.html#phase5/lesson/editing) |
| 3.5 Data model for the capstone project | [Read](index.html#phase5/reference/3-5) | [security](index.html#phase5/lesson/security) |
| 3.6 Decision flow: how should this layer be served? | [Read](index.html#phase5/reference/3-6) | [services](index.html#phase5/lesson/services) |
| 4. Technical deep dive | [Read](index.html#phase5/reference/4) | [stack](index.html#phase5/lesson/stack) |
| 4.1 Web Mercator and tile mathematics | [Read](index.html#phase5/reference/4-1) | [tile-math](index.html#phase5/lesson/tile-math) |
| 4.2 The Mapbox Vector Tile (MVT) format | [Read](index.html#phase5/reference/4-2) | [mvt](index.html#phase5/lesson/mvt) |
| 4.3 Generating MVT in PostGIS | [Read](index.html#phase5/reference/4-3) | [mvt](index.html#phase5/lesson/mvt) |
| 4.4 Servers: what each one is for | [Read](index.html#phase5/reference/4-4) | [services](index.html#phase5/lesson/services) |
| 4.5 Pre-generated tiles: Tippecanoe, tilemaker, MBTiles, PMTiles | [Read](index.html#phase5/reference/4-5) | [performance](index.html#phase5/lesson/performance) |
| 4.6 OGC API – Features in practice | [Read](index.html#phase5/reference/4-6) | [services](index.html#phase5/lesson/services) |
| 4.7 Frontend techniques | [Read](index.html#phase5/reference/4-7) | [styling](index.html#phase5/lesson/styling) |
| 4.7.1 MapLibre GL JS: vector-tile source and data-driven styling | [Read](index.html#phase5/reference/4-7-1) | [styling](index.html#phase5/lesson/styling) |
| 4.7.2 Clustering (client-side, GeoJSON source) | [Read](index.html#phase5/reference/4-7-2) | [styling](index.html#phase5/lesson/styling) |
| 4.7.3 Heatmap | [Read](index.html#phase5/reference/4-7-3) | [styling](index.html#phase5/lesson/styling) |
| 4.7.4 OpenLayers: drawing, modifying, snapping | [Read](index.html#phase5/reference/4-7-4) | [styling](index.html#phase5/lesson/styling) |
| 4.7.5 Leaflet, CesiumJS and deck.gl in one glance | [Read](index.html#phase5/reference/4-7-5) | [services](index.html#phase5/lesson/services) |
| 4.8 Performance engineering | [Read](index.html#phase5/reference/4-8) | [performance](index.html#phase5/lesson/performance) |
| 4.9 Authentication and authorization for spatial data | [Read](index.html#phase5/reference/4-9) | [security](index.html#phase5/lesson/security) |
| 5. Worked GIS example — an editable street-tree inventory | [Read](index.html#phase5/reference/5) | [inventory](index.html#phase5/lesson/inventory) |
| 5.1 Scenario | [Read](index.html#phase5/reference/5-1) | [inventory](index.html#phase5/lesson/inventory) |
| 5.2 Step 1 — Run the database and servers | [Read](index.html#phase5/reference/5-2) | [inventory](index.html#phase5/lesson/inventory) |
| 5.3 Step 2 — Schema, roles, security, data (`initdb/01_schema.sql`) | [Read](index.html#phase5/reference/5-3) | [inventory](index.html#phase5/lesson/inventory) |
| 5.4 Step 3 — Tile function (`initdb/02_tiles.sql`) | [Read](index.html#phase5/reference/5-4) | [mvt](index.html#phase5/lesson/mvt) |
| 5.5 Step 4 — Verify the read path | [Read](index.html#phase5/reference/5-5) | [inventory](index.html#phase5/lesson/inventory) |
| 5.6 Step 5 — The edit API (`edit_api/main.py`) | [Read](index.html#phase5/reference/5-6) | [editing](index.html#phase5/lesson/editing) |
| 5.7 Step 6 — Web client (`index.html`, serve with `python3 -m http.server 8080`) | [Read](index.html#phase5/reference/5-7) | [editing](index.html#phase5/lesson/editing) |
| 5.8 Verification checklist for the worked example | [Read](index.html#phase5/reference/5-8) | [inventory](index.html#phase5/lesson/inventory) |
| 6. Common pitfalls and best practices | [Read](index.html#phase5/reference/6) | [security](index.html#phase5/lesson/security) |
| 6.1 Coordinate systems and geometry | [Read](index.html#phase5/reference/6-1) | [tile-math](index.html#phase5/lesson/tile-math) |
| 6.2 Tiles and rendering | [Read](index.html#phase5/reference/6-2) | [mvt](index.html#phase5/lesson/mvt) |
| 6.3 Database and API performance | [Read](index.html#phase5/reference/6-3) | [performance](index.html#phase5/lesson/performance) |
| 6.4 Security | [Read](index.html#phase5/reference/6-4) | [security](index.html#phase5/lesson/security) |
| 6.5 Editing | [Read](index.html#phase5/reference/6-5) | [editing](index.html#phase5/lesson/editing) |
| 6.6 Best-practice checklist | [Read](index.html#phase5/reference/6-6) | [security](index.html#phase5/lesson/security) |
| 7. Progressive exercises | [Read](index.html#phase5/reference/7) | [tile-math](index.html#phase5/lesson/tile-math) |
| Exercise 1 — Beginner: build a tile-math toolkit | [Read](index.html#phase5/reference/exercise-1) | [tile-math](index.html#phase5/lesson/tile-math) |
| Exercise 2 — Intermediate: publish a polygon layer as vector tiles and OGC API Features | [Read](index.html#phase5/reference/exercise-2) | [styling](index.html#phase5/lesson/styling) |
| Exercise 3 — Advanced: scale to one million points and engineer performance | [Read](index.html#phase5/reference/exercise-3) | [performance](index.html#phase5/lesson/performance) |
| Exercise 4 — Applied challenge: a secure, editable inventory | [Read](index.html#phase5/reference/exercise-4) | [capstone](index.html#phase5/lesson/capstone) |
| 8. Solutions and explanations | [Read](index.html#phase5/reference/8) | [tile-math](index.html#phase5/lesson/tile-math) |
| Solution 1 — tile-math toolkit | [Read](index.html#phase5/reference/solution-1) | [tile-math](index.html#phase5/lesson/tile-math) |
| Solution 2 — polygon layer: vector tiles + OGC API | [Read](index.html#phase5/reference/solution-2) | [styling](index.html#phase5/lesson/styling) |
| Solution 3 — one million points | [Read](index.html#phase5/reference/solution-3) | [performance](index.html#phase5/lesson/performance) |
| Solution 4 — secure, editable inventory (reference design) | [Read](index.html#phase5/reference/solution-4) | [capstone](index.html#phase5/lesson/capstone) |
| 9. Summary, glossary, and further reading | [Read](index.html#phase5/reference/9) | [capstone](index.html#phase5/lesson/capstone) |
| 9.1 Key takeaways | [Read](index.html#phase5/reference/9-1) | [capstone](index.html#phase5/lesson/capstone) |
| 9.2 Glossary | [Read](index.html#phase5/reference/9-2) | [capstone](index.html#phase5/lesson/capstone) |
| 9.3 Further reading (authoritative sources) | [Read](index.html#phase5/reference/9-3) | [capstone](index.html#phase5/lesson/capstone) |
| 9.4 Verification status of this note | [Read](index.html#phase5/reference/9-4) | [capstone](index.html#phase5/lesson/capstone) |

Rebuild: `npm run build:phase56`. Every step asset is generated from its own visual definition in `phase5-course.js`.
