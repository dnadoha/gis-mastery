# Find the neighbourhood’s bounding box
# A bounding box is the smallest axis-aligned rectangle containing all your points. Write bounds(points), returning [minimum x, minimum y, maximum x, maximum y]. Coordinates are local metres. Return None in Python or nil in Go for an empty input. Do not change the input points.
# Run: python3 geometry.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def bounds(points):
    if not points:
        return None
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return [min(xs), min(ys), max(xs), max(ys)]


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
    check(bounds([[200, 200], [400, 200], [260, 280]]), [200, 200, 400, 280])
    check(bounds([[5, 7]]), [5, 7, 5, 7])
    check(bounds([[-5, -2], [-1, -8], [-3, -4]]), [-5, -8, -1, -2])
    check(bounds([]), None)
    points = [[4, 8], [1, 3]]
    bounds(points)
    check(points, [[4, 8], [1, 3]])
    print("All checks passed")
