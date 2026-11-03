# Source solution — read the website clarifications before running

### Solution 2: the vector pipeline

`vector_ops.py`

```python
import geopandas as gpd


def exposure_report(districts, flood, clinics, buffer_m=400):
    assert districts.crs == flood.crs == clinics.crs, "CRS mismatch"
    assert districts.crs.is_projected, "use a projected (metric) CRS"

    joined = gpd.sjoin(clinics, districts[["name", "region", "geometry"]],
                       how="left", predicate="within")
    assert len(joined) == len(clinics)          # districts do not overlap, so 'within' cannot duplicate

    buffers = clinics.assign(geometry=clinics.buffer(buffer_m))
    catch = gpd.overlay(buffers, flood, how="intersection")
    catch["area_m2"] = catch.area

    expo = gpd.overlay(districts, flood, how="intersection")
    full_area = districts.set_index("name").area
    expo["pop_exposed"] = expo["pop"] * expo.area / expo["name"].map(full_area)

    regions = districts.dissolve(by="region", aggfunc={"pop": "sum"}, as_index=False)
    return {"joined": joined, "catchment_in_flood": catch, "exposure": expo, "regions": regions}
```

`test_vector_ops.py`

```python
import geopandas as gpd
import pytest
from fixtures import make_districts, make_flood, make_clinics
from vector_ops import exposure_report


@pytest.fixture
def report():
    return exposure_report(make_districts(), make_flood(), make_clinics())


def test_exposure(report):
    assert report["exposure"]["pop_exposed"].sum() == pytest.approx(5000.0, abs=1e-6)


def test_catchments(report):
    a = report["catchment_in_flood"].set_index("clinic")["area_m2"]
    assert set(a.index) == {"P1", "P2"}                         # P3, P4 never touch the flood zone
    assert a["P1"] == pytest.approx(65_015.88, abs=1.0)
    assert a["P2"] == pytest.approx(436_831.87, abs=1.0)


def test_regions(report):
    r = report["regions"].set_index("region")
    assert r.loc["R1", "pop"] == 10_000 and r.loc["R2", "pop"] == 2_000
    assert r.loc["R1", "geometry"].area == pytest.approx(2_000_000, abs=1e-3)
    assert r.loc["R2", "geometry"].area == pytest.approx(1_000_000, abs=1e-3)


def test_predicates_and_nearest():
    d = make_districts()
    c5 = make_clinics(extra_boundary=True)
    within = gpd.sjoin(c5, d[["name", "geometry"]], how="left", predicate="within")
    inter = gpd.sjoin(c5, d[["name", "geometry"]], how="left", predicate="intersects")
    assert len(within) == 5 and within.loc[within.clinic == "P5", "name"].isna().all()
    assert len(inter) == 6 and sorted(inter.loc[inter.clinic == "P5", "name"]) == ["A", "B"]

    p4 = c5[c5.clinic == "P4"]
    near = gpd.sjoin_nearest(p4, d[["name", "geometry"]], distance_col="d")
    assert near["name"].iloc[0] == "B" and near["d"].iloc[0] == pytest.approx(500.0)
```

**Answers to the predicate questions.**

* `within`: 5 rows. P5 lies on the shared edge x = 1000, which is the **boundary** of both A and B. `within(P5, A)` requires P5's *interior* to intersect A's *interior* and P5 to have no part in A's exterior; since P5 touches only the boundary, the DE-9IM interior/interior cell is empty, so `within` is false for both. P5 therefore gets null attributes under `how="left"`.
* `intersects`: 6 rows. `intersects` is true when the geometries share *any* point, including boundary points, so P5 matches both A and B and the join returns **two rows for one clinic**: a one-to-many fan-out. If you then summed a clinic-level measure you would double count; deduplicate (`drop_duplicates("clinic")`) or aggregate deliberately. (`covered_by` would also match both.)
* `sjoin_nearest`: P4 is 500 m east of B's edge at x = 2000, so the result is B with `d = 500.0`. Ties (P5 is at distance 0 from both A and B) return *all* tied rows, which is a further row-multiplication source.

