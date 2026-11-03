"""fixtures.py: synthetic study area in EPSG:32631 (local metres + origin)."""
import geopandas as gpd
from shapely.geometry import LineString, Point, box

CRS = "EPSG:32631"
X0, Y0 = 500_000, 5_700_000


def rect(xmin, ymin, xmax, ymax):
    return box(X0 + xmin, Y0 + ymin, X0 + xmax, Y0 + ymax)


def pt(x, y):
    return Point(X0 + x, Y0 + y)


def line(*coords):
    return LineString([(X0 + x, Y0 + y) for x, y in coords])


def make_districts():
    return gpd.GeoDataFrame(
        {"name": ["A", "B", "C"], "pop": [4000, 6000, 2000], "region": ["R1", "R1", "R2"]},
        geometry=[rect(0, 0, 1000, 1000), rect(1000, 0, 2000, 1000), rect(0, 1000, 1000, 2000)],
        crs=CRS,
    )


def make_flood():
    return gpd.GeoDataFrame({"zone": ["F1"]}, geometry=[rect(500, 0, 1500, 1000)], crs=CRS)


def make_clinics(extra_boundary=False):
    rows = [("P1", "Clinic 1", 250, 500), ("P2", "Clinic 2", 1250, 500),
            ("P3", "Clinic 3", 250, 1500), ("P4", "Clinic 4", 2500, 500)]
    if extra_boundary:
        rows.append(("P5", "Clinic 5", 1000, 500))          # exactly on the A/B shared edge
    return gpd.GeoDataFrame(
        {"clinic": [r[0] for r in rows], "label": [r[1] for r in rows]},
        geometry=[pt(r[2], r[3]) for r in rows], crs=CRS)

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
