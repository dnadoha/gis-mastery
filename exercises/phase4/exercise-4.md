### Exercise 4 — Applied challenge: A versioned, validated, queryable station registry

**Scenario.** Station S2 is relocated to `(125000, 487000)` effective `2026-01-01 00:00 UTC`. The dispatch analytics team must be able to answer "which station was nearest to each incident **as of** date X?" for any past or present date, and the registry must be protected against bad data.

**Task.** Design and implement, in one SQL script:

1. A `station_version` table (valid-time model from §4.8.3) with typmod geometry, an exclusion constraint preventing overlapping versions per station, a GiST index on the geometry, and data-quality checks (`ST_IsValid`, not empty, inside the extent `(0, 289000)–(300000, 629000)`).
2. Initial data: S1 and S3 current since `2020-01-01`; S2 at `(123000, 487000)` valid `[2020-01-01, 2026-01-01)` and at `(125000, 487000)` valid `[2026-01-01, ∞)`.
3. A function `relocate_station(p_station_id int, p_new_geom geometry, p_effective timestamptz)` that **atomically** closes the current version and inserts the new one, rejecting an effective date that is not after the current version's start.
4. A function `nearest_station_asof(p_point geometry, p_asof timestamptz)` returning station id, name, and distance using KNN on the versions valid at `p_asof`.
5. Evidence of three negative tests: overlapping validity, wrong SRID, and a point outside the extent each fail.
6. A short written note (5–8 lines) explaining why the as-of KNN filter on `valid_during` may become a performance concern at scale and one mitigation.

**Prerequisites.** Exercises 1–3; §4.5.1, §4.8.

**Sample input.** Incidents I1–I3 from §5; as-of dates `2025-06-01` and `2026-06-01`.

**Expected deliverable.** `registry.sql` (schema, data, functions), a results file with the as-of outputs and the three error messages, and the note from step 6.

**Success criteria.**
* As of `2025-06-01`: I1 → S1 (500.00), I2 → S2 (1000.00), I3 → S3 (1720.47).
* As of `2026-06-01`: I1 → S1 (500.00), **I2 → S1 (2000.00)**, I3 → S3 (1720.47).
* Inserting an overlapping version for station 2 fails with an exclusion-constraint violation (SQLSTATE `23P01`); the other two negative tests fail with check/typmod errors.
* `relocate_station` leaves exactly one open-ended version per station and no overlaps even if run twice for the same date (the second call must be rejected).

**Hint.** Close the old version with `valid_during = tstzrange(lower(valid_during), p_effective, '[)')`, then insert `tstzrange(p_effective, NULL, '[)')`. You need `btree_gist` for the exclusion constraint.

---

