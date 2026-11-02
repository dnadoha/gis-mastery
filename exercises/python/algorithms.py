# Implement signed polygon area
# Implement signed_area(ring) with the shoelace formula: half the sum of xᵢyᵢ₊₁ − xᵢ₊₁yᵢ, including the last-to-first edge. Return zero for fewer than three points. A repeated closing point is allowed. Counterclockwise rings have positive area. Coordinates are local metres. This calculates algebraic area; it does not validate self-crossing rings.
# Run: python3 algorithms.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def signed_area(ring):
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
    ring = [[0,0],[4,0],[4,3],[0,3]]
    check(signed_area(ring), 12)
    check(signed_area(ring[::-1]), -12)
    check(signed_area(ring+[ring[0]]), 12)
    check(signed_area([[x+1e9,y+1e9] for x,y in ring]), 12)
    check(signed_area([]), 0)
    check(signed_area([[0,0],[1,1]]), 0)
    check(signed_area([[0,0],[2,2],[2,0],[0,2]]), 0)
    print("All checks passed")
