# Give class boundaries one consistent meaning
# Write class_index(value, edges) to return a zero-based colour-class index. For edges [0,10,20], class 0 is [0,10] and class 1 is (10,20]. Thus each internal boundary belongs to the lower class. Return −1 for values outside the range or non-finite values. Edges are finite and strictly increasing with at least two entries.
# Run: python3 cartography.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def class_index(value, edges):
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
    edges = [0,10,20]
    for value, expected in [(0,0),(10,0),(10.001,1),(20,1),(-1,-1),(21,-1)]:
        check(class_index(value,edges), expected)
    check(class_index(float("nan"),edges), -1)
    check(class_index(float("inf"),edges), -1)
    print("All checks passed")
