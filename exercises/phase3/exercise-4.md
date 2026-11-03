### Exercise 4 (Applied challenge): flood-resilient clinic access

**Scenario.** Roads connect the clinics. When a road touches the flood zone it is **closed**. Quantify how flooding changes access and report which clinics are cut off and how many residents live in the affected district.

**Task.** Extend `fixtures.py` with `make_roads()` and write `capstone.py` that:

1. builds the road layer (nodes: P1, P2, P3, P4 and an extra junction N at local (2500, 1500)):

| edge_id | u | v | local coordinates (m) |
|---|---|---|---|
| R12 | P1 | P2 | (250,500) → (1250,500) |
| R13 | P1 | P3 | (250,500) → (250,1500) |
| R23 | P2 | P3 | (1250,500) → (250,1500) |
| R24 | P2 | P4 | (1250,500) → (2500,500) |
| R3N | P3 | N | (250,1500) → (2500,1500) |
| RN4 | N | P4 | (2500,1500) → (2500,500) |

2. computes each road's length and **flooded length** (length of its intersection with the flood zone); marks a road *closed* if flooded length > 0 (state this modelling choice in your report and one alternative);
3. builds an undirected NetworkX graph with all roads and one with open roads only (keep all nodes in both graphs);
4. compares the shortest P1 → P4 path before and after closures: path, length, **detour factor**;
5. computes the service area within 1,500 m of P1 before and after closures;
6. identifies clinics with no open road and the population of the district that hosts each (from Exercise 2);
7. implements an **offline geocoder** over the clinic labels (normalise, fuzzy match with a cutoff, return a score) and an **offline reverse geocoder** (containing district and nearest clinic with distance) for the local points (1400, 600) and (2500, 900);
8. writes `capstone_results.gpkg` with layers `roads` (including `length`, `flooded_len`, `closed`) and `reverse_geocoded`, and produces a short Markdown summary table;
9. (stretch) translates steps 2, 4 and 5 into **pgRouting SQL** on PostGIS tables, giving the expected output.

**Prerequisites.** Exercises 1–3; §4.6, §4.7.

**Sample input.** Fixtures from Exercise 1; roads above; geocoder queries `"clinik 2"`, `"CLINIC   3"`, `"hospital"`, `"clinic 9"`.

**Expected deliverable.** `capstone.py`, `capstone_results.gpkg`, `capstone_report.md` (summary table plus half a page on assumptions and limitations), and optionally `capstone.sql`.

**Success criteria.**

* Flooded lengths: R12 = 750 m, R23 ≈ 707.11 m, R24 = 250 m; R13, R3N, RN4 = 0. Closed: R12, R23, R24.
* Before closures: P1 → P4 = P1–P2–P4, **2,250 m**. After: P1–P3–N–P4, **4,250 m**; detour factor **1.889** (+2,000 m, +88.9%).
* Service area ≤ 1,500 m from P1: before {P1: 0, P2: 1000, P3: 1000}; after {P1: 0, P3: 1000}.
* Isolated clinic: P2 (all incident roads closed); its district B holds 6,000 residents.
* Reverse geocoding: (1400, 600) → district B, nearest clinic P2 at 180.28 m; (2500, 900) → no district, nearest clinic P4 at 400.00 m.
* Geocoding: `"clinik 2"` → Clinic 2 (score 0.875); `"CLINIC   3"` → Clinic 3 (score 1.0); `"hospital"` → no match; `"clinic 9"` must **not** silently resolve to a clinic (plain fuzzy matching returns Clinic 4 with score 0.875, so your code needs an extra rule, for example requiring numeric tokens to match exactly).
* If implemented, the pgRouting query on open edges returns vertices 1 → 3 → 5 → 4 with final `agg_cost` 4250, and on all edges 1 → 2 → 4 with 2250.

**Hint.** Use `roads.intersection(flood_geom).length` for flooded length. Build graphs with `nx.Graph().add_edge(u, v, weight=length)` and call `G.add_nodes_from(...)` so that an isolated node is present. For the stretch goal, use vertex ids P1=1, P2=2, P3=3, P4=4, N=5.

---
