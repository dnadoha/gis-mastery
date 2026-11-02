# Serialize School A as GeoJSON
# Return a JSON string containing a GeoJSON Feature with properties {"name": name} and a Point geometry whose coordinates are [lon, lat]. Inputs are a string and valid finite WGS 84 longitude/latitude. Use the standard JSON encoder so quotes and Unicode names round-trip correctly. Do not add a legacy "crs" member.
# Run: python3 formats.py
# Standard library only. Edit the function; keep and extend the checks below.
import math
import json

def school_geojson(name, lon, lat):
    return json.dumps({"type": "Feature", "properties": {"name": name},
                       "geometry": {"type": "Point", "coordinates": [lon, lat]}})


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
    for name in ["School A", 'School "A"', "বিদ্যালয়", "line\nbreak"]:
        feature = json.loads(school_geojson(name,90.4125,23.8103))
        check(feature, {"type":"Feature","properties":{"name":name},"geometry":{"type":"Point","coordinates":[90.4125,23.8103]}})
    check(json.loads(school_geojson("Zero",0,0))["geometry"]["coordinates"], [0,0])
    print("All checks passed")
