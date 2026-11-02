# Coarsen population cells without losing people
# Write block_sum(grid) to combine each non-overlapping 2 × 2 block into one coarse cell. Values are people per cell, so sum the four values. Input is a nonempty rectangular grid with positive even dimensions and no missing values. Return a new grid with half as many rows and columns; preserve the original.
# Run: python3 resampling.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def block_sum(grid):
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
    check(block_sum([[1,2],[3,4]]), [[10]])
    grid = [[10]*6 for _ in range(4)]
    check(block_sum(grid), [[40,40,40],[40,40,40]])
    check(sum(map(sum, block_sum(grid))), 240)
    check(grid, [[10]*6 for _ in range(4)])
    check(block_sum([[0,2,4,6],[1,3,5,7]]), [[6,22]])
    print("All checks passed")
