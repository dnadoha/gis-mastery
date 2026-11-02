# Count people near either school exactly once
# Each cell is [centreX, centreY, people]. Schools are [x,y] points. Write covered_population(cells, schools, radius) to sum a cell’s people if its centre is within radius metres of at least one school. Include centres exactly on the radius. Inputs use local metres, nonnegative finite populations and a nonnegative finite radius. Empty inputs return zero.
# Run: python3 coverage.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def covered_population(cells, schools, radius):
    return sum(people for x,y,people in cells
               if any(math.hypot(x-sx,y-sy) <= radius for sx,sy in schools))


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
    cells = [[c*100+50,350-r*100,10] for r in range(4) for c in range(6)]
    schools = [[200,200],[400,200]]
    check(covered_population(cells,schools,200), 200)
    check(covered_population(cells,schools+schools,200), 200)
    check(covered_population(cells,schools,1000), 240)
    check(covered_population([[3,4,7]],[[0,0]],5), 7)
    check(covered_population([[3,4,7]],[[0,0]],4.99), 0)
    check(covered_population(cells,[],200), 0)
    check(covered_population([],schools,200), 0)
    check(covered_population([[0,0,8]],[[0,0]],0), 8)
    print("All checks passed")
