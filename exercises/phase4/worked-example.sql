CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE fire_station (
    station_id integer PRIMARY KEY,
    name       text NOT NULL,
    geom       geometry(Point, 28992) NOT NULL
);
CREATE TABLE incident (
    incident_id integer PRIMARY KEY,
    geom        geometry(Point, 28992) NOT NULL
);
CREATE TABLE district (
    district_id integer PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    geom        geometry(Polygon, 28992) NOT NULL,
    CONSTRAINT district_valid CHECK (ST_IsValid(geom))
);

INSERT INTO fire_station VALUES
 (1,'S1',ST_SetSRID(ST_MakePoint(120000,487000),28992)),
 (2,'S2',ST_SetSRID(ST_MakePoint(123000,487000),28992)),
 (3,'S3',ST_SetSRID(ST_MakePoint(120000,490000),28992));

INSERT INTO incident VALUES
 (1,ST_SetSRID(ST_MakePoint(120400,487300),28992)),
 (2,ST_SetSRID(ST_MakePoint(122000,487000),28992)),
 (3,ST_SetSRID(ST_MakePoint(121400,489000),28992));

INSERT INTO district VALUES
 (1,'West',ST_MakeEnvelope(119000,486000,122000,491000,28992)),
 (2,'East',ST_MakeEnvelope(122000,486000,125000,491000,28992));

CREATE INDEX fire_station_geom_gix ON fire_station USING gist (geom);
CREATE INDEX incident_geom_gix     ON incident     USING gist (geom);
CREATE INDEX district_geom_gix     ON district     USING gist (geom);
ANALYZE;

SELECT f_table_name, f_geometry_column, srid, type
FROM geometry_columns
WHERE f_table_name IN ('fire_station','incident','district')
ORDER BY f_table_name;
-- district|geom|28992|POLYGON ; fire_station|geom|28992|POINT ; incident|geom|28992|POINT

SELECT name, ST_Area(geom) FROM district ORDER BY name;
-- East|15000000 ; West|15000000

SELECT i.incident_id, s.name,
       round(ST_Distance(i.geom, s.geom)::numeric, 2) AS dist_m
FROM incident i
CROSS JOIN LATERAL (
    SELECT name, geom FROM fire_station ORDER BY geom <-> i.geom LIMIT 1
) s
ORDER BY i.incident_id;

SELECT s.name, count(i.incident_id) AS incidents_within_2km
FROM fire_station s
LEFT JOIN incident i ON ST_DWithin(s.geom, i.geom, 2000)
GROUP BY s.name
ORDER BY s.name;

-- Any contact counts
SELECT d.name, count(i.incident_id) AS n_intersects
FROM district d LEFT JOIN incident i ON ST_Intersects(d.geom, i.geom)
GROUP BY d.name ORDER BY d.name;
-- East|1 ; West|3        (I2 lies on the shared boundary, so it intersects BOTH)

-- Strictly interior only
SELECT d.name, count(i.incident_id) AS n_contains
FROM district d LEFT JOIN incident i ON ST_Contains(d.geom, i.geom)
GROUP BY d.name ORDER BY d.name;
-- East|0 ; West|2        (I2 is in neither interior)

SELECT d.name, ST_Relate(d.geom, i.geom)
FROM district d, incident i WHERE i.incident_id = 2 ORDER BY d.name;
-- East|FF20F1FF2 ; West|FF20F1FF2

SELECT incident_id,
       ST_ClusterDBSCAN(geom, eps := 2000, minpoints := 2) OVER () AS cluster_id
FROM incident ORDER BY incident_id;

SET enable_seqscan = off;      -- learning only: tables are tiny
EXPLAIN SELECT * FROM incident WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(120000,487000),28992), 2000);
RESET enable_seqscan;
