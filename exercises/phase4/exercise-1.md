### Exercise 1 — Beginner: Foundations, SRIDs, and the geometry/geography difference

**Task.** Build the schema from scratch using only the coordinate table in §5.1 (if you already ran §5, drop the tables first). Then:

1. Create `fire_station`, `incident`, and `district` with typmod geometry columns (type + SRID 28992), a `CHECK (ST_IsValid(geom))` on `district`, and a GiST index on each geometry column. Run `ANALYZE`.
2. Query `geometry_columns` to confirm type and SRID of each table.
3. Prove the typmod works: try to insert a point labeled EPSG:4326 into `incident` and capture the error message.
4. Compute `ST_Distance` between `POINT(0 0)` and `POINT(1 0)` as `geometry` (SRID 4326) **and** as `geography`; explain the unit difference.
5. Use `ST_Relate` to show the DE-9IM string for incident 2 against each district.

**Prerequisites.** PostGIS installed; §2 and §4.1–4.3.

**Sample input.** Coordinates in §5.1.

**Expected deliverable.** One SQL script plus a short text file containing your query outputs for steps 2–5.

**Success criteria.**
* `geometry_columns` shows three rows with SRID 28992 and the correct types (`POINT`, `POINT`, `POLYGON`).
* The wrong-SRID insert is **rejected**.
* The geometry distance is `1` and the geography distance is ≈ `111319.49`.
* Both `ST_Relate` strings equal `FF20F1FF2`.

**Hint.** `ST_MakeEnvelope(xmin, ymin, xmax, ymax, srid)` builds each district polygon.

---

