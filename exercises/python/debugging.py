# Audit coordinates before they reach the map
# Write invalid_points(points, aoi) to return the zero-based indices of suspect [lon,lat] points, in input order. Flag non-finite coordinates, longitude outside ±180°, latitude outside ±90°, or coordinates outside the inclusive AOI [west,south,east,north]. Assume pairs have exactly two numbers and the AOI is valid and does not cross the antimeridian. Report problems without silently swapping or repairing data.
# Run: python3 debugging.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def invalid_points(points, aoi):
    # TODO: implement the contract above.
    raise NotImplementedError("Implement this function")


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
    aoi = [3,50,8,54]
    points = [[4.9003,52.3791],[52.3791,4.9003],[181,52],[4,float("nan")],[3,50],[8,54]]
    check(invalid_points(points,aoi), [1,2,3])
    check(invalid_points([[float("inf"),52],[4,-91]],aoi), [0,1])
    check(invalid_points([],aoi), [])
    check(invalid_points([[4,52]],aoi), [])
    check(points[1], [52.3791,4.9003])
    print("All checks passed")
