### Exercise 4 (Advanced): Read the bytes: GeoPackage geometry and vector-tile commands

**Task.**
1. Write `gpkg_blob.py` with a function `parse_gpkg_blob(bytes)` returning the header fields (version, flags, byte order, envelope type, `srs_id`, envelope, WKB geometry type).
2. Use Python's `sqlite3` module to read the `geom` blob of every row of `parcels.gpkg` (Exercise 1). Report each blob's `srs_id`, envelope, and geometry type. Check that each envelope lies inside the dataset bbox. (No GDAL available? Use the sample blob below.)
3. Write `mvt_decode.py` that decodes an MVT geometry command stream into absolute tile coordinates.
4. Hand-encode a square exterior ring with corners `(10,10) → (30,10) → (30,30) → (10,30)` as an MVT command stream, decode it with your function, and show with the shoelace formula that the ring has *positive* area in tile coordinates.
5. Explain in two sentences why GeoJSON and MVT exterior rings have *different* visual orientation.

**Prerequisites.** Exercises 1 and 2; §4.2.3; §4.4.3.

**Sample input** (hex of a 133-byte GeoPackage blob for parcel P001 with an XY envelope):

```text
47500003e6100000c520b07268911340df4f8d976e92134072f90fe9b72f4a40c7293a92cb2f4a4001030000000100000005000000c520b0726891134072f90fe9b72f4a40df4f8d976e92134072f90fe9b72f4a40df4f8d976e921340c7293a92cb2f4a40c520b07268911340c7293a92cb2f4a40c520b0726891134072f90fe9b72f4a40
```

**Deliverable.** `gpkg_blob.py`, `mvt_decode.py`, and the printed results plus the two-sentence explanation.

**Success criteria.**
- The sample blob parses to `srs_id = 4326`, envelope `(4.892, 4.893, 52.3728, 52.3734)` in **(minx, maxx, miny, maxy)** order, WKB type `Polygon`, WKB starting at offset 40.
- The square ring encodes as `[9, 20, 20, 26, 40, 0, 0, 40, 39, 0, 15]` and decodes back to the four corners plus `ClosePath`.
- The ring's shoelace area is `+400`.

**Hint.** The GeoPackage envelope is *not* `(minx, miny, maxx, maxy)`. The WKB byte-order marker is the first byte *after* the header and envelope.

---

