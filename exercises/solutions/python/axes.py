# Resolve swapped coordinate fields
# An area of interest (AOI) is the region where a point is expected. Given first, second and an AOI [west, south, east, north], test both possible longitude/latitude orders. Return [longitude, latitude] only when exactly one interpretation lies inside the inclusive AOI. Return None/nil when both or neither fit. Inputs are finite numbers and the AOI does not cross the antimeridian.
# Run: python3 axes.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def resolve_axes(first, second, aoi):
    west, south, east, north = aoi
    candidates = [[first, second], [second, first]]
    valid = [p for p in candidates if west <= p[0] <= east and south <= p[1] <= north]
    return valid[0] if len(valid) == 1 else None


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
    aoi = [3, 50, 8, 54]
    check(resolve_axes(4.9003, 52.3791, aoi), [4.9003, 52.3791])
    check(resolve_axes(52.3791, 4.9003, aoi), [4.9003, 52.3791])
    check(resolve_axes(10, 20, [0, 0, 60, 60]), None)
    check(resolve_axes(100, 100, aoi), None)
    check(resolve_axes(5, 5, [0, 0, 10, 10]), None)
    check(resolve_axes(3, 50, aoi), [3, 50])
    print("All checks passed")
