# Prepare density attributes for QGIS
# Prepare a table that can be exported as CSV for QGIS. Each input cell is [x,y,people] in the local metre grid. Return rows [x,y,people,people_per_km2], using one positive cell_area_m2 for all cells. A square kilometre is 1,000,000 m². Do not mutate inputs; empty input returns an empty list. These local drawing coordinates have no EPSG label: use the documented real CRS when exporting real projected data.
# Run: python3 qgis.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def density_rows(cells, cell_area_m2):
    return [[x,y,people,people * 1000000 / cell_area_m2] for x,y,people in cells]


# Comparison helper: numerical tolerance, including nested lists.
def equivalent(got, want):
    if isinstance(got, bool) or isinstance(want, bool):
        return type(got) is type(want) and got == want
    if isinstance(got, (int, float)) and isinstance(want, (int, float)):
        return math.isclose(got, want, rel_tol=1e-9, abs_tol=1e-6)
    if isinstance(got, list) and isinstance(want, list):
        return len(got) == len(want) and all(equivalent(a,b) for a,b in zip(got,want))
    return got == want

def check(got, want):
    if not equivalent(got, want):
        raise AssertionError(f"got {got!r}; expected {want!r}")

if __name__ == "__main__":
    cells = [[50,350,10],[150,350,0]]
    check(density_rows(cells,10000), [[50,350,10,1000],[150,350,0,0]])
    check(density_rows([[0,0,10]],40000), [[0,0,10,250]])
    check(density_rows([[0,0,3]],2000000), [[0,0,3,1.5]])
    check(density_rows([],10000), [])
    check(cells, [[50,350,10],[150,350,0]])
    print("All checks passed")
