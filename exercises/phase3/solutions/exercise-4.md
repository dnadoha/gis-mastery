# Source solution — read the website clarifications before running

### Solution 4: flood-resilient clinic access

Add to `fixtures.py`:

```python
def make_roads():
    spec = [("R12", "P1", "P2", [(250, 500), (1250, 500)]),
            ("R13", "P1", "P3", [(250, 500), (250, 1500)]),
            ("R23", "P2", "P3", [(1250, 500), (250, 1500)]),
            ("R24", "P2", "P4", [(1250, 500), (2500, 500)]),
            ("R3N", "P3", "N",  [(250, 1500), (2500, 1500)]),
            ("RN4", "N",  "P4", [(2500, 1500), (2500, 500)])]
    return gpd.GeoDataFrame(
        {"edge_id": [s[0] for s in spec], "u": [s[1] for s in spec], "v": [s[2] for s in spec]},
        geometry=[line(*s[3]) for s in spec], crs=CRS)
```

`capstone.py`

```python
import difflib, re
import geopandas as gpd
import networkx as nx
from fixtures import (CRS, make_districts, make_flood, make_clinics, make_roads, pt)

districts, flood, clinics, roads = make_districts(), make_flood(), make_clinics(), make_roads()
flood_geom = flood.geometry.iloc[0]

# 2. lengths and closures (modelling choice: closed if ANY part is flooded)
roads["length"] = roads.length
roads["flooded_len"] = roads.intersection(flood_geom).length
roads["closed"] = roads["flooded_len"] > 0
print(roads[["edge_id", "length", "flooded_len", "closed"]].round(2))

# 3. graphs (keep every node, so isolated nodes exist in the open graph)
nodes = sorted(set(roads.u) | set(roads.v))

def build_graph(df):
    G = nx.Graph(); G.add_nodes_from(nodes)
    for r in df.itertuples():
        G.add_edge(r.u, r.v, weight=r.length, edge_id=r.edge_id)
    return G

G_all, G_open = build_graph(roads), build_graph(roads[~roads["closed"]])

# 4. before / after route
def route(G, a, b):
    try:
        path = nx.shortest_path(G, a, b, weight="weight")
        return path, nx.path_weight(G, path, "weight")
    except nx.NetworkXNoPath:
        return None, float("inf")

p0, d0 = route(G_all, "P1", "P4")
p1, d1 = route(G_open, "P1", "P4")
print(p0, d0, p1, d1, round(d1 / d0, 3))       # ['P1','P2','P4'] 2250 ['P1','P3','N','P4'] 4250 1.889

# 5. service areas within 1500 m of P1
sa0 = nx.single_source_dijkstra_path_length(G_all, "P1", cutoff=1500, weight="weight")
sa1 = nx.single_source_dijkstra_path_length(G_open, "P1", cutoff=1500, weight="weight")
print(sa0, sa1)                                # {P1:0,P2:1000,P3:1000}  {P1:0,P3:1000}

# 6. isolated clinics and the population of their host district
isolated = [n for n in nodes if n.startswith("P") and G_open.degree(n) == 0]
hosts = gpd.sjoin(clinics[clinics.clinic.isin(isolated)],
                  districts[["name", "pop", "geometry"]], how="left", predicate="within")
print(isolated, hosts[["clinic", "name", "pop"]].values.tolist())    # ['P2'] [['P2','B',6000]]

# 7a. offline forward geocoder: normalise, require identical numeric tokens, then fuzzy match
norm = lambda s: " ".join(s.lower().split())
digits = lambda s: re.findall(r"\d+", s)
GAZ = {norm(r.label): r.geometry for r in clinics.itertuples()}

def geocode(query, cutoff=0.6):
    q = norm(query)
    cands = [k for k in GAZ if digits(k) == digits(q)]            # "clinic 9" cannot become "clinic 4"
    best = difflib.get_close_matches(q, cands, n=1, cutoff=cutoff)
    if not best:
        return None
    g = GAZ[best[0]]
    return {"match": best[0], "score": round(difflib.SequenceMatcher(None, q, best[0]).ratio(), 3),
            "x": g.x, "y": g.y}

for q in ["clinik 2", "CLINIC   3", "hospital", "clinic 9"]:
    print(q, "->", geocode(q))

# 7b. offline reverse geocoder
def reverse_geocode(xy_list):
    pts = gpd.GeoDataFrame({"qid": range(len(xy_list))},
                           geometry=[pt(x, y) for x, y in xy_list], crs=CRS)
    inside = gpd.sjoin(pts, districts[["name", "geometry"]], how="left",
                       predicate="within")[["qid", "name"]].rename(columns={"name": "district"})
    near = gpd.sjoin_nearest(pts, clinics[["clinic", "geometry"]], how="left",
                             distance_col="dist_m")[["qid", "clinic", "dist_m"]]
    return pts.merge(inside, on="qid").merge(near, on="qid")

rg = reverse_geocode([(1400, 600), (2500, 900)])
print(rg[["qid", "district", "clinic", "dist_m"]].round(2))
# qid 0: B,  P2, 180.28     qid 1: NaN, P4, 400.00

# 8. outputs
roads.to_file("capstone_results.gpkg", layer="roads", driver="GPKG")
rg.to_file("capstone_results.gpkg", layer="reverse_geocoded", driver="GPKG")

rows = [("P1→P4 route length (m)", f"{d0:.0f}", f"{d1:.0f}"),
        ("P1→P4 path", "-".join(p0), "-".join(p1)),
        ("Clinics within 1,500 m of P1", ", ".join(sorted(sa0)), ", ".join(sorted(sa1))),
        ("Isolated clinics", "none", ", ".join(isolated))]
md = "| Metric | Before closures | After closures |\n|---|---|---|\n" + \
     "\n".join(f"| {a} | {b} | {c} |" for a, b, c in rows)
open("capstone_report.md", "w").write(md + "\n")
```

