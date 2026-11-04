# Phase 4 — Spatial database workshop

Open [the learning path](../../index.html#phase4) or read the unchanged [source note](../../phase-4-spatial-databases.md). The fixture is synthetic emergency-response data in EPSG:28992 (metres), separate from the previous phases. The graph uses abstract costs, not metres.

## Environment

Use a **scratch database** in PostgreSQL 14–17 with PostGIS 3.3+ and GEOS 3.11+, following the source’s version assumptions. Exercise 3 needs pgRouting; Exercise 4 needs `btree_gist`. Install extension packages for your PostgreSQL version first, then enable them as a database user with the required privileges. A PostGIS container does not necessarily include pgRouting. Use `psql` or another SQL client; QGIS is optional for inspection.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT version(), postgis_full_version();
-- Needed later:
CREATE EXTENSION IF NOT EXISTS pgrouting CASCADE;
SELECT pgr_version();
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Record installed versions. pgRouting signatures and result columns vary between releases. No live geocoding, public routing service, real incident data or browser database connection is needed.

## Work in order

1. `exercise-1.md`: create the three tables, check metadata, prove the wrong-SRID rejection and compare geometry/geography units.
2. `exercise-2.md`: reuse those tables for indexed radius search, two-nearest KNN, one-owner district assignment and DBSCAN.
3. `exercise-3.md`: add `toy_edge`, compare cost matrices and test a one-way edge. The Euclidean comparison intentionally uses **only S1 and S2**.
4. `exercise-4.md`: keep `incident`, add the versioned registry, implement relocation and test historical nearest queries and failures.

Each `solutions/exercise-N.sql` is the **complete original SQL listing**, not a starter. Each matching `.md` includes the full source explanation and expected results. Attempt the task first. These source downloads are not silently corrected or certified as executed.

`worked-example.sql` assembles §§5.2–5.8. `toy-graph.sql` contains §4.6. `incident-mvt.sql` contains §4.5.4. These create tables/functions and are not rerunnable unchanged. The worked example and Exercise 1 both create the same three tables; choose one in a fresh scratch database. Exercise 3 and `toy-graph.sql` both create `toy_edge`. Run subsequent exercises in the same fixture database, creating each table only once.

## Deliberate SQL errors

The wrong-SRID insert in Exercise 1 and three negative inserts in Exercise 4 **must fail**. With `psql -v ON_ERROR_STOP=1 -f solutions/exercise-1.sql`, execution stops at the first expected error, so run the positive and negative portions separately. With autocommit, later commands can continue; inside an explicit transaction an error aborts the transaction until rollback. In a GUI, check its transaction mode.

To investigate a failure without losing the surrounding transaction, run commands interactively:

```sql
BEGIN;
SAVEPOINT expected_failure;
-- Run ONE deliberately failing INSERT from the source here; capture its error.
ROLLBACK TO SAVEPOINT expected_failure;
-- Repeat with a new savepoint for each expected failure.
ROLLBACK;
```

Never change an expected failure to a success just to make a batch finish. Keep the actual SQLSTATE and message. Overlapping validity should raise `23P01`; the extent constraint should raise `23514`. Restore `enable_seqscan` with `RESET enable_seqscan` after the teaching plan check, including after interrupted sessions.

## Reading clarifications to apply

- **Strict versus inclusive:** `ST_DWithin(...,2000)` includes equality and returns four fixture pairs. The original `ST_Distance(...) < 2000` returns three. Use both predicates to preserve a strict original contract.
- **Plans:** a sequential scan on three rows is normal. Capture an illustrative index plan, then measure realistic workloads with `EXPLAIN (ANALYZE, BUFFERS)` and normal settings. Timings in the note are not your evidence.
- **Tiles:** expand candidate bounds for a requested buffer; `ST_AsMVTGeom` cannot recover prefiltered rows. Compute tiles from the actual synthetic coordinates. Amsterdam tile 10/525/336 does not establish fixture membership. Regional-CRS transforms need sensible zoom/extent limits. The SQL file creates a function, not an HTTP tile service.
- **Quality:** `&&` tests bbox overlap, not full polygon containment. Union interior-ring counts miss outer and disconnected gaps; compare with an expected study boundary. Cross-row topology triggers need concurrency control.
- **Registry:** reject NULL/non-finite effective dates, require finite starts and half-open validity ranges, and test dates at version boundaries. The supplied function uses `FOR UPDATE`; use a stable per-station row/advisory lock plus retry handling for concurrent writers. Test two sessions explicitly. Exclusion constraints prevent overlaps but do not by themselves establish every write-protocol invariant.
- **As-of performance:** a current-row partial index needs a matching query predicate. Compare combined spatial/range indexes and historical-query plans with realistic history; do not assume separate indexes combine into a KNN plan.

## Evidence and completion

Keep your SQL, returned rows, plans, expected errors and written explanations in the website evidence fields or local files. For the registry, verify both as-of tables, no overlaps, exactly one open version per station and rejection of a repeat relocation date. Record a successful relocation too, then test invalid calls leave the data unchanged. The source already seeds S2’s 2026 relocation, so a call at the same effective date is expected to fail.

Opening a solution never marks completion. Completion is self-reported after local checks; editing exercise evidence clears it. Notes and progress are local to the browser/origin and included in the shared notebook export. This static course does not run PostgreSQL, pgRouting or SQL for you.
