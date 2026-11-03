### Exercise 1 (Beginner): fixtures and CRS discipline

**Task.** Create `fixtures.py` exposing functions `make_districts()`, `make_flood()`, `make_clinics(extra_boundary=False)` that return `GeoDataFrame`s in EPSG:32631 for the data below. Then write `check_ex1.py` that:

1. asserts all three layers share one CRS and all geometries are valid;
2. prints district areas;
3. transforms the lon/lat point `(3.0, 52.0)` to EPSG:32631 with `pyproj` (`always_xy=True`) and checks it against the expected values;
4. checks round-trip accuracy for `(3.7, 51.9)` through EPSG:32631 and back;
5. demonstrates the **degrees pitfall**: convert the clinics to EPSG:4326 and buffer the first one by `400`, printing the buffer's `.area` and explaining what unit it is in;
6. writes the layers to one GeoPackage (`ex1.gpkg`) and reads one back, checking the CRS and feature counts.

**Prerequisites.** §2.5, §2.6, §4.2, §4.4.

**Sample input.** (local metres; add `X0 = 500000`, `Y0 = 5700000` to get real coordinates)

| Layer | Data |
|---|---|
| districts | A (0,0)–(1000,1000) pop 4000 region R1; B (1000,0)–(2000,1000) pop 6000 region R1; C (0,1000)–(1000,2000) pop 2000 region R2 |
| flood | F1 (500,0)–(1500,1000), attribute `zone="F1"` |
| clinics | P1 (250,500), P2 (1250,500), P3 (250,1500), P4 (2500,500) with `clinic` = "P1"…"P4" and `label` = "Clinic 1"…"Clinic 4". When `extra_boundary=True`, add P5 = (1000, 500) with label "Clinic 5" |

**Expected deliverable.** `fixtures.py`, `check_ex1.py`, `ex1.gpkg` (three layers), and the console output of the checks.

**Success criteria.**

* All assertions pass; district areas are exactly 1,000,000 m² each.
* `(3.0, 52.0)` → easting 500,000.0 (to better than a micrometre) and northing 5,761,038.2 (±0.1 m).
* Round-trip error below 10⁻⁸ degrees (about 1 mm).
* You can state in one sentence why the printed buffer area in step 5 is meaningless as square metres.
* `ex1.gpkg` reads back with `crs.to_epsg() == 32631`, with 3, 1 and 4 features per layer.

**Hint.** `GeoDataFrame(..., geometry=[...], crs="EPSG:32631")`; a shared `rect()` helper that adds the origin keeps the code readable.

---

