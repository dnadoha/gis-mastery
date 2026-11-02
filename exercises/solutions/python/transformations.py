# Transform a local drawing’s coordinates
# Implement a two-dimensional similarity transform: rotate a point anticlockwise by angle_deg, multiply both axes by scale, then add dx and dy. Return the new [x, y]. Use x′ = scale × (x cos θ − y sin θ) + dx and y′ = scale × (x sin θ + y cos θ) + dy. This is a local drawing exercise, not a geodetic datum transformation. Inputs are finite.
# Run: python3 transformations.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def transform_point(point, angle_deg, scale, dx, dy):
    x, y = point
    theta = math.radians(angle_deg)
    c, s = math.cos(theta), math.sin(theta)
    return [scale * (x*c - y*s) + dx, scale * (x*s + y*c) + dy]


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
    check(transform_point([200,200], 0, 1, 0, 0), [200,200])
    check(transform_point([1,0], 90, 1, 0, 0), [0,1])
    check(transform_point([1,2], 90, 2, 100, 200), [96,202])
    check(transform_point([0,1], -90, 1, 0, 0), [1,0])
    p = [1,2]
    transform_point(p, 45, 3, 10, 20)
    check(p, [1,2])
    print("All checks passed")
