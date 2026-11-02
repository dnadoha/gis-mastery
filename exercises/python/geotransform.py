# Locate a raster cell’s centre
# Given zero-based col and row plus six GDAL geotransform values gt, return the cell centre [x,y]. Use x = gt[0] + (col+0.5)gt[1] + (row+0.5)gt[2] and y = gt[3] + (col+0.5)gt[4] + (row+0.5)gt[5]. The transform describes cell corners; the half-cell offsets reach the centre. Assume nonnegative indices and exactly six coefficients.
# Run: python3 geotransform.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def cell_centre(col, row, gt):
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
    gt = [0,100,0,400,0,-100]
    check(cell_centre(0,0,gt), [50,350])
    check(cell_centre(5,3,gt), [550,50])
    check(cell_centre(0,0,[10,2,1,20,0.5,-2]), [11.5,19.25])
    check(cell_centre(2,1,[10,2,1,20,0.5,-2]), [16.5,18.25])
    print("All checks passed")
