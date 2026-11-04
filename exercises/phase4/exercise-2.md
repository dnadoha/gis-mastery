### Exercise 2 — Intermediate: Index-aware spatial SQL

**Task.** Using your Exercise 1 database:

1. A colleague wrote `SELECT … FROM incident i, fire_station s WHERE ST_Distance(i.geom, s.geom) < 2000;`. Rewrite it so the GiST index can be used, and show with `EXPLAIN` (with `enable_seqscan = off`) that an index scan with an `&&` condition appears.
2. For each incident return its **two** nearest stations with rank and distance (KNN with `LATERAL`).
3. Assign each incident to **exactly one** district, using `ST_Covers` and the deterministic rule "if several districts match, choose the smallest `district_id`".
4. Run `ST_ClusterDBSCAN` with `eps = 1000` and then `eps = 2000` (`minpoints = 2`) and explain the difference.

**Prerequisites.** Exercise 1; §4.4–4.5, §5.6.

**Sample input.** Your three tables.

**Expected deliverable.** A SQL script with four labeled queries, the `EXPLAIN` output for query 1, and a two-sentence explanation for query 4.

**Success criteria.**
* Query 1 returns 4 station/incident pairs (S1–I1, S1–I2, S2–I2, S3–I3) and the plan references the GiST index.
* Query 2 returns six rows with the ranks/distances given in §8.2.
* Query 3 returns three rows, each incident assigned once; incident 2 goes to `West`.
* Query 4 returns all `NULL` for `eps = 1000` and all `0` for `eps = 2000`.

**Hint.** For query 3 use `SELECT DISTINCT ON (i.incident_id) …  ORDER BY i.incident_id, d.district_id`.

---

