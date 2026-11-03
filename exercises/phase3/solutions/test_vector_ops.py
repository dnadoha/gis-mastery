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
