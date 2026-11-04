# Phase 4 source coverage

All 60 sections of [the supplied note](phase-4-spatial-databases.md) are retained without content edits (line endings canonicalised to LF). 25 tables, 37 code/text blocks and 5 Mermaid diagrams render offline. Source formulas and ASCII schematics remain complete preformatted text.

SHA-256 of LF source: `58c209ed4eb6950a0f9758a97bf3f774bc2a3102a4a4b0a0f63771867a4d35bd`

Clarifications are separate from the original text and SQL downloads. Coverage is not evidence that database queries, routing or a tile service were executed.

| Source section | Guided chapter | Full reading | Source lines |
|---|---|---|---|
| Phase 4 — Spatial Databases: PostGIS, Spatial SQL, pgRouting, Alternatives, and Data Modeling | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/overview) | 1–8 |
| 1. Title, Learning Objectives, Prerequisites | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/1) | 9–10 |
| 1.1 Learning objectives | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/1-1) | 11–22 |
| 1.2 Prerequisites | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/1-2) | 23–30 |
| 1.3 Suggested 3–4 week learning path | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/1-3) | 31–41 |
| 2. Conceptual Foundations | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/2) | 42–43 |
| 2.1 What is a spatial database? | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/2-1) | 44–49 |
| 2.2 Key terminology | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/2-2) | 50–65 |
| 2.3 `geometry` vs `geography` | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/2-3) | 66–99 |
| 2.4 Spatial relationships and DE-9IM | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/2-4) | 100–120 |
| 2.5 Why spatial indexes exist: bbox filtering | [GiST and query plans](index.html#phase4/lesson/indexes) | [Read](index.html#phase4/reference/2-5) | 121–132 |
| 3. Visual Explanations | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/3) | 133–134 |
| 3.1 Conceptual overview: the Phase 4 landscape | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/3-1) | 135–170 |
| 3.2 Workflow: filter-and-refine for a spatial predicate | [GiST and query plans](index.html#phase4/lesson/indexes) | [Read](index.html#phase4/reference/3-2) | 171–183 |
| 3.3 Sequence: serving a vector tile from PostGIS | [Vector tiles](index.html#phase4/lesson/tiles) | [Read](index.html#phase4/reference/3-3) | 184–201 |
| 3.4 Data model: valid-time versioned features (used in §4.8 and the capstone) | [Valid-time capstone](index.html#phase4/lesson/registry) | [Read](index.html#phase4/reference/3-4) | 202–227 |
| 3.5 Choosing an engine | [Alternative engines](index.html#phase4/lesson/engines) | [Read](index.html#phase4/reference/3-5) | 228–245 |
| 4. Technical Deep Dive | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/4) | 246–247 |
| 4.1 PostGIS spatial types and storage | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/4-1) | 248–286 |
| 4.2 GiST and other spatial indexes | [GiST and query plans](index.html#phase4/lesson/indexes) | [Read](index.html#phase4/reference/4-2) | 287–324 |
| 4.3 The `ST_*` function families | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/4-3) | 325–349 |
| 4.4 Query planning for spatial queries | [GiST and query plans](index.html#phase4/lesson/indexes) | [Read](index.html#phase4/reference/4-4) | 350–391 |
| 4.5 Spatial SQL patterns | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/4-5) | 392–393 |
| 4.5.1 Nearest neighbour (KNN) | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/4-5-1) | 394–424 |
| 4.5.2 `ST_DWithin` vs `ST_Distance` | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/4-5-2) | 425–440 |
| 4.5.3 Clustering | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/4-5-3) | 441–464 |
| 4.5.4 Tiling queries (vector tiles) | [Vector tiles](index.html#phase4/lesson/tiles) | [Read](index.html#phase4/reference/4-5-4) | 465–506 |
| 4.6 pgRouting for network analysis | [pgRouting networks](index.html#phase4/lesson/routing) | [Read](index.html#phase4/reference/4-6) | 507–601 |
| 4.7 Alternatives to PostGIS | [Alternative engines](index.html#phase4/lesson/engines) | [Read](index.html#phase4/reference/4-7) | 602–641 |
| 4.8 Data modeling | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/4-8) | 642–643 |
| 4.8.1 Schema design basics | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/4-8-1) | 644–651 |
| 4.8.2 Data-quality constraints | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/4-8-2) | 652–671 |
| 4.8.3 Versioning and temporal data | [Valid-time capstone](index.html#phase4/lesson/registry) | [Read](index.html#phase4/reference/4-8-3) | 672–703 |
| 4.8.4 Topology-aware schemas | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/4-8-4) | 704–727 |
| 5. Worked GIS Example — Emergency Response Analysis | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/5) | 728–731 |
| 5.1 Schematic layout (not to scale) | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/5-1) | 732–761 |
| 5.2 Step 1 — Schema, data, indexes | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/5-2) | 762–802 |
| 5.3 Step 2 — Validate the load | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/5-3) | 803–815 |
| 5.4 Step 3 — Nearest station per incident (KNN) | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/5-4) | 816–835 |
| 5.5 Step 4 — Response radius with `ST_DWithin` (inclusive) | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/5-5) | 836–849 |
| 5.6 Step 5 — Incidents per district: boundary behaviour | [Boundaries and predicates](index.html#phase4/lesson/relationships) | [Read](index.html#phase4/reference/5-6) | 850–871 |
| 5.7 Step 6 — Hot spots with DBSCAN | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/5-7) | 872–881 |
| 5.8 Step 7 — Check the plan | [GiST and query plans](index.html#phase4/lesson/indexes) | [Read](index.html#phase4/reference/5-8) | 882–891 |
| 5.9 Step 8 — Vector tile | [Vector tiles](index.html#phase4/lesson/tiles) | [Read](index.html#phase4/reference/5-9) | 892–906 |
| 6. Common Pitfalls and Best Practices | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/6) | 907–931 |
| 7. Progressive Exercises | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/7) | 932–937 |
| Exercise 1 — Beginner: Foundations, SRIDs, and the geometry/geography difference | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/exercise-1) | 938–963 |
| Exercise 2 — Intermediate: Index-aware spatial SQL | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/exercise-2) | 964–988 |
| Exercise 3 — Advanced: Network analysis with pgRouting | [pgRouting networks](index.html#phase4/lesson/routing) | [Read](index.html#phase4/reference/exercise-3) | 989–1021 |
| Exercise 4 — Applied challenge: A versioned, validated, queryable station registry | [Valid-time capstone](index.html#phase4/lesson/registry) | [Read](index.html#phase4/reference/exercise-4) | 1022–1050 |
| 8. Solutions and Explanations | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/8) | 1051–1054 |
| 8.1 Solution to Exercise 1 | [Types and coordinates](index.html#phase4/lesson/foundations) | [Read](index.html#phase4/reference/8-1) | 1055–1106 |
| 8.2 Solution to Exercise 2 | [KNN, radius and clusters](index.html#phase4/lesson/queries) | [Read](index.html#phase4/reference/8-2) | 1107–1157 |
| 8.3 Solution to Exercise 3 | [pgRouting networks](index.html#phase4/lesson/routing) | [Read](index.html#phase4/reference/8-3) | 1158–1199 |
| 8.4 Solution to Exercise 4 | [Valid-time capstone](index.html#phase4/lesson/registry) | [Read](index.html#phase4/reference/8-4) | 1200–1295 |
| 9. Summary, Glossary, and Further Reading | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/9) | 1296–1297 |
| 9.1 Key takeaways | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/9-1) | 1298–1308 |
| 9.2 Glossary | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/9-2) | 1309–1333 |
| 9.3 Further reading | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/9-3) | 1334–1348 |
| 9.4 Where to go next | [Quality and topology](index.html#phase4/lesson/modeling) | [Read](index.html#phase4/reference/9-4) | 1349–1354 |

Rebuild with `npm run build:phase4` using Chromium as described in README.md.
