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
