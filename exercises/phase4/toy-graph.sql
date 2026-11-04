CREATE EXTENSION IF NOT EXISTS pgrouting CASCADE;     -- pulls in postgis if absent

CREATE TABLE toy_edge (
    id int PRIMARY KEY, source int, target int,
    cost float8, reverse_cost float8
);
INSERT INTO toy_edge VALUES
 (1,1,2,4,4),(2,1,3,2,2),(3,2,3,1,1),(4,2,4,5,5),(5,3,4,8,8),
 (6,3,5,10,10),(7,4,5,2,2),(8,4,6,6,6),(9,5,6,3,3);

-- Shortest path from vertex 1 to vertex 6
SELECT * FROM pgr_dijkstra(
  'SELECT id, source, target, cost, reverse_cost FROM toy_edge', 1, 6, true);

SELECT start_vid, end_vid, agg_cost
FROM pgr_dijkstraCost(
  'SELECT id, source, target, cost, reverse_cost FROM toy_edge',
  ARRAY[1,6], ARRAY[3,4,5], true)
ORDER BY start_vid, end_vid;
-- (1,3,2) (1,4,8) (1,5,10) (6,3,11) (6,4,5) (6,5,3)

SELECT node, agg_cost
FROM pgr_drivingDistance(
  'SELECT id, source, target, cost, reverse_cost FROM toy_edge', 1, 8, true)
ORDER BY agg_cost, node;
-- nodes 1 (0), 3 (2), 2 (3), 4 (8)    -- node 5 costs 10, outside the budget of 8
