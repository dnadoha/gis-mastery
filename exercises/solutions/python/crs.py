# Guard a metre-based analysis function
# Before measuring school access, your application has three verified metadata fields: kind, unit and suitable. Write measurement_ready to return true only when kind is "projected", unit is "metre", and suitable is true. The suitability flag means someone has checked this CRS’s region and distortion for the task. Unknown strings must fail this deliberately small API contract.
# Run: python3 crs.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def measurement_ready(kind, unit, suitable):
    return kind == "projected" and unit == "metre" and suitable


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
    check(measurement_ready("projected", "metre", True), True)
    check(measurement_ready("geographic", "degree", True), False)
    check(measurement_ready("projected", "metre", False), False)
    check(measurement_ready("projected", "foot", True), False)
    check(measurement_ready("", "", True), False)
    print("All checks passed")
