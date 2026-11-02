# Choose a UTM zone, including the exceptions
# Return the WGS 84 UTM zone number for finite longitude/latitude values. Use floor((lon + 180) / 6) + 1, with +180° assigned to zone 60. Accept −180 ≤ lon ≤ 180 and −80 ≤ lat < 84; return 0 outside this contract. Norway: 56 ≤ lat < 64 and 3 ≤ lon < 12 uses zone 32. Svalbard: 72 ≤ lat < 84 uses zones 31, 33, 35, 37 for longitude intervals [0,9), [9,21), [21,33), [33,42), respectively.
# Run: python3 projections.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def utm_zone(lon, lat):
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
    check(utm_zone(90.4125, 23.8103), 46)
    check(utm_zone(4.9003, 52.3791), 31)
    check(utm_zone(180, 0), 60)
    check(utm_zone(-180, 0), 1)
    check(utm_zone(3, 56), 32)
    check(utm_zone(3, 64), 31)
    for lon, zone in [(0,31), (9,33), (21,35), (33,37), (42,38)]:
        check(utm_zone(lon, 75), zone)
    check(utm_zone(0, 84), 0)
    check(utm_zone(181, 0), 0)
    check(utm_zone(0, -80), 31)
    print("All checks passed")
