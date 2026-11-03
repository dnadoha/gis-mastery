# Source solution (read the correction notes first)

### Solution 4

`gpkg_blob.py` (verified on the sample blob and on a single-point blob):

```python
#!/usr/bin/env python3
"""Parse a GeoPackage geometry BLOB (header + WKB). Standard library only."""
import struct

ENV_DOUBLES = {0: 0, 1: 4, 2: 6, 3: 6, 4: 8}       # envelope indicator -> number of doubles
WKB_NAMES = {1: "Point", 2: "LineString", 3: "Polygon", 4: "MultiPoint",
             5: "MultiLineString", 6: "MultiPolygon", 7: "GeometryCollection"}

def parse_gpkg_blob(blob: bytes) -> dict:
    if blob[:2] != b"GP":
        raise ValueError("not a GeoPackage geometry (missing 'GP' magic)")
    version, flags = blob[2], blob[3]
    little = flags & 0x01
    env_ind = (flags >> 1) & 0x07
    empty = (flags >> 4) & 0x01
    ext = (flags >> 5) & 0x01
    bo = "<" if little else ">"
    srs_id = struct.unpack(bo + "i", blob[4:8])[0]
    n = ENV_DOUBLES[env_ind]
    envelope = struct.unpack(bo + f"{n}d", blob[8:8 + 8 * n]) if n else None   # minx, maxx, miny, maxy [, minz, maxz ...]
    off = 8 + 8 * n
    wkb_bo = "<" if blob[off] == 1 else ">"
    wkb_type = struct.unpack(wkb_bo + "I", blob[off + 1:off + 5])[0]
    return {"version": version, "flags": flags, "empty": bool(empty), "extended": bool(ext),
            "srs_id": srs_id, "envelope(minx,maxx,miny,maxy)": envelope,
            "wkb_offset": off, "wkb_type": wkb_type % 1000, "wkb_name": WKB_NAMES.get(wkb_type % 1000, "?")}

def build_polygon_blob(ring, srs_id=4326):
    """Test helper: GeoPackage blob for a single-ring polygon WITH an XY envelope."""
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    hdr = b"GP" + bytes([0, 0b00000011]) + struct.pack("<i", srs_id)       # little-endian + envelope type 1
    hdr += struct.pack("<4d", min(xs), max(xs), min(ys), max(ys))
    wkb = struct.pack("<BIII", 1, 3, 1, len(ring)) + b"".join(struct.pack("<dd", *p) for p in ring)
    return hdr + wkb
```

Reading `parcels.gpkg` (part 2):

```python
import sqlite3
from gpkg_blob import parse_gpkg_blob

con = sqlite3.connect("parcels.gpkg")
for fid, blob in con.execute("SELECT fid, geom FROM parcels ORDER BY fid"):
    info = parse_gpkg_blob(bytes(blob))
    print(fid, info["srs_id"], info["envelope(minx,maxx,miny,maxy)"], info["wkb_name"])
```

**Verified results on the sample blob (P001):**

```text
{'version': 0, 'flags': 3, 'empty': False, 'extended': False, 'srs_id': 4326,
 'envelope(minx,maxx,miny,maxy)': (4.892, 4.893, 52.3728, 52.3734), 'wkb_offset': 40,
 'wkb_type': 3, 'wkb_name': 'Polygon'}
```

`flags = 3 = 0b00000011`: bit 0 = 1 (little-endian), bits 1–3 = `001` (XY envelope, 4 doubles = 32 bytes), so WKB begins at `8 + 32 = 40`. Reading a real GDAL-written `parcels.gpkg` (after `-nlt PROMOTE_TO_MULTI`) yields WKB type `MultiPolygon` (6) for each row, with envelopes inside the dataset bbox; P003's envelope should be `(4.892, 4.894, 52.3736, 52.3744)` because the hole does not change the outer extent. A point geometry has no envelope (`flags = 1`), as the second verified test shows (`srs_id 4326`, `wkb_name Point`).

`mvt_decode.py` and the square ring:

```python
#!/usr/bin/env python3
"""Decode an MVT geometry command stream into absolute tile coordinates."""
def unzigzag(n): return (n >> 1) ^ -(n & 1)

def decode(geom):
    i, x, y, out = 0, 0, 0, []
    while i < len(geom):
        cid, count = geom[i] & 0x7, geom[i] >> 3
        i += 1
        if cid == 7:
            out.append(("ClosePath",)); continue
        for _ in range(count):
            x += unzigzag(geom[i]); y += unzigzag(geom[i + 1]); i += 2
            out.append(("MoveTo" if cid == 1 else "LineTo", x, y))
    return out

def cmd(cid, count): return (cid & 7) | (count << 3)
def zz(v): return (v << 1) ^ (v >> 31)

ring = [(10, 10), (30, 10), (30, 30), (10, 30)]
stream = [cmd(1, 1), zz(10), zz(10), cmd(2, 3)]
for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
    stream += [zz(x1 - x0), zz(y1 - y0)]
stream.append(cmd(7, 1))
print(stream)          # [9, 20, 20, 26, 40, 0, 0, 40, 39, 0, 15]
print(decode(stream))  # [('MoveTo', 10, 10), ('LineTo', 30, 10), ('LineTo', 30, 30), ('LineTo', 10, 30), ('ClosePath',)]
area = sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1])) / 2
print(area)            # 400.0
```

**Step-by-step encoding.** `MoveTo ×1` = `(1) | (1<<3) = 9`; position `(10,10)` zigzags to `20, 20`. `LineTo ×3` = `2 | (3<<3) = 26`; deltas `(20,0)`, `(0,20)`, `(−20,0)` zigzag to `40,0`, `0,40`, `39,0`. `ClosePath ×1` = `7 | (1<<3) = 15`. Running `decode` reverses it. **Verified** by execution (see output in comments).

**Orientation explanation.** Both formats define an exterior ring by a *positive* shoelace area, but GeoJSON measures it with `y` (latitude) increasing northward, while MVT measures it in tile coordinates with `y` increasing *down* the screen. Because the `y` axis is flipped, the same ring has opposite signs in the two systems: on a north-up map a GeoJSON exterior ring runs counter-clockwise and an MVT exterior ring runs clockwise (Shapefile exterior rings also run clockwise). Converters and tile generators handle this, but any hand-written geometry code must not assume one convention.

---

