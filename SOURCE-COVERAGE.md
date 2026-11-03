# Source coverage: Core Geospatial Concepts

This index maps every section of [the supplied note](core-geospatial-concepts.md) to its full website reading and connected beginner chapter. The chapter story introduces the idea; **Full detail from the original note** contains the complete source text, tables, code, tasks, hints, criteria and solutions assigned to that chapter. The [complete-note reader](index.html#reference) also follows the source order from preparation to Appendix A.

## What the audit added

The earlier chapter explanations were summaries. They did not reproduce every parameter, table row, formula, procedure or solution. The complete readings now include:

- Earth models, ellipsoid parameters, datum/frame versions and epochs; every CRS and axis-order comparison.
- All projection, curvature, distance, Helmert, orientation, area, geotransform and interpolation formulas.
- Geometry hierarchy, validity rules, full DE-9IM matrix/pattern tables, algorithms and boundary cases.
- Raster sampling, NoData, storage arithmetic, COG, numeric precision, classification and label placement.
- The full QGIS A–E lab, tool-equivalence tables, nine-part station investigation, 20 pitfalls and best practices.
- All four progressive exercises with their sample inputs, prerequisites, deliverables, tolerances and hints; all four full solutions and outputs.
- Study plan, glossary, authoritative reading list, next steps and the complete downloadable [geolib.py](data/geolib.py).

## Checked completeness

- **71 / 71 source sections** explicitly mapped, including introductory and parent sections.
- **34 tables, 33 code/text listings, 9 displayed equations, 6 Mermaid diagrams and 16 source images** rendered in the full readings.
- The saved source slices concatenate byte-for-byte to the LF-canonical UTF-8 source (no content edits); SHA-256: `4c0ba546313b452a86207db300865a5ea56b1919e9ccb1cf0e64f6904d5ac72a`.
- Unmapped, duplicated or stale section mappings fail the build. Tests detect source changes, missing content, missing figures and stale generated output.
- This is a content-inclusion audit. External QGIS/PostGIS workflows and all third-party code examples are not thereby certified as executed. Short reading clarifications accompany source passages whose assumptions need care.

## Section-by-section locations

| Source section | Full website reading | Connected chapters | Source lines |
|---|---|---|---|
| Core Geospatial Concepts for GIS Developers | [Read in full](index.html#reference/overview) | [1. Draw our map](index.html#lesson/geometry/source-overview) | 1–18 |
| 1. Learning objectives, prerequisites and expected outcomes | [Read in full](index.html#reference/1) | [1. Draw our map](index.html#lesson/geometry/source-1) | 19–20 |
| 1.1 Learning objectives | [Read in full](index.html#reference/1-1) | [1. Draw our map](index.html#lesson/geometry/source-1-1) | 21–33 |
| 1.2 Prerequisites | [Read in full](index.html#reference/1-2) | [17. Open the same data](index.html#lesson/qgis/source-1-2) | 34–39 |
| 1.3 Expected outcomes | [Read in full](index.html#reference/1-3) | [1. Draw our map](index.html#lesson/geometry/source-1-3) | 40–48 |
| 1.4 Suggested study plan | [Read in full](index.html#reference/1-4) | [1. Draw our map](index.html#lesson/geometry/source-1-4) | 49–59 |
| 2. Conceptual foundations | [Read in full](index.html#reference/2) | [3. Agree on a reference](index.html#lesson/earth/source-2) | 60–61 |
| 2.1 Modelling the Earth: geoid, ellipsoid, datum | [Read in full](index.html#reference/2-1) | [3. Agree on a reference](index.html#lesson/earth/source-2-1) | 62–89 |
| 2.2 Coordinate reference systems (CRS) | [Read in full](index.html#reference/2-2) | [4. Label the coordinates](index.html#lesson/crs/source-2-2) · [5. Choose a flat map](index.html#lesson/projections/source-2-2) | 90–114 |
| 2.3 Axis order: latitude/longitude vs. longitude/latitude | [Read in full](index.html#reference/2-3) | [2. Name the coordinates](index.html#lesson/axes/source-2-3) | 115–148 |
| 2.4 The geometry model: OGC Simple Features | [Read in full](index.html#reference/2-4) | [1. Draw our map](index.html#lesson/geometry/source-2-4) · [12. Compare the school areas](index.html#lesson/topology/source-2-4) | 149–203 |
| 2.5 Raster vs. vector | [Read in full](index.html#reference/2-5) | [9. Add a population grid](index.html#lesson/vector-raster/source-2-5) | 204–228 |
| 2.6 Scale, accuracy, precision and resolution | [Read in full](index.html#reference/2-6) | [8. Check location quality](index.html#lesson/precision/source-2-6) | 229–248 |
| 2.7 Basic cartography | [Read in full](index.html#reference/2-7) | [15. Explain the map](index.html#lesson/cartography/source-2-7) | 249–286 |
| 3. Visual explanations | [Read in full](index.html#reference/3) | [4. Label the coordinates](index.html#lesson/crs/source-3) | 287–288 |
| 3.1 Conceptual overview: from the Earth to a styled map | [Read in full](index.html#reference/3-1) | [4. Label the coordinates](index.html#lesson/crs/source-3-1) | 289–308 |
| 3.2 Geometry type hierarchy (OGC Simple Features) | [Read in full](index.html#reference/3-2) | [1. Draw our map](index.html#lesson/geometry/source-3-2) | 309–345 |
| 3.3 Workflow: diagnosing "my data is in the wrong place" | [Read in full](index.html#reference/3-3) | [18. Check our finished work](index.html#lesson/debugging/source-3-3) · [6. Convert the coordinates](index.html#lesson/transformations/source-3-3) | 346–362 |
| 3.4 Sequence: what happens during a reprojection | [Read in full](index.html#reference/3-4) | [6. Convert the coordinates](index.html#lesson/transformations/source-3-4) | 363–379 |
| 3.5 Data model: GeoPackage metadata tables (simplified) | [Read in full](index.html#reference/3-5) | [16. Package the data](index.html#lesson/formats/source-3-5) | 380–415 |
| 4. Technical deep dive | [Read in full](index.html#reference/4) | [13. Check the calculation](index.html#lesson/algorithms/source-4) | 416–417 |
| 4.1 Geographic coordinates: lengths of degrees and distances on the ellipsoid | [Read in full](index.html#reference/4-1) | [7. Measure the journey](index.html#lesson/distances/source-4-1) | 418–482 |
| 4.2 Map projections in practice | [Read in full](index.html#reference/4-2) | [5. Choose a flat map](index.html#lesson/projections/source-4-2) | 483–526 |
| 4.3 Datum transformations and PROJ pipelines | [Read in full](index.html#reference/4-3) | [6. Convert the coordinates](index.html#lesson/transformations/source-4-3) · [3. Agree on a reference](index.html#lesson/earth/source-4-3) | 527–584 |
| 4.4 Geometry algorithms and spatial relationships | [Read in full](index.html#reference/4-4) | [13. Check the calculation](index.html#lesson/algorithms/source-4-4) | 585–586 |
| 4.4.1 Orientation test and segment intersection | [Read in full](index.html#reference/4-4-1) | [13. Check the calculation](index.html#lesson/algorithms/source-4-4-1) | 587–596 |
| 4.4.2 Area and centroid of a simple polygon (shoelace formula) | [Read in full](index.html#reference/4-4-2) | [13. Check the calculation](index.html#lesson/algorithms/source-4-4-2) | 597–607 |
| 4.4.3 Point-in-polygon (ray casting, even-odd rule) | [Read in full](index.html#reference/4-4-3) | [13. Check the calculation](index.html#lesson/algorithms/source-4-4-3) · [12. Compare the school areas](index.html#lesson/topology/source-4-4-3) | 608–634 |
| 4.4.4 Spatial relationships: the DE-9IM | [Read in full](index.html#reference/4-4-4) | [12. Compare the school areas](index.html#lesson/topology/source-4-4-4) | 635–678 |
| 4.4.5 Validity checks in code | [Read in full](index.html#reference/4-4-5) | [1. Draw our map](index.html#lesson/geometry/source-4-4-5) | 679–733 |
| 4.4.6 Simplification, buffering and units | [Read in full](index.html#reference/4-4-6) | [13. Check the calculation](index.html#lesson/algorithms/source-4-4-6) | 734–743 |
| 4.5 Raster internals: geotransform, resampling, storage | [Read in full](index.html#reference/4-5) | [9. Add a population grid](index.html#lesson/vector-raster/source-4-5) | 744–745 |
| 4.5.1 The geotransform | [Read in full](index.html#reference/4-5-1) | [10. Locate each cell](index.html#lesson/geotransform/source-4-5-1) | 746–788 |
| 4.5.2 Resampling | [Read in full](index.html#reference/4-5-2) | [11. Handle a new grid size](index.html#lesson/resampling/source-4-5-2) | 789–836 |
| 4.5.3 Size arithmetic and storage | [Read in full](index.html#reference/4-5-3) | [9. Add a population grid](index.html#lesson/vector-raster/source-4-5-3) · [16. Package the data](index.html#lesson/formats/source-4-5-3) | 837–843 |
| 4.6 Scale, precision and numeric representation | [Read in full](index.html#reference/4-6) | [8. Check location quality](index.html#lesson/precision/source-4-6) | 844–871 |
| 4.7 Classification and labelling algorithms | [Read in full](index.html#reference/4-7) | [15. Explain the map](index.html#lesson/cartography/source-4-7) | 872–873 |
| 4.7.1 Classification methods | [Read in full](index.html#reference/4-7-1) | [15. Explain the map](index.html#lesson/cartography/source-4-7-1) | 874–924 |
| 4.7.2 Label anchors: centroid vs. representative point | [Read in full](index.html#reference/4-7-2) | [15. Explain the map](index.html#lesson/cartography/source-4-7-2) · [13. Check the calculation](index.html#lesson/algorithms/source-4-7-2) | 925–944 |
| 4.8 File formats and spatial databases | [Read in full](index.html#reference/4-8) | [16. Package the data](index.html#lesson/formats/source-4-8) · [6. Convert the coordinates](index.html#lesson/transformations/source-4-8) | 945–991 |
| 4.9 Hands-on lab: QGIS as a visual debugger for your future code | [Read in full](index.html#reference/4-9) | [17. Open the same data](index.html#lesson/qgis/source-4-9) | 992–1059 |
| 5. Worked GIS example: "Why are my stations in the Indian Ocean?" | [Read in full](index.html#reference/5) | [18. Check our finished work](index.html#lesson/debugging/source-5) | 1060–1061 |
| 5.1 Scenario | [Read in full](index.html#reference/5-1) | [2. Name the coordinates](index.html#lesson/axes/source-5-1) · [18. Check our finished work](index.html#lesson/debugging/source-5-1) | 1062–1077 |
| 5.2 Step 1: Inspect the numbers | [Read in full](index.html#reference/5-2) | [2. Name the coordinates](index.html#lesson/axes/source-5-2) · [18. Check our finished work](index.html#lesson/debugging/source-5-2) | 1078–1081 |
| 5.3 Step 2: Test both axis hypotheses against the expected area | [Read in full](index.html#reference/5-3) | [2. Name the coordinates](index.html#lesson/axes/source-5-3) · [18. Check our finished work](index.html#lesson/debugging/source-5-3) | 1082–1092 |
| 5.4 Step 3: Normalise and label (assign, do not transform) | [Read in full](index.html#reference/5-4) | [6. Convert the coordinates](index.html#lesson/transformations/source-5-4) | 1093–1107 |
| 5.5 Step 4: Pick a CRS for measurement and project | [Read in full](index.html#reference/5-5) | [5. Choose a flat map](index.html#lesson/projections/source-5-5) | 1108–1130 |
| 5.6 Step 5: Distances computed four ways | [Read in full](index.html#reference/5-6) | [7. Measure the journey](index.html#lesson/distances/source-5-6) | 1131–1158 |
| 5.7 Step 6: Areas computed four ways | [Read in full](index.html#reference/5-7) | [7. Measure the journey](index.html#lesson/distances/source-5-7) | 1159–1183 |
| 5.8 Step 7: Same results in SQL (PostGIS) | [Read in full](index.html#reference/5-8) | [16. Package the data](index.html#lesson/formats/source-5-8) | 1184–1187 |
| 5.9 Conclusions of the example | [Read in full](index.html#reference/5-9) | [18. Check our finished work](index.html#lesson/debugging/source-5-9) | 1188–1196 |
| 6. Common pitfalls and best practices | [Read in full](index.html#reference/6) | [18. Check our finished work](index.html#lesson/debugging/source-6) | 1197–1198 |
| 6.1 Pitfall catalogue | [Read in full](index.html#reference/6-1) | [18. Check our finished work](index.html#lesson/debugging/source-6-1) | 1199–1223 |
| 6.2 Best practices | [Read in full](index.html#reference/6-2) | [18. Check our finished work](index.html#lesson/debugging/source-6-2) | 1224–1241 |
| 6.3 A minimal ingest-validation function | [Read in full](index.html#reference/6-3) | [18. Check our finished work](index.html#lesson/debugging/source-6-3) | 1242–1265 |
| 7. Progressive exercises | [Read in full](index.html#reference/7) | [14. Count people once](index.html#lesson/coverage/source-7) | 1266–1280 |
| Exercise 1: CRS literacy, precision and your first QGIS session (Beginner) | [Read in full](index.html#reference/exercise-1) | [4. Label the coordinates](index.html#lesson/crs/source-exercise-1) · [8. Check location quality](index.html#lesson/precision/source-exercise-1) · [17. Open the same data](index.html#lesson/qgis/source-exercise-1) | 1281–1338 |
| Exercise 2: Axis order, reprojection and measuring the distortion (Intermediate) | [Read in full](index.html#reference/exercise-2) | [2. Name the coordinates](index.html#lesson/axes/source-exercise-2) · [6. Convert the coordinates](index.html#lesson/transformations/source-exercise-2) · [7. Measure the journey](index.html#lesson/distances/source-exercise-2) | 1339–1378 |
| Exercise 3: Geometry model, validity and spatial relationships (Advanced) | [Read in full](index.html#reference/exercise-3) | [1. Draw our map](index.html#lesson/geometry/source-exercise-3) · [13. Check the calculation](index.html#lesson/algorithms/source-exercise-3) · [12. Compare the school areas](index.html#lesson/topology/source-exercise-3) | 1379–1412 |
| Exercise 4: Applied challenge, a service-coverage audit (Applied) | [Read in full](index.html#reference/exercise-4) | [14. Count people once](index.html#lesson/coverage/source-exercise-4) · [10. Locate each cell](index.html#lesson/geotransform/source-exercise-4) · [11. Handle a new grid size](index.html#lesson/resampling/source-exercise-4) · [15. Explain the map](index.html#lesson/cartography/source-exercise-4) | 1413–1459 |
| 8. Solutions and explanations | [Read in full](index.html#reference/8) | [14. Count people once](index.html#lesson/coverage/source-8) | 1460–1463 |
| Solution 1 | [Read in full](index.html#reference/solution-1) | [4. Label the coordinates](index.html#lesson/crs/source-solution-1) · [8. Check location quality](index.html#lesson/precision/source-solution-1) · [17. Open the same data](index.html#lesson/qgis/source-solution-1) | 1464–1500 |
| Solution 2 | [Read in full](index.html#reference/solution-2) | [2. Name the coordinates](index.html#lesson/axes/source-solution-2) · [6. Convert the coordinates](index.html#lesson/transformations/source-solution-2) · [7. Measure the journey](index.html#lesson/distances/source-solution-2) | 1501–1556 |
| Solution 3 | [Read in full](index.html#reference/solution-3) | [1. Draw our map](index.html#lesson/geometry/source-solution-3) · [13. Check the calculation](index.html#lesson/algorithms/source-solution-3) · [12. Compare the school areas](index.html#lesson/topology/source-solution-3) | 1557–1629 |
| Solution 4 | [Read in full](index.html#reference/solution-4) | [14. Count people once](index.html#lesson/coverage/source-solution-4) · [10. Locate each cell](index.html#lesson/geotransform/source-solution-4) · [11. Handle a new grid size](index.html#lesson/resampling/source-solution-4) · [15. Explain the map](index.html#lesson/cartography/source-solution-4) | 1630–1742 |
| 9. Summary, glossary and further reading | [Read in full](index.html#reference/9) | [18. Check our finished work](index.html#lesson/debugging/source-9) | 1743–1744 |
| 9.1 Key takeaways | [Read in full](index.html#reference/9-1) | [18. Check our finished work](index.html#lesson/debugging/source-9-1) | 1745–1757 |
| 9.2 Glossary | [Read in full](index.html#reference/9-2) | [18. Check our finished work](index.html#lesson/debugging/source-9-2) | 1758–1796 |
| 9.3 Further reading and authoritative references | [Read in full](index.html#reference/9-3) | [18. Check our finished work](index.html#lesson/debugging/source-9-3) | 1797–1816 |
| 9.4 Where to go next | [Read in full](index.html#reference/9-4) | [18. Check our finished work](index.html#lesson/debugging/source-9-4) | 1817–1822 |
| Appendix A — Reference implementation (`geolib.py`) | [Read in full](index.html#reference/appendix-a) | [13. Check the calculation](index.html#lesson/algorithms/source-appendix-a) · [7. Measure the journey](index.html#lesson/distances/source-appendix-a) | 1823–1931 |

## Rebuild and verify

Run `npm ci`, then `npm run build` and `npm test`. Diagram generation uses Puppeteer/Chromium; set `PUPPETEER_EXECUTABLE_PATH` for an installed browser. The committed website needs no npm packages, CDN, math engine or diagram engine at runtime. The complete beginner download includes the full technical text after its connected first reading.
