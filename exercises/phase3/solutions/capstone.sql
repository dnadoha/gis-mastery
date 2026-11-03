CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

CREATE TABLE vertices (id int PRIMARY KEY, label text, geom geometry(Point, 32631));
INSERT INTO vertices VALUES
  (1,'P1',ST_SetSRID(ST_MakePoint(500250,5700500),32631)),
  (2,'P2',ST_SetSRID(ST_MakePoint(501250,5700500),32631)),
  (3,'P3',ST_SetSRID(ST_MakePoint(500250,5701500),32631)),
  (4,'P4',ST_SetSRID(ST_MakePoint(502500,5700500),32631)),
  (5,'N', ST_SetSRID(ST_MakePoint(502500,5701500),32631));

CREATE TABLE edges (id int PRIMARY KEY, source int REFERENCES vertices(id),
                    target int REFERENCES vertices(id), cost double precision,
                    reverse_cost double precision, geom geometry(LineString, 32631), flooded boolean);
INSERT INTO edges (id, source, target, geom)
SELECT e.id, e.s, e.t, ST_MakeLine(vs.geom, vt.geom)
FROM (VALUES (1,1,2),(2,1,3),(3,2,3),(4,2,4),(5,3,5),(6,5,4)) AS e(id, s, t)
JOIN vertices vs ON vs.id = e.s JOIN vertices vt ON vt.id = e.t;

UPDATE edges SET cost = ST_Length(geom), reverse_cost = ST_Length(geom);       -- two-way roads
UPDATE edges SET flooded =
  ST_Length(ST_Intersection(geom, ST_MakeEnvelope(500500,5700000,501500,5701000,32631))) > 0;
-- expected: flooded = true for edges 1, 3, 4

-- After closures: expect nodes 1, 3, 5, 4 with final agg_cost = 4250
SELECT seq, node, edge, cost, agg_cost FROM pgr_dijkstra(
  'SELECT id, source, target, cost, reverse_cost FROM edges WHERE NOT flooded', 1, 4, directed := false);

-- Before closures: expect nodes 1, 2, 4 with final agg_cost = 2250
SELECT seq, node, edge, cost, agg_cost FROM pgr_dijkstra(
  'SELECT id, source, target, cost, reverse_cost FROM edges', 1, 4, directed := false);

-- Service area after closures: expect vertices 1 (0) and 3 (1000)
SELECT node, agg_cost FROM pgr_drivingDistance(
  'SELECT id, source, target, cost, reverse_cost FROM edges WHERE NOT flooded', 1, 1500, directed := false);
