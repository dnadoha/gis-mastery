### Exercise 3 — Advanced: Network analysis with pgRouting

**Task.** Extend the analysis from straight-line to **travel-cost** thinking, using the abstract graph from §4.6 (`toy_edge`). Assume this *invented* mapping between the incident data and graph vertices (costs are abstract units, not metres):

| Entity | Graph vertex |
|---|---|
| Station S1 | 1 |
| Station S2 | 6 |
| Incident I1 | 3 |
| Incident I2 | 4 |
| Incident I3 | 5 |

1. Create `toy_edge` and compute, for each incident, the travel cost from each of the two stations with `pgr_dijkstraCost`.
2. For each incident, pick the station with the lowest travel cost (the *network-nearest* station) and compare it with the Euclidean-nearest of {S1, S2} computed from the §5 coordinates. Explain any disagreement.
3. Use `pgr_drivingDistance` from S1's vertex with a budget of 8 to find which incidents lie inside S1's service area.
4. **Stretch:** make edge 9 (between vertices 5 and 6) one-way from 5 to 6 only, recompute the cost from S2's vertex to I3's vertex, and state whether the best station for I3 changes.

**Prerequisites.** Exercises 1–2; §4.6.

**Sample input.** The edge table in §4.6; the mapping above.

**Expected deliverable.** SQL script, a result table for step 1, and a short paragraph for step 2.

**Success criteria.**
* Costs match: I1 (vertex 3): S1 = 2, S2 = 11; I2 (vertex 4): S1 = 8, S2 = 5; I3 (vertex 5): S1 = 10, S2 = 3.
* You identify that I3's network-nearest station (S2) differs from its Euclidean-nearest station among {S1, S2} (S1).
* The service area of S1 (budget 8) covers vertices 1, 3, 2, 4, hence incidents I1 and I2 but not I3.
* Stretch: the S2→I3 cost becomes 8 and S2 remains the best station.

**Hint.** One-way edges are expressed with `reverse_cost = -1`.

---