**Expected output highlights** (the `.round(2)` road table):

| edge_id | length | flooded_len | closed |
|---|---|---|---|
| R12 | 1000.00 | 750.00 | True |
| R13 | 1000.00 | 0.00 | False |
| R23 | 1414.21 | 707.11 | True |
| R24 | 1250.00 | 250.00 | True |
| R3N | 2250.00 | 0.00 | False |
| RN4 | 1000.00 | 0.00 | False |

Geocoder results: `"clinik 2"` → `clinic 2`, score 0.875; `"CLINIC   3"` → `clinic 3`, score 1.0; `"hospital"` → `None`; `"clinic 9"` → `None`.

**Summary table in `capstone_report.md`:**

| Metric | Before closures | After closures |
|---|---|---|
| P1→P4 route length (m) | 2250 | 4250 |
| P1→P4 path | P1-P2-P4 | P1-P3-N-P4 |
| Clinics within 1,500 m of P1 | P1, P2, P3 | P1, P3 |
| Isolated clinics | none | P2 |

**Reasoning and verification.**

* **Flooded lengths.** R12 runs along y = 500 from x = 250 to 1250; the flood zone starts at x = 500, so 1250 − 500 = 750 m are inside. R23 enters the flood box where it crosses y = 1000 at x = 750 and runs to (1250, 500): √(500² + 500²) = 707.11 m. R24 is inside from x = 1250 to 1500 = 250 m. R13 (x = 250), R3N (y = 1500) and RN4 (x = 2500) never touch the box.
* **Shortest paths.** Before: P1→P2→P4 = 1000 + 1250 = 2250 (alternatives: P1→P3→P2→P4 = 1000 + 1414.21 + 1250 = 3664.21; P1→P3→N→P4 = 4250; P1→P2→P3→N→P4 = 5664.21). After closing R12, R23, R24 only the northern route remains: 1000 + 2250 + 1000 = 4250. Detour factor 4250/2250 = 1.889.
* **Service area.** Before: P2 at 1000 and P3 at 1000 are within 1500; P4 is 2250 away. After: only P3. P2 has degree 0 in the open graph, so it is isolated; its host district B holds 6,000 residents.
* **Reverse geocoding.** (1400, 600) is inside B; nearest clinic P2 at √(150² + 100²) = 180.28 m. (2500, 900) is east of every district (x > 2000) so `district` is null; the nearest clinic is P4 at 400 m.
* **Geocoder lesson.** Pure fuzzy matching of `"clinic 9"` returns Clinic 4 at 0.875 similarity because strings differ by one character. For identifiers and addresses, *numbers are not fuzzy*: require house numbers/IDs to match exactly and use fuzziness only on the text.
* **Limitations to list in the report.** "Closed if any part is flooded" is conservative; an alternative is a threshold on the flooded fraction or a depth-based speed penalty instead of a hard closure. Euclidean (planar UTM) lengths are used as costs; real networks need travel time and one-way attributes. Population is allocated by area, not by address.

**Stretch: pgRouting translation (`capstone.sql`).** Edge ids 1–6 = R12, R13, R23, R24, R3N, RN4; vertex ids P1 = 1, P2 = 2, P3 = 3, P4 = 4, N = 5.

```sql
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
```

**Extensions to try next.** Replace length with travel time and add turn restrictions; replace the synthetic roads with an OpenStreetMap extract served by OSRM or Valhalla and compare network distance against Euclidean distance; compute isochrones instead of a fixed distance cutoff; scale the pipeline with the techniques of §4.8.

---

