# Budget raster memory before allocating it
# Write raster_bytes(width, height, bands, bytes_per_sample) to calculate uncompressed pixel storage. Dimensions are nonnegative integers; bands and bytes_per_sample must be positive integers. Return −1 for invalid inputs. A zero width or height is an empty raster and uses zero pixel bytes. Ignore headers, compression, masks and overview images. Go inputs and products fit into int64.
# Run: python3 vector_raster.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def raster_bytes(width, height, bands, bytes_per_sample):
    if width < 0 or height < 0 or bands <= 0 or bytes_per_sample <= 0:
        return -1
    return width * height * bands * bytes_per_sample


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
    check(raster_bytes(1000,1000,3,2), 6000000)
    check(raster_bytes(2000,2000,3,2), 24000000)
    check(raster_bytes(6,4,1,4), 96)
    check(raster_bytes(0,4,1,4), 0)
    check(raster_bytes(-1,4,1,4), -1)
    check(raster_bytes(4,4,0,4), -1)
    check(raster_bytes(4,4,1,0), -1)
    print("All checks passed")
