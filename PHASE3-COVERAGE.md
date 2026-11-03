# Phase 3 source coverage

All 53 sections of [the supplied note](gis-note-phase3.md) are retained without content edits (line endings canonicalised to LF). 23 tables, 33 code/text blocks, 4 equations and 5 Mermaid diagrams render offline. ASCII schematics remain complete preformatted text.

SHA-256 of LF source: `045c8db7981da3cf0b100336b506f3482a2e471f7e23dc81beb2a53351be4b07`

Clarifications are separate from the original text and source-code downloads. Coverage is not evidence that native GIS workflows, HTTP services or SQL were executed.

| Source section | Guided chapter | Full reading | Source lines |
|---|---|---|---|
| Programmatic GIS: Automating Spatial Data Processing with GDAL, PROJ, GEOS, Python and JavaScript | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/overview) | 1–8 |
| 1. Learning objectives, prerequisites and expected outcomes | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/1) | 9–10 |
| 1.1 Learning objectives | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/1-1) | 11–23 |
| 1.2 Prerequisites | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/1-2) | 24–33 |
| 1.3 Suggested 6-week learning path | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/1-3) | 34–44 |
| 1.4 Environment setup | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/1-4) | 45–67 |
| 2. Conceptual foundations | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/2) | 68–69 |
| 2.1 The three native engines | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/2-1) | 70–90 |
| 2.2 The data model: Simple Features and rasters | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/2-2) | 91–100 |
| 2.3 Spatial relationships (DE-9IM) | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/2-3) | 101–115 |
| 2.4 Operation taxonomy | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/2-4) | 116–131 |
| 2.5 Planar vs geodesic computation, and why units matter | [CRS discipline](index.html#phase3/lesson/crs) | [Read](index.html#phase3/reference/2-5) | 132–154 |
| 2.6 Axis order: the classic bug | [CRS discipline](index.html#phase3/lesson/crs) | [Read](index.html#phase3/reference/2-6) | 155–166 |
| 3. Visual explanations | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/3) | 167–168 |
| 3.1 Conceptual overview: the library stack | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/3-1) | 169–209 |
| 3.2 Workflow: a defensive geoprocessing pipeline | [Worked flood example](index.html#phase3/lesson/workflow) | [Read](index.html#phase3/reference/3-2) | 210–222 |
| 3.3 Schematic: the worked-example study area | [Worked flood example](index.html#phase3/lesson/workflow) | [Read](index.html#phase3/reference/3-3) | 223–245 |
| 3.4 Schematic: how common vector operations differ | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/3-4) | 246–260 |
| 3.5 Schematic: raster pixel-centre rule (Rasterio `mask`, `all_touched=False`) | [Raster processing](index.html#phase3/lesson/rasters) | [Read](index.html#phase3/reference/3-5) | 261–275 |
| 3.6 Sequence: geocode, then route | [Geocoding](index.html#phase3/lesson/geocoding) | [Read](index.html#phase3/reference/3-6) | 276–298 |
| 3.7 Data model: a routable road network (pgRouting style) | [Routing and graphs](index.html#phase3/lesson/routing) | [Read](index.html#phase3/reference/3-7) | 299–320 |
| 3.8 Decision flow: which strategy for large data? | [Windows and indexes](index.html#phase3/lesson/scale) | [Read](index.html#phase3/reference/3-8) | 321–335 |
| 4. Technical deep dive | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/4) | 336–337 |
| 4.1 GDAL/OGR: the I/O and format layer | [Engines and I/O](index.html#phase3/lesson/stack) | [Read](index.html#phase3/reference/4-1) | 338–396 |
| 4.2 PROJ and pyproj: coordinate operations | [CRS discipline](index.html#phase3/lesson/crs) | [Read](index.html#phase3/reference/4-2) | 397–426 |
| 4.3 GEOS and Shapely 2.x: geometry engine | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/4-3) | 427–474 |
| 4.4 GeoPandas: tabular geometry operations | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/4-4) | 475–501 |
| 4.5 Rasterio, NumPy and rioxarray: raster processing | [Raster processing](index.html#phase3/lesson/rasters) | [Read](index.html#phase3/reference/4-5) | 502–571 |
| 4.6 Geocoding and reverse geocoding | [Geocoding](index.html#phase3/lesson/geocoding) | [Read](index.html#phase3/reference/4-6) | 572–616 |
| 4.7 Routing and network analysis | [Routing and graphs](index.html#phase3/lesson/routing) | [Read](index.html#phase3/reference/4-7) | 617–696 |
| 4.8 Handling large datasets | [Windows and indexes](index.html#phase3/lesson/scale) | [Read](index.html#phase3/reference/4-8) | 697–748 |
| 4.9 JavaScript counterparts | [JavaScript counterparts](index.html#phase3/lesson/javascript) | [Read](index.html#phase3/reference/4-9) | 749–778 |
| 5. Worked GIS example: flood exposure of districts and clinics | [Worked flood example](index.html#phase3/lesson/workflow) | [Read](index.html#phase3/reference/5) | 779–780 |
| 5.1 Scenario | [Worked flood example](index.html#phase3/lesson/workflow) | [Read](index.html#phase3/reference/5-1) | 781–801 |
| 5.2 Complete script | [Worked flood example](index.html#phase3/lesson/workflow) | [Read](index.html#phase3/reference/5-2) | 802–910 |
| 5.3 Expected results and why | [Worked flood example](index.html#phase3/lesson/workflow) | [Read](index.html#phase3/reference/5-3) | 911–937 |
| 6. Common pitfalls and best practices | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/6) | 938–939 |
| 6.1 Pitfalls by area | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/6-1) | 940–979 |
| 6.2 Best practices | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/6-2) | 980–992 |
| 7. Progressive exercises | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/7) | 993–1005 |
| Exercise 1 (Beginner): fixtures and CRS discipline | [CRS discipline](index.html#phase3/lesson/crs) | [Read](index.html#phase3/reference/exercise-1) | 1006–1040 |
| Exercise 2 (Intermediate): the vector pipeline | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/exercise-2) | 1041–1073 |
| Exercise 3 (Advanced): rasters and scale | [Windows and indexes](index.html#phase3/lesson/scale) | [Read](index.html#phase3/reference/exercise-3) | 1074–1102 |
| Exercise 4 (Applied challenge): flood-resilient clinic access | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/exercise-4) | 1103–1147 |
| 8. Solutions and explanations | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/8) | 1148–1151 |
| Solution 1: fixtures and CRS discipline | [CRS discipline](index.html#phase3/lesson/crs) | [Read](index.html#phase3/reference/solution-1) | 1152–1247 |
| Solution 2: the vector pipeline | [Vector operations](index.html#phase3/lesson/vectors) | [Read](index.html#phase3/reference/solution-2) | 1248–1326 |
| Solution 3: rasters and scale | [Windows and indexes](index.html#phase3/lesson/scale) | [Read](index.html#phase3/reference/solution-3) | 1327–1448 |
| Solution 4: flood-resilient clinic access | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/solution-4) | 1449–1636 |
| 9. Summary, glossary and further reading | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/9) | 1637–1638 |
| 9.1 Key takeaways | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/9-1) | 1639–1649 |
| 9.2 Glossary | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/9-2) | 1650–1682 |
| 9.3 Further reading (authoritative sources) | [Capstone and verification](index.html#phase3/lesson/capstone) | [Read](index.html#phase3/reference/9-3) | 1683–1707 |

Rebuild with `npm run build:phase3` using Chromium as described in README.md.
