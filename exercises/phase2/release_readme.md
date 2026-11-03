# Phase 2 teaching release — fill before publishing

These are synthetic teaching data, not surveyed parcels or a real elevation product.
Do not claim checks passed until running the verifier on these actual files.

| File | Purpose | CRS | Limitation |
|---|---|---|---|
| vector/parcels.gpkg | Editable master with full fields | EPSG:4326 | Single writer; poor remote subset access |
| vector/parcels.geojson | Small web/interchange payload | WGS 84, longitude/latitude | No spatial index or enforced schema |
| vector/parcels.fgb | Read-optimised vector delivery | EPSG:4326 | Static index; one layer |
| tiles/parcels.mbtiles | MVT tile archive, z10–16 | EPSG:3857 tile grid, TMS rows | Generalised geometry, not analysis data |
| raster/dem_cog.tif | Range-friendly elevation raster | EPSG:28992, arbitrary vertical datum | Do not edit COG layout in place |
| metadata/parcels.xml | Abridged provenance/discovery example | Geographic extent in WGS 84 | NOT schema-complete or INSPIRE-conformant |

## Commands, dates, tool versions

Replace this section with actual commands, versions and run dates. Describe any driver differences.
Update metadata lineage to describe executed steps, not the proposed workflow.

## Verification evidence

Run `python verify_package.py release` from the helper directory. Include checks.json
and actual GDAL reports. This checker does not fully validate WKB/topology, MVT
payloads, COG conformance or INSPIRE. PMTiles archive verification needs its own
tool and is deliberately not reported PASS by this checker. A computed tile cover
is not evidence about tile payload contents. State extra/missing tile addresses.

## Access and licence

Document the source and redistribution terms. Placeholder requests in requests.md
do not imply a deployed service. Test Range and CORS on the real host separately.
