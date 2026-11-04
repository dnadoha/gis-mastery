# Source solution — read the website clarifications before running

### 8.2 Solution to Exercise 2

```sql
-- 1. Index-friendly rewrite
SET enable_seqscan = off;
EXPLAIN
SELECT s.name, i.incident_id
FROM incident i JOIN fire_station s ON ST_DWithin(i.geom, s.geom, 2000);
-- expect: Nested Loop with Index Scan using ..._geom_gix, Index Cond containing &&
RESET enable_seqscan;

SELECT s.name, i.incident_id
FROM incident i JOIN fire_station s ON ST_DWithin(i.geom, s.geom, 2000)
ORDER BY s.name, i.incident_id;
-- S1|1 ; S1|2 ; S2|2 ; S3|3

-- 2. Two nearest stations per incident, with rank
SELECT i.incident_id,
       row_number() OVER (PARTITION BY i.incident_id ORDER BY ST_Distance(i.geom, s.geom)) AS rnk,
       s.name,
       round(ST_Distance(i.geom, s.geom)::numeric, 2) AS dist_m
FROM incident i
CROSS JOIN LATERAL (
    SELECT name, geom FROM fire_station ORDER BY geom <-> i.geom LIMIT 2
) s
ORDER BY i.incident_id, rnk;

-- 3. One district per incident (deterministic tiebreak)
SELECT DISTINCT ON (i.incident_id) i.incident_id, d.name AS district
FROM incident i
JOIN district d ON ST_Covers(d.geom, i.geom)
ORDER BY i.incident_id, d.district_id;

-- 4. DBSCAN
SELECT incident_id, ST_ClusterDBSCAN(geom, eps := 1000, minpoints := 2) OVER () AS c1000,
                    ST_ClusterDBSCAN(geom, eps := 2000, minpoints := 2) OVER () AS c2000
FROM incident ORDER BY incident_id;
```

**Expected results**

| Query | Result |
|---|---|
| 2 | I1: rank 1 S1 500.00, rank 2 S2 2617.25 · I2: rank 1 S2 1000.00, rank 2 S1 2000.00 · I3: rank 1 S3 1720.47, rank 2 S1 2441.31 |
| 3 | I1 West · I2 West (boundary tie broken by smaller `district_id`) · I3 West |
| 4 | `c1000` = NULL, NULL, NULL; `c2000` = 0, 0, 0 |

**Why.** (1) `ST_DWithin` is expanded to an `&&` index condition plus an exact recheck; `ST_Distance(...) < d` is opaque to the planner. (2) KNN returns the *k* closest rows per outer row; ranks are recomputed from exact distances. (3) A boundary point is covered by both polygons, so an explicit tiebreak makes the assignment deterministic; `ST_Contains` would have assigned it to none. (4) With `eps = 1000` no pair of incidents is that close (closest pair ≈ 1627.88 m), so all are noise; with `eps = 2000` I1 reaches I2 (≈ 1627.88) and I3 (≈ 1972.31), linking all three although I2–I3 (≈ 2088.06) exceeds `eps`.

**How to verify.** Recompute distances with Pythagoras; compare the pair list in query 1 with §5.5.

