# Source solution — read the website clarifications before running

### 8.3 Solution to Exercise 3

```sql
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
```

**Expected results**

| Incident (vertex) | Cost from S1 (vertex 1) | Cost from S2 (vertex 6) | Network-nearest |
|---|---|---|---|
| I1 (3) | 2 | 11 | S1 |
| I2 (4) | 8 | 5 | S2 |
| I3 (5) | 10 | 3 | S2 |

Service area (budget 8): vertices `1 (0), 3 (2), 2 (3), 4 (8)` → incidents I1 (vertex 3) and I2 (vertex 4) are covered; I3 (vertex 5, cost 10) is not. Stretch: S2→I3 becomes `6→4→5 = 6 + 2 = 8`, so S2 (8) still beats S1 (10).

**Why.** From the §5 coordinates, I3 is Euclidean-closer to S1 (≈ 2441.31) than S2 (≈ 2561.25), but in the invented network S2 reaches I3 through a cheap link (cost 3). Straight-line proximity ignores connectivity, one-way restrictions, and travel cost — the reason network analysis exists. (The mapping is an exercise device; real workflows snap actual coordinates to a noded road network and use lengths or travel times.)

**How to verify.** Hand-run Dijkstra: from vertex 1, settle 1 (0), 3 (2), 2 (3, via 3 rather than the direct edge of 4), 4 (8), 5 (10), 6 (13). From vertex 6: 5 (3), 4 (5, via 5), 2 (10), 3 (11).

