# Convert GPS height to geoid-referenced height
# GPS gives ellipsoidal height h. Geoid undulation N is the signed height of the geoid above the ellipsoid. Implement orthometric_height(h, n) using H = h − N. All values are metres. Use a supplied N; this exercise does not estimate a geoid model.
# Run: python3 earth.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def orthometric_height(h, n):
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
    check(orthometric_height(50, 20), 30)
    check(orthometric_height(50, -20), 70)
    check(orthometric_height(7.25, 0.5), 6.75)
    check(orthometric_height(10, 30), -20)
    check(orthometric_height(0, 0), 0)
    print("All checks passed")
