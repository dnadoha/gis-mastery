# Source solution — read the website clarifications before running

### 8.1 Solution to Exercise 1

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE fire_station (station_id integer PRIMARY KEY, name text NOT NULL,
                           geom geometry(Point,28992) NOT NULL);
CREATE TABLE incident     (incident_id integer PRIMARY KEY,
                           geom geometry(Point,28992) NOT NULL);
CREATE TABLE district     (district_id integer PRIMARY KEY, name text NOT NULL UNIQUE,
                           geom geometry(Polygon,28992) NOT NULL,
                           CONSTRAINT district_valid CHECK (ST_IsValid(geom)));

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

-- 2. Metadata
SELECT f_table_name, srid, type FROM geometry_columns
WHERE f_table_name IN ('fire_station','incident','district') ORDER BY 1;

-- 3. Typmod protection (expected: ERROR  Geometry SRID (4326) does not match column SRID (28992))
INSERT INTO incident VALUES (99, ST_SetSRID(ST_MakePoint(4.9, 52.37), 4326));

-- 4. Units
SELECT ST_Distance('SRID=4326;POINT(0 0)'::geometry,  'SRID=4326;POINT(1 0)'::geometry)  AS deg,
       ST_Distance('SRID=4326;POINT(0 0)'::geography, 'SRID=4326;POINT(1 0)'::geography) AS metres;

-- 5. DE-9IM
SELECT d.name, ST_Relate(d.geom, i.geom)
FROM district d, incident i WHERE i.incident_id = 2 ORDER BY d.name;
```

**Expected output.** Step 2: `district POLYGON 28992`, `fire_station POINT 28992`, `incident POINT 28992`. Step 4: `deg = 1`, `metres ≈ 111319.49`. Step 5: `East | FF20F1FF2`, `West | FF20F1FF2`.

**Why.** The typmod makes the column reject a different SRID instead of silently storing inconsistent data. The `geometry` distance is the planar distance in the CRS unit (degrees for EPSG:4326), whereas `geography` computes on the spheroid and returns metres (`6378137 × π/180 ≈ 111319.49` along the equator). `FF20F1FF2` has `F` in the interior/interior cell, confirming the point is on the boundary and in neither interior.

**How to verify.** Row counts (`3, 3, 2`), `ST_AsText` on each table, and checking in QGIS that points fall where the schematic (§5.1) shows them.

