# Distinguish a park’s interior, edge and exterior
# Write box_relation(point, box) for an axis-aligned rectangle [minX,minY,maxX,maxY]. Return "inside", "boundary" or "outside". Corners are on the boundary. Assume a positive-width, positive-height box and finite values. Use exact comparisons for these exact teaching coordinates; this does not implement arbitrary polygon predicates.
# Run: python3 topology.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def box_relation(point, box):
    x, y = point
    left, bottom, right, top = box
    if x < left or x > right or y < bottom or y > top:
        return "outside"
    if x in (left, right) or y in (bottom, top):
        return "boundary"
    return "inside"


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
    box = [0,0,4,3]
    check(box_relation([2,1],box), "inside")
    for p in [[0,1],[4,1],[2,0],[2,3],[0,0],[4,3]]:
        check(box_relation(p,box), "boundary")
    check(box_relation([0,4],box), "outside")
    check(box_relation([-0.01,1],box), "outside")
    print("All checks passed")
