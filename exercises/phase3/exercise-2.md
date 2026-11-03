### Exercise 2 (Intermediate): the vector pipeline

**Task.** Using `fixtures.py`, write `vector_ops.py` with a function `exposure_report(districts, flood, clinics, buffer_m=400)` that returns a dict containing:

* `joined`: clinics with their containing district (`name`, `region`), keeping clinics outside every district;
* `catchment_in_flood`: each clinic's `buffer_m` catchment intersected with the flood zone, with an `area_m2` column;
* `exposure`: district ∩ flood with an areal-weighted `pop_exposed`;
* `regions`: districts dissolved by `region` with summed population.

The function must assert that all inputs share a *projected* CRS. Then write `test_vector_ops.py` that checks the §5 expected results **and** answers these questions about predicates using `make_clinics(extra_boundary=True)`:

* How many rows does `sjoin(..., predicate="within", how="left")` return, and what happens to P5?
* How many rows does `predicate="intersects"` return, and why?
* What does `sjoin_nearest(<P4 only>, districts, distance_col="d")` return for P4?

**Prerequisites.** Exercise 1; §2.3, §4.3, §4.4.

**Sample input.** Fixtures from Exercise 1.

**Expected deliverable.** `vector_ops.py`, `test_vector_ops.py` (runnable with `pytest`), and a short written answer (3–5 sentences) to the predicate questions.

**Success criteria.**

* Total exposed population = 5,000 (tolerance 10⁻⁶).
* Catchment areas inside the flood zone exist only for P1 (≈ 65,016 m²) and P2 (≈ 436,832 m²), tolerance 1 m².
* Regions: R1 population 10,000, area 2,000,000 m²; R2 population 2,000, area 1,000,000 m².
* `within` yields 5 rows (P5 unmatched); `intersects` yields 6 rows (P5 matched to both A and B); P4's nearest district is B at distance 500 m.
* You can explain, in terms of DE-9IM interior/boundary, why a boundary point is not `within` either district.

**Hint.** To compute the exposure share use the **district's full area** (not the flood area) as denominator; `districts.set_index("name").area` gives a Series you can `.map`.

---

