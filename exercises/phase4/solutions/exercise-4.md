# Source solution — read the website clarifications before running

### 8.4 Solution to Exercise 4

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE station_version (
    version_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    station_id   integer NOT NULL,
    name         text NOT NULL,
    geom         geometry(Point, 28992) NOT NULL,
    valid_during tstzrange NOT NULL,
    CONSTRAINT sv_valid   CHECK (ST_IsValid(geom)),
    CONSTRAINT sv_nonempty CHECK (NOT ST_IsEmpty(geom)),
    CONSTRAINT sv_extent  CHECK (geom && ST_MakeEnvelope(0, 289000, 300000, 629000, 28992)),
    CONSTRAINT sv_nonempty_range CHECK (NOT isempty(valid_during)),
    CONSTRAINT no_overlapping_versions
        EXCLUDE USING gist (station_id WITH =, valid_during WITH &&)
);
CREATE INDEX station_version_geom_gix ON station_version USING gist (geom);
CREATE INDEX station_version_valid_gix ON station_version USING gist (valid_during);

INSERT INTO station_version (station_id, name, geom, valid_during) VALUES
 (1,'S1',ST_SetSRID(ST_MakePoint(120000,487000),28992), tstzrange('2020-01-01 00:00+00', NULL, '[)')),
 (3,'S3',ST_SetSRID(ST_MakePoint(120000,490000),28992), tstzrange('2020-01-01 00:00+00', NULL, '[)')),
 (2,'S2',ST_SetSRID(ST_MakePoint(123000,487000),28992), tstzrange('2020-01-01 00:00+00','2026-01-01 00:00+00','[)')),
 (2,'S2',ST_SetSRID(ST_MakePoint(125000,487000),28992), tstzrange('2026-01-01 00:00+00', NULL, '[)'));

CREATE OR REPLACE FUNCTION relocate_station(p_station_id int, p_new_geom geometry, p_effective timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    cur station_version%ROWTYPE;
BEGIN
    SELECT * INTO cur FROM station_version
    WHERE station_id = p_station_id AND upper_inf(valid_during)
    FOR UPDATE;                                           -- serialise concurrent relocations

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No open version for station %', p_station_id;
    END IF;
    IF p_effective <= lower(cur.valid_during) THEN
        RAISE EXCEPTION 'Effective date % must be after current version start %',
                        p_effective, lower(cur.valid_during);
    END IF;

    UPDATE station_version
       SET valid_during = tstzrange(lower(valid_during), p_effective, '[)')
     WHERE version_id = cur.version_id;

    INSERT INTO station_version (station_id, name, geom, valid_during)
    VALUES (p_station_id, cur.name, p_new_geom, tstzrange(p_effective, NULL, '[)'));
END $$;

CREATE OR REPLACE FUNCTION nearest_station_asof(p_point geometry, p_asof timestamptz)
RETURNS TABLE (station_id int, name text, dist_m double precision)
LANGUAGE sql STABLE AS $$
    SELECT sv.station_id, sv.name, ST_Distance(sv.geom, p_point)
    FROM station_version sv
    WHERE sv.valid_during @> p_asof
    ORDER BY sv.geom <-> p_point
    LIMIT 1;
$$;

-- As-of queries
SELECT i.incident_id, n.name, round(n.dist_m::numeric, 2) AS dist_m
FROM incident i, LATERAL nearest_station_asof(i.geom, timestamptz '2025-06-01 00:00+00') n
ORDER BY i.incident_id;
SELECT i.incident_id, n.name, round(n.dist_m::numeric, 2) AS dist_m
FROM incident i, LATERAL nearest_station_asof(i.geom, timestamptz '2026-06-01 00:00+00') n
ORDER BY i.incident_id;

-- Negative tests (each must FAIL)
INSERT INTO station_version (station_id,name,geom,valid_during)         -- overlaps S2's current version
VALUES (2,'S2',ST_SetSRID(ST_MakePoint(124000,487000),28992), tstzrange('2025-12-01 00:00+00','2026-03-01 00:00+00','[)'));
INSERT INTO station_version (station_id,name,geom,valid_during)         -- wrong SRID
VALUES (4,'X',ST_SetSRID(ST_MakePoint(4.9,52.37),4326), tstzrange('2020-01-01 00:00+00', NULL, '[)'));
INSERT INTO station_version (station_id,name,geom,valid_during)         -- outside the extent
VALUES (5,'Y',ST_SetSRID(ST_MakePoint(900000,487000),28992), tstzrange('2020-01-01 00:00+00', NULL, '[)'));
```

**Expected results**

| As-of | I1 | I2 | I3 |
|---|---|---|---|
| 2025-06-01 | S1, 500.00 | S2, 1000.00 | S3, 1720.47 |
| 2026-06-01 | S1, 500.00 | **S1, 2000.00** | S3, 1720.47 |

Negative tests: the first raises `conflicting key value violates exclusion constraint "no_overlapping_versions"` (SQLSTATE `23P01`); the second raises `Geometry SRID (4326) does not match column SRID (28992)`; the third violates `sv_extent` (check-constraint violation, `23514`). Calling `relocate_station(2, <new point>, '2026-01-01 00:00+00')` against this data is rejected by the function, because the effective date is not after the start of the station's open version (which already begins on 2026-01-01).

**Why.** Half-open ranges let one version end exactly where the next begins without overlapping, and the exclusion constraint makes that invariant a database guarantee rather than an application convention. After S2 moves 2 km farther east, I2's distance to S2 grows to 3000 m, so S1 (2000 m) becomes nearest — this is exactly the history-dependent answer an overwritten-in-place `UPDATE` would have destroyed. The extent check uses the `&&` operator so the constraint is cheap and also catches coordinates accidentally entered in the wrong CRS.

**Performance note (step 6).** In `nearest_station_asof`, the `valid_during @> p_asof` filter is applied *after* the GiST KNN ordering returns candidates. If most rows are historical versions, the index scan may walk many non-current rows before finding one valid at the requested date, degrading the query as history accumulates. Mitigations: a **partial index** on current rows (`WHERE upper_inf(valid_during)`) for the very common "now" query; a combined GiST index on `(geom, valid_during)` using `btree_gist`/range operator support; or moving closed versions to an **archive partition** so the hot table stays small. Always confirm with `EXPLAIN (ANALYZE, BUFFERS)` on realistic data volumes.

**How to verify.** Count open versions per station (`SELECT station_id, count(*) FROM station_version WHERE upper_inf(valid_during) GROUP BY 1` → exactly one each); check there are no overlaps with a self-join on `valid_during && valid_during` (should return zero rows); recompute the two as-of tables by hand with Pythagoras (§5.4).

---
