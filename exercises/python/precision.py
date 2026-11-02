# Compare positions using a distance tolerance
# Implement within_tolerance(a, b, tolerance) for local metre coordinates. Return true when the Euclidean separation is at most tolerance. Return false for a negative tolerance. Assume finite inputs. The tolerance is a rule for comparison, not a claim about the survey’s accuracy.
# Run: python3 precision.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def within_tolerance(a, b, tolerance):
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
    check(within_tolerance([0,0], [0.6,0.8], 1), True)
    check(within_tolerance([0,0], [0.8,0.8], 1), False)
    check(within_tolerance([0,0], [1.001,0], 1), False)
    check(within_tolerance([200,200], [200,200], 0), True)
    check(within_tolerance([0,0], [0,0], -1), False)
    print("All checks passed")
