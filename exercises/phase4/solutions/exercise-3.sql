CREATE EXTENSION IF NOT EXISTS pgrouting CASCADE;
CREATE TABLE toy_edge (id int PRIMARY KEY, source int, target int, cost float8, reverse_cost float8);
INSERT INTO toy_edge VALUES
 (1,1,2,4,4),(2,1,3,2,2),(3,2,3,1,1),(4,2,4,5,5),(5,3,4,8,8),
 (6,3,5,10,10),(7,4,5,2,2),(8,4,6,6,6),(9,5,6,3,3);

-- 1. Costs from stations (vertices 1 and 6) to incident vertices (3, 4, 5)
SELECT start_vid, end_vid, agg_cost
FROM pgr_dijkstraCost('SELECT id, source, target, cost, reverse_cost FROM toy_edge',
                      ARRAY[1,6], ARRAY[3,4,5], true)
ORDER BY end_vid, start_vid;

-- 3. Service area of S1 with budget 8
SELECT node, agg_cost
FROM pgr_drivingDistance('SELECT id, source, target, cost, reverse_cost FROM toy_edge', 1, 8, true)
ORDER BY agg_cost, node;

-- 4. Stretch: edge 9 one-way 5 -> 6
SELECT end_vid, agg_cost
FROM pgr_dijkstraCost(
  'SELECT id, source, target, cost,
          CASE WHEN id = 9 THEN -1 ELSE reverse_cost END AS reverse_cost
   FROM toy_edge', 6, 5, true);
