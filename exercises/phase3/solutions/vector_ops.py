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
