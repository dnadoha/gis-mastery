# Measure home-to-school distance
# Write distance(a, b) for two [x, y] points in our local metre grid. Return their straight-line distance using sqrt((bx−ax)² + (by−ay)²). This measures a straight line, not a route along roads. Assume finite coordinates; do not pass longitude/latitude to this function.
# Run: python3 distances.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def distance(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1])


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
    check(distance([260,280], [200,200]), 100)
    check(distance([200,200], [260,280]), 100)
    check(distance([0,0], [3000,4000]), 5000)
    check(distance([-1,-1], [-1,-1]), 0)
    check(distance([0,0], [1,1]), math.sqrt(2))
    print("All checks passed")
