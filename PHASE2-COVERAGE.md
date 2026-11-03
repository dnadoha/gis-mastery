# Phase 2 source coverage

All 81 sections of [the supplied note](gis-note-phase2.md) are retained without editing. 30 tables, 44 code/text blocks and 6 Mermaid diagrams are rendered offline.

SHA-256: `b2bcd893efde198e736cdde4f113512ec965b7e020d6aa935ce3a9135dff7bfc`

Reading clarifications and corrected downloadable helpers are separate from the verbatim source. These are content-coverage checks, not certification of GDAL command execution or INSPIRE conformity.

| Source section | Guided chapter | Full reading | Source lines |
|---|---|---|---|
| GIS Data Formats and Standards — Study Note (Phase 2) | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/overview) | 1–7 |
| 1. Learning objectives and prerequisites | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/1) | 8–9 |
| 1.1 Prerequisites (from Phase 1) | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/1-1) | 10–16 |
| 1.2 After this note you can | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/1-2) | 17–29 |
| 1.3 How to use this note | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/1-3) | 30–37 |
| 2. Conceptual foundations | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/2) | 38–39 |
| 2.1 What is a "format" vs a "standard"? | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/2-1) | 40–47 |
| 2.2 Core vocabulary | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/2-2) | 48–64 |
| 2.3 Design axes that explain nearly every format | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/2-3) | 65–75 |
| 2.4 The format landscape at a glance | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/2-4) | 76–98 |
| 3. Visual explanations | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/3) | 99–100 |
| 3.1 Conceptual overview: formats, services, and metadata | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/3-1) | 101–152 |
| 3.2 Choosing a format (decision flow) | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/3-2) | 153–177 |
| 3.3 Workflow: a conversion and publishing pipeline | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/3-3) | 178–197 |
| 3.4 Sequence: a cloud-native read (COG over HTTP) | [Cloud-native access](index.html#phase2/lesson/cloud) | [Read](index.html#phase2/reference/3-4) | 198–215 |
| 3.5 Data model: GeoPackage core tables | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/3-5) | 216–258 |
| 4. Technical deep dive | [Plan the publishing set](index.html#phase2/lesson/publishing) | [Read](index.html#phase2/reference/4) | 259–260 |
| 4.1 Cross-cutting concepts | [CRS and axis contracts](index.html#phase2/lesson/contracts) | [Read](index.html#phase2/reference/4-1) | 261–262 |
| 4.1.1 How formats store the CRS | [CRS and axis contracts](index.html#phase2/lesson/contracts) | [Read](index.html#phase2/reference/4-1-1) | 263–276 |
| 4.1.2 Axis order, once more (because it breaks real systems) | [CRS and axis contracts](index.html#phase2/lesson/contracts) | [Read](index.html#phase2/reference/4-1-2) | 277–290 |
| 4.1.3 Raster georeferencing: the affine geotransform | [CRS and axis contracts](index.html#phase2/lesson/contracts) | [Read](index.html#phase2/reference/4-1-3) | 291–309 |
| 4.2 Vector formats | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2) | 310–311 |
| 4.2.1 Shapefile (Esri) and its limitations | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-1) | 312–342 |
| 4.2.2 GeoJSON (RFC 7946) | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-2) | 343–367 |
| 4.2.3 GeoPackage (OGC) | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-3) | 368–392 |
| 4.2.4 FlatGeobuf | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-4) | 393–406 |
| 4.2.5 KML / KMZ (OGC) | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-5) | 407–419 |
| 4.2.6 GML (OGC / ISO 19136) | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-6) | 420–435 |
| 4.2.7 Vector format comparison | [Vector formats](index.html#phase2/lesson/vectors) | [Read](index.html#phase2/reference/4-2-7) | 436–449 |
| 4.3 Raster formats | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/4-3) | 450–451 |
| 4.3.1 GeoTIFF | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/4-3-1) | 452–472 |
| 4.3.2 Cloud Optimized GeoTIFF (COG) | [Cloud-native access](index.html#phase2/lesson/cloud) | [Read](index.html#phase2/reference/4-3-2) | 473–513 |
| 4.3.3 NetCDF and Zarr (multidimensional data) | [NetCDF, Zarr and CF](index.html#phase2/lesson/cubes) | [Read](index.html#phase2/reference/4-3-3) | 514–539 |
| 4.4 Tiled formats | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/4-4) | 540–541 |
| 4.4.1 The Web Mercator tile grid (XYZ) | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/4-4-1) | 542–583 |
| 4.4.2 XYZ and TMS raster tiles | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/4-4-2) | 584–590 |
| 4.4.3 Mapbox Vector Tiles (MVT) | [GeoPackage and MVT bytes](index.html#phase2/lesson/bytes) | [Read](index.html#phase2/reference/4-4-3) | 591–618 |
| 4.4.4 PMTiles | [GeoPackage and MVT bytes](index.html#phase2/lesson/bytes) | [Read](index.html#phase2/reference/4-4-4) | 619–632 |
| 4.5 The cloud-native access pattern | [Cloud-native access](index.html#phase2/lesson/cloud) | [Read](index.html#phase2/reference/4-5) | 633–653 |
| 4.6 The GDAL/OGR toolbox | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/4-6) | 654–669 |
| 4.6.1 `ogr2ogr` anatomy | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/4-6-1) | 670–701 |
| 4.6.2 `gdal_translate` and `gdalwarp` anatomy | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/4-6-2) | 702–720 |
| 4.6.3 Quirks that bite (a checklist) | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/4-6-3) | 721–747 |
| 4.7 OGC standards | [OGC services and APIs](index.html#phase2/lesson/services) | [Read](index.html#phase2/reference/4-7) | 748–751 |
| 4.7.1 Classic services | [OGC services and APIs](index.html#phase2/lesson/services) | [Read](index.html#phase2/reference/4-7-1) | 752–794 |
| 4.7.2 The OGC API family | [OGC services and APIs](index.html#phase2/lesson/services) | [Read](index.html#phase2/reference/4-7-2) | 795–836 |
| 4.7.3 Classic vs OGC API: when to use which | [OGC services and APIs](index.html#phase2/lesson/services) | [Read](index.html#phase2/reference/4-7-3) | 837–846 |
| 4.8 Metadata: ISO 19115 and INSPIRE | [Metadata and INSPIRE](index.html#phase2/lesson/metadata) | [Read](index.html#phase2/reference/4-8) | 847–850 |
| 4.8.1 The ISO geographic information metadata family | [Metadata and INSPIRE](index.html#phase2/lesson/metadata) | [Read](index.html#phase2/reference/4-8-1) | 851–896 |
| 4.8.2 INSPIRE (European Union) | [Metadata and INSPIRE](index.html#phase2/lesson/metadata) | [Read](index.html#phase2/reference/4-8-2) | 897–905 |
| 4.8.3 Practical metadata guidance | [Metadata and INSPIRE](index.html#phase2/lesson/metadata) | [Read](index.html#phase2/reference/4-8-3) | 906–915 |
| 5. Worked GIS example: from one source to a publishing set | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/5) | 916–921 |
| 5.1 The vector source and a standards check | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/5-1) | 922–1008 |
| 5.2 Tile addressing: where does this area live in the tile pyramid? | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/5-2) | 1009–1061 |
| 5.3 Vector conversion chain with `ogr2ogr` | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/5-3) | 1062–1108 |
| 5.4 The Shapefile pitfall made visible | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/5-4) | 1109–1123 |
| 5.5 Vector tiles and PMTiles | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/5-5) | 1124–1165 |
| 5.6 A cloud-optimized elevation raster | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/5-6) | 1166–1244 |
| 5.7 End-to-end verification checklist for this example | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/5-7) | 1245–1258 |
| 6. Common pitfalls and best practices | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/6) | 1259–1260 |
| 6.1 Coordinate systems and axis order | [CRS and axis contracts](index.html#phase2/lesson/contracts) | [Read](index.html#phase2/reference/6-1) | 1261–1271 |
| 6.2 Format-specific traps | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/6-2) | 1272–1288 |
| 6.3 Services and metadata | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/6-3) | 1289–1297 |
| 6.4 Performance and validation | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/6-4) | 1298–1308 |
| 7. Progressive exercises | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/7) | 1309–1314 |
| Exercise 1 (Beginner): Inspect, check, and convert vector data | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/exercise-1) | 1315–1339 |
| Exercise 2 (Intermediate): Tile addressing and OGC requests | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/exercise-2) | 1340–1366 |
| Exercise 3 (Intermediate): From ASCII grid to verified COG | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/exercise-3) | 1367–1391 |
| Exercise 4 (Advanced): Read the bytes: GeoPackage geometry and vector-tile commands | [GeoPackage and MVT bytes](index.html#phase2/lesson/bytes) | [Read](index.html#phase2/reference/exercise-4) | 1392–1419 |
| Exercise 5 (Applied challenge): Build and verify a publishing package | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/exercise-5) | 1420–1444 |
| 8. Solutions and explanations | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/8) | 1445–1446 |
| Solution 1 | [The vector pipeline](index.html#phase2/lesson/conversion) | [Read](index.html#phase2/reference/solution-1) | 1447–1482 |
| Solution 2 | [XYZ, TMS and MBTiles](index.html#phase2/lesson/tiles) | [Read](index.html#phase2/reference/solution-2) | 1483–1530 |
| Solution 3 | [GeoTIFF and NoData](index.html#phase2/lesson/rasters) | [Read](index.html#phase2/reference/solution-3) | 1531–1556 |
| Solution 4 | [GeoPackage and MVT bytes](index.html#phase2/lesson/bytes) | [Read](index.html#phase2/reference/solution-4) | 1557–1658 |
| Solution 5 | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/solution-5) | 1659–1821 |
| 9. Summary, glossary, and further reading | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/9) | 1822–1823 |
| 9.1 Key takeaways | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/9-1) | 1824–1834 |
| 9.2 Glossary | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/9-2) | 1835–1877 |
| 9.3 Further reading (authoritative sources) | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/9-3) | 1878–1895 |
| 9.4 Where to go next | [Verify the release](index.html#phase2/lesson/release) | [Read](index.html#phase2/reference/9-4) | 1896–1900 |

Rebuild with `npm run build:phase2` using Chromium as described in README.md. The deployed static site needs no build or browser process.
