# Phase 2 — working files

Start at [the Phase 2 path](../../index.html#phase2). Work through the five
[original tasks](../../index.html#phase2/exercises) in order. The supplied note is
[preserved separately](../../gis-note-phase2.md); downloads correct specific
teaching-code limitations without silently rewriting it.

## Setup

Install Python 3 and GDAL/OGR (check drivers with `ogr2ogr --formats`). On Windows,
an OSGeo4W shell is one option; on any OS use your installed toolchain's instructions.
Use `python3` instead of `python` when needed. These Python helpers import only the
standard library. The package verifier also invokes GDAL executables on your PATH.
The website does not execute these tools.

Download the linked files from the course, or clone the repository and copy this
directory to a fresh working directory. Do not work over your only copy of real data.

```bash
python test_helpers.py
python check_geojson.py parcels.geojson
python tilemath.py
python tiles.py
python gpkg_blob.py sample_polygon.hex
python mvt_decode.py
```

The original GeoJSON intentionally returns exit code 1 with one winding warning.
The downloaded checker also handles promoted MultiPolygon outputs, rejects
malformed rings and zero signed area, and supports optional elevation coordinates.
It is a limited polygon sanity check, NOT a full RFC 7946 or topology validator.

## Files and sequence

1. **Vectors:** parcels.geojson, check_geojson.py, report_ex1.md. Use the vector
   commands in commands.sh and inspect every output. Three features must survive.
2. **Tiles/requests:** tilemath.py, tiles_cover.py, tiles.py, requests.txt. The
   inclusive-corner cover gives eight addresses; it is not a guarantee of exact
   generator output. The helpers clamp polar latitude to the Web Mercator limit,
   put longitude +180 in the last column, and reject reversed/antimeridian bboxes.
3. **Raster:** make_dem.py generates dem.asc locally (~4.8 MB), not in the website.
   Fill raster_report.md. Use `-a_nodata none` for the deliberately broken NoData
   experiment: merely omitting the option inherits the source declaration.
4. **Bytes:** gpkg_blob.py, sample_polygon.hex, mvt_decode.py. These read a header
   and command integers; they do not validate every byte of a full geometry/tile.
5. **Release:** verify_package.py, parcels.xml, release_readme.md, requests.txt.
   commands.sh creates the permitted MBTiles alternative, not a fabricated PMTiles.
   Fill actual metadata dates/lineage and tool versions before publishing.

`commands.sh` is a worked Bash implementation, not an exercise starter. Read it
before running `bash commands.sh` in a fresh directory. It needs all helper files,
GDAL and Python; it intentionally stops on errors. Rerunning into existing outputs
may fail: use a new directory rather than deleting your originals.

## What the release checker really checks

```bash
python verify_package.py release
```

It writes release/checks.json and exits non-zero for any failure or unavailable
required tool. It inspects the **actual** GeoJSON, GeoPackage, FlatGeobuf, tile
archive/directory, raster and XML in the release tree. GDAL is used to export the
actual released COG to an ASCII stream; Python independently counts those values.
It does not mistake a source DEM, a hand-built fixture or an expected tile list for
evidence that a derived output is correct.

Supported tile checks: MBTiles `tiles/parcels.mbtiles` (TMS rows converted back to
XYZ), or `tiles/parcels_tiles/z/x/y.pbf`. It checks populated addresses and non-empty
payloads, not MVT geometry correctness. Extra buffered tiles are reported, not
silently treated as exactly eight. Missing expected bbox-cover tiles fail and
require investigation against your generator's clipping/simplification policy.

For optional PMTiles conversion, use `pmtiles convert`, `pmtiles show` and the
verification commands offered by your installed CLI. The Python verifier does
not parse that archive and deliberately records a failure when one is present;
extend it with real archive checks before claiming full automated coverage.

The XML is abridged, not an INSPIRE-conformity claim. Full topology, complete WKB,
COG conformance, live service requests, Range/CORS and semantic metadata validation
remain separate checks. Do not label these PASS without their own evidence.

## Solutions

The website keeps all five complete source solutions behind disclosure controls.
The solutions/ Markdown files preserve those examples, including their caveats.
Use the corrected helpers and commands in this directory when executing them.
The report files are deliberately blank templates, never fabricated run evidence.
