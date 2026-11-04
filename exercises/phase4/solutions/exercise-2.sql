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
