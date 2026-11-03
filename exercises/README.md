# GIS programming exercises — Python or Go

One challenge for each chapter of the connected neighbourhood story. Choose either language, or solve both. All 36 versions use only their language's standard library. No GIS packages, npm packages, API keys or network access are needed to run a downloaded exercise.

## Start here

1. Install [Python 3.10+](https://www.python.org/downloads/) or [Go 1.18+](https://go.dev/dl/). Check with `python3 --version` (on Windows, `py --version`) or `go version`.
2. Download a starter below and open it in your editor. A function is a named block of code: it receives the inputs in its parentheses and returns a result. Replace the TODO body with your own implementation.
3. Open a terminal in the downloaded file's folder. Run `python3 geometry.py` (Windows: `py geometry.py`) or `go run geometry.go`. Substitute the filename for your chapter. In this repository, each Go exercise has its own package directory: from `exercises/go`, run `go run ./geometry`. Keep separately downloaded Go exercises in separate folders too, so their helpers and `main` functions do not collide.
4. Keep the supplied checks. Each `check(actual, expected)` call compares your result to a known answer; a mismatch raises an error. The unimplemented starter intentionally fails. Floating-point comparisons allow an absolute tolerance of 0.000001 or a relative tolerance of 0.000000001, whichever is larger.
5. When you see `All checks passed`, add at least one extra case, run again, then record completion on the website. Use the hints and solutions after attempting the problem.

The [programming workshop](../index.html#practice) saves a separate draft, local-output note and self-reported completion for each language. It does not execute code. Download your edited file to run it locally. After editing in your own editor, paste your finished file back into the website if you want it included in your notebook export. Editing a browser draft clears that language's completion. Completing either language counts once per chapter.

## Chapters and files

| Chapter | Challenge | Python starter | Go starter | Worked solutions |
|---|---|---|---|---|
| 1 | [Find the neighbourhood’s bounding box](../index.html#lesson/geometry/practice) | [geometry.py](python/geometry.py) | [geometry.go](go/geometry/geometry.go) | [Python](solutions/python/geometry.py) · [Go](solutions/go/geometry/geometry.go) |
| 2 | [Resolve swapped coordinate fields](../index.html#lesson/axes/practice) | [axes.py](python/axes.py) | [axes.go](go/axes/axes.go) | [Python](solutions/python/axes.py) · [Go](solutions/go/axes/axes.go) |
| 3 | [Convert GPS height to geoid-referenced height](../index.html#lesson/earth/practice) | [earth.py](python/earth.py) | [earth.go](go/earth/earth.go) | [Python](solutions/python/earth.py) · [Go](solutions/go/earth/earth.go) |
| 4 | [Guard a metre-based analysis function](../index.html#lesson/crs/practice) | [crs.py](python/crs.py) | [crs.go](go/crs/crs.go) | [Python](solutions/python/crs.py) · [Go](solutions/go/crs/crs.go) |
| 5 | [Choose a UTM zone, including the exceptions](../index.html#lesson/projections/practice) | [projections.py](python/projections.py) | [projections.go](go/projections/projections.go) | [Python](solutions/python/projections.py) · [Go](solutions/go/projections/projections.go) |
| 6 | [Transform a local drawing’s coordinates](../index.html#lesson/transformations/practice) | [transformations.py](python/transformations.py) | [transformations.go](go/transformations/transformations.go) | [Python](solutions/python/transformations.py) · [Go](solutions/go/transformations/transformations.go) |
| 7 | [Measure home-to-school distance](../index.html#lesson/distances/practice) | [distances.py](python/distances.py) | [distances.go](go/distances/distances.go) | [Python](solutions/python/distances.py) · [Go](solutions/go/distances/distances.go) |
| 8 | [Compare positions using a distance tolerance](../index.html#lesson/precision/practice) | [precision.py](python/precision.py) | [precision.go](go/precision/precision.go) | [Python](solutions/python/precision.py) · [Go](solutions/go/precision/precision.go) |
| 9 | [Budget raster memory before allocating it](../index.html#lesson/vector-raster/practice) | [vector_raster.py](python/vector_raster.py) | [vector_raster.go](go/vector-raster/vector_raster.go) | [Python](solutions/python/vector_raster.py) · [Go](solutions/go/vector-raster/vector_raster.go) |
| 10 | [Locate a raster cell’s centre](../index.html#lesson/geotransform/practice) | [geotransform.py](python/geotransform.py) | [geotransform.go](go/geotransform/geotransform.go) | [Python](solutions/python/geotransform.py) · [Go](solutions/go/geotransform/geotransform.go) |
| 11 | [Coarsen population cells without losing people](../index.html#lesson/resampling/practice) | [resampling.py](python/resampling.py) | [resampling.go](go/resampling/resampling.go) | [Python](solutions/python/resampling.py) · [Go](solutions/go/resampling/resampling.go) |
| 12 | [Distinguish a park’s interior, edge and exterior](../index.html#lesson/topology/practice) | [topology.py](python/topology.py) | [topology.go](go/topology/topology.go) | [Python](solutions/python/topology.py) · [Go](solutions/go/topology/topology.go) |
| 13 | [Implement signed polygon area](../index.html#lesson/algorithms/practice) | [algorithms.py](python/algorithms.py) | [algorithms.go](go/algorithms/algorithms.go) | [Python](solutions/python/algorithms.py) · [Go](solutions/go/algorithms/algorithms.go) |
| 14 | [Count people near either school exactly once](../index.html#lesson/coverage/practice) | [coverage.py](python/coverage.py) | [coverage.go](go/coverage/coverage.go) | [Python](solutions/python/coverage.py) · [Go](solutions/go/coverage/coverage.go) |
| 15 | [Give class boundaries one consistent meaning](../index.html#lesson/cartography/practice) | [cartography.py](python/cartography.py) | [cartography.go](go/cartography/cartography.go) | [Python](solutions/python/cartography.py) · [Go](solutions/go/cartography/cartography.go) |
| 16 | [Serialize School A as GeoJSON](../index.html#lesson/formats/practice) | [formats.py](python/formats.py) | [formats.go](go/formats/formats.go) | [Python](solutions/python/formats.py) · [Go](solutions/go/formats/formats.go) |
| 17 | [Prepare density attributes for QGIS](../index.html#lesson/qgis/practice) | [qgis.py](python/qgis.py) | [qgis.go](go/qgis/qgis.go) | [Python](solutions/python/qgis.py) · [Go](solutions/go/qgis/qgis.go) |
| 18 | [Audit coordinates before they reach the map](../index.html#lesson/debugging/practice) | [debugging.py](python/debugging.py) | [debugging.go](go/debugging/debugging.go) | [Python](solutions/python/debugging.py) · [Go](solutions/go/debugging/debugging.go) |

These challenges use explicit input contracts and small teaching datasets. Read each contract before implementing it. The [complete technical note](../core-geospatial-concepts.md) includes the larger Python/QGIS station projects and full mathematical detail.

## Rebuild / verify (maintainers)

Edit `programming.js`, then run `node scripts/build-programming.cjs`. The generated files are complete standalone programs, including the same check cases displayed on the website. Run `npm run test:programming` with Python and Go installed to execute all worked solutions and confirm all untouched starters fail at their TODO rather than passing accidentally.
