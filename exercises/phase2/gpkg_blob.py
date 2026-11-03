#!/usr/bin/env python3
"""Read standard GeoPackage geometry headers and a WKB type, not full WKB."""
import math
import struct
from contextlib import closing

ENV_DOUBLES = {0: 0, 1: 4, 2: 6, 3: 6, 4: 8}
WKB_NAMES = {1: "Point", 2: "LineString", 3: "Polygon", 4: "MultiPoint",
             5: "MultiLineString", 6: "MultiPolygon", 7: "GeometryCollection"}


def parse_gpkg_blob(blob):
    if len(blob) < 8 or blob[:2] != b"GP":
        raise ValueError("not a complete GeoPackage header (GP magic required)")
    version, flags = blob[2], blob[3]
    indicator = (flags >> 1) & 7
    if version != 0 or flags & 0xC0 or indicator not in ENV_DOUBLES:
        raise ValueError("unsupported version, reserved flags or envelope indicator")
    if flags & 0x20:
        raise ValueError("extended geometry not supported by this teaching parser")
    little = bool(flags & 1)
    bo = "<" if little else ">"
    srs_id = struct.unpack_from(bo + "i", blob, 4)[0]
    n = ENV_DOUBLES[indicator]
    offset = 8 + n * 8
    if len(blob) < offset + 5:
        raise ValueError("truncated envelope or WKB header")
    envelope = struct.unpack_from(bo + f"{n}d", blob, 8) if n else None
    if envelope and not flags & 0x10:
        if not all(math.isfinite(v) for v in envelope) or any(envelope[i] > envelope[i + 1] for i in range(0, n, 2)):
            raise ValueError("non-finite or reversed envelope")
    if blob[offset] not in (0, 1):
        raise ValueError("invalid WKB byte order marker")
    wkb_bo = "<" if blob[offset] == 1 else ">"
    raw_type = struct.unpack_from(wkb_bo + "I", blob, offset + 1)[0]
    base_type = raw_type % 1000
    if raw_type // 1000 not in (0, 1, 2, 3) or base_type not in WKB_NAMES:
        raise ValueError("unsupported WKB type")
    return {"version": version, "flags": flags, "byte_order": "little" if little else "big",
            "envelope_type": indicator, "empty": bool(flags & 0x10), "extended": False,
            "srs_id": srs_id, "envelope(minx,maxx,miny,maxy)": envelope,
            "wkb_offset": offset, "wkb_byte_order": "little" if blob[offset] == 1 else "big",
            "wkb_type": base_type, "wkb_name": WKB_NAMES[base_type]}


def build_polygon_blob(ring, srs_id=4326):
    """Fixture helper only; this does not construct a conformant GeoPackage file."""
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    header = b"GP" + bytes([0, 3]) + struct.pack("<i4d", srs_id, min(xs), max(xs), min(ys), max(ys))
    wkb = struct.pack("<BIII", 1, 3, 1, len(ring))
    return header + wkb + b"".join(struct.pack("<dd", *p) for p in ring)


if __name__ == "__main__":
    import argparse
    import pathlib
    import sqlite3
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", help="sample_polygon.hex or a parcels.gpkg with table parcels, column geom")
    args = parser.parse_args()
    file = pathlib.Path(args.path).resolve()
    if file.suffix == ".hex":
        print(parse_gpkg_blob(bytes.fromhex(file.read_text().strip())))
    else:
        with closing(sqlite3.connect(file.as_uri() + "?mode=ro", uri=True)) as con:
            for fid, blob in con.execute("SELECT fid, geom FROM parcels ORDER BY fid"):
                print(fid, parse_gpkg_blob(bytes(blob)))
