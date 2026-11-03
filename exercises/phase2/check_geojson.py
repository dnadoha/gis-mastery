#!/usr/bin/env python3
"""Limited Polygon/MultiPolygon sanity checker, not a full RFC/topology validator."""
import json
import math
import sys


def signed_area(ring):
    """Translate first to reduce cancellation for small rings far from (0, 0)."""
    if not ring:
        return 0.0
    ox, oy = ring[0][:2]
    return sum((a[0] - ox) * (b[1] - oy) - (b[0] - ox) * (a[1] - oy)
               for a, b in zip(ring, ring[1:] + ring[:1])) / 2


def position_ok(p):
    return (isinstance(p, list) and len(p) in (2, 3)
            and all(isinstance(v, (int, float)) and not isinstance(v, bool)
                    and math.isfinite(v) for v in p))


def check_polygon(coords, label):
    problems = []
    if not isinstance(coords, list) or not coords:
        return [f"{label}: missing polygon rings"]
    for i, ring in enumerate(coords):
        name = f"{label} ring {i}"
        if not isinstance(ring, list) or not all(position_ok(p) for p in ring):
            problems.append(f"{name}: malformed or non-finite positions")
            continue
        if len(ring) < 4 or ring[0] != ring[-1]:
            problems.append(f"{name}: not closed or fewer than 4 positions")
            continue
        if any(not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90) for p in ring):
            problems.append(f"{name}: position out of lon/lat range")
        area = signed_area(ring)
        if area == 0:
            problems.append(f"{name}: zero signed area")
        elif (area > 0) != (i == 0):
            kind = "exterior" if i == 0 else "hole"
            problems.append(f"{name} ({kind}): winding is {'CCW' if area > 0 else 'CW'}, "
                            f"expected {'CCW' if i == 0 else 'CW'}")
    return problems


def inspect(fc):
    """Return count, bbox, problems for this course's polygonal FeatureCollection."""
    if not isinstance(fc, dict) or fc.get("type") != "FeatureCollection" or not isinstance(fc.get("features"), list):
        raise ValueError("expected a FeatureCollection with a features array")
    problems, points = [], []
    if "crs" in fc:
        problems.append("legacy crs member: RFC 7946 has a fixed WGS 84 coordinate contract")
    for index, feature in enumerate(fc["features"]):
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            problems.append(f"feature at index {index}: expected Feature object")
            continue
        label = f"feature {feature.get('id', index)}"
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") not in ("Polygon", "MultiPolygon"):
            problems.append(f"{label}: checker supports only Polygon and MultiPolygon")
            continue
        coords = geometry.get("coordinates")
        polys = [coords] if geometry["type"] == "Polygon" else coords
        if not isinstance(polys, list) or not polys:
            problems.append(f"{label}: missing polygon coordinates")
            continue
        for poly in polys:
            problems.extend(check_polygon(poly, label))
            if isinstance(poly, list):
                for ring in poly:
                    if isinstance(ring, list):
                        points.extend(p for p in ring if position_ok(p))
    bbox = (min(p[0] for p in points), min(p[1] for p in points),
            max(p[0] for p in points), max(p[1] for p in points)) if points else None
    if bbox is None:
        problems.append("no usable polygon positions")
    return len(fc["features"]), bbox, problems


def main(path):
    with open(path, encoding="utf-8") as f:
        count, bbox, problems = inspect(json.load(f))
    print(f"features: {count}")
    print(f"bbox: {list(bbox) if bbox else None}")
    print("problems:" if problems else "problems: none")
    for problem in problems:
        print("  -", problem)
    return 1 if problems else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python check_geojson.py parcels.geojson")
    try:
        sys.exit(main(sys.argv[1]))
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        sys.exit(2)
