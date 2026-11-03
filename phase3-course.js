/* Phase 3 follows one synthetic flood project; source text stays separate. */
const Phase3Course = {
  lessons:[
    {
      id:'stack',title:'Build a scriptable GIS toolkit',short:'Engines and I/O',
      sources:['overview','1','1.1','1.2','1.3','1.4','2','2.1','2.2','3','3.1','4','4.1'],diagram:'3-1',
      before:'Phase 2 gave us checked files and coordinate contracts. We now need repeatable programs that turn those files into answers.',
      purpose:'Meet GDAL, PROJ and GEOS, then choose the Python wrapper responsible for each part of a workflow.',
      steps:[
        ['Give each engine one job','GDAL/OGR reads and writes spatial formats and warps rasters. PROJ transforms coordinates. GEOS computes planar geometry. GeoPandas combines tabular data with geometry; it does not replace these native engines.'],
        ['Inspect before loading','Use ogrinfo and gdalinfo to inspect layers, CRS, bounds, grid and NoData. With pyogrio, request only needed columns and a bounding box in the source CRS. Preserve raw inputs and record native-engine versions.'],
        ['Prepare a consistent environment','Use the source environment recipe, preferably conda-forge, and add pytest for the exercise checks. The website reads offline but does not run Python, GDAL, SQL or routing servers. Run downloads in a separate local working folder.']
      ],
      takeaway:'Choose the wrapper by the engine and task, and record the environment that produced your outputs.',
      check:['Does Shapely open a GeoTIFF?','No. Rasterio or GDAL handles raster I/O; Shapely handles vector geometry.'],
      after:'Before asking any engine to measure a flood zone, make coordinates and units explicit.'
    },
    {
      id:'crs',title:'Make metres mean metres',short:'CRS discipline',
      sources:['2.5','2.6','4.2','exercise-1','solution-1'],exercise:1,
      before:'We know which library handles each task. A valid geometry can still produce a meaningless answer if its coordinate units are wrong.',
      purpose:'Create the reusable district and clinic fixtures in EPSG:32631, and verify transformations and round trips.',
      steps:[
        ['Label only what you know','set_crs assigns metadata without moving a coordinate. to_crs transforms from a known source CRS. Our synthetic study origin is easting 500000, northing 5700000 in UTM zone 31N; it is not the Phase 1 or Phase 2 dataset.'],
        ['Check order and units','Use always_xy=True in pyproj and pass longitude, latitude. At (3°, 52°), UTM 31N gives (500000, about 5761038.2) metres. A projected CRS can use feet: check axis units before calling a parameter buffer_m.'],
        ['Treat a transformation as a contract','Check the known point, round-trip error and output CRS after saving. Inspect missing grids with TransformerGroup from pyproj.transformer. For ellipsoidal distances use Geod; do not measure analytical distances or areas in Web Mercator.']
      ],
      takeaway:'Coordinates, CRS, axis order and units must agree before any spatial measurement is meaningful.',
      check:['Is any projected CRS sufficient for a 400 m buffer?','No. It must use metres and have suitable distortion over the study extent.'],
      after:'With the coordinate contract fixed, we can safely ask which clinics and residents intersect flooding.'
    },
    {
      id:'vectors',title:'Find the people and clinics exposed',short:'Vector operations',
      sources:['2.3','2.4','3.4','4.3','4.4','exercise-2','solution-2'],exercise:2,
      before:'Our three districts, flood polygon and four clinics now share a known metric CRS. We can compare them without confusing degrees and metres.',
      purpose:'Use joins, buffers, overlays and dissolves for different questions, with boundary and row-count checks.',
      steps:[
        ['Attach attributes without cutting shapes','A spatial join assigns district attributes to clinics. within excludes a point on the boundary; intersects and covered_by include it. A point on a shared edge can match two districts. A left join keeps clinic P4 even though it matches none.'],
        ['Cut shapes when area is the question','Buffer clinics by 400 m, then intersect the catchments with the flood polygon. Overlay carries attributes from both layers; clip keeps input attributes. GEOS approximates circles with polygons, so set buffer resolution explicitly when expected areas depend on it.'],
        ['Aggregate without double counting','District A and B each lose half their area to the flood. Under uniform density that exposes 2000 + 3000 = 5000 residents. Dissolve by region to merge districts and sum population. Validate geometry and compare counts and areas with tolerances.']
      ],
      takeaway:'Join to attach attributes, overlay to partition space, dissolve to aggregate, and always inspect fan-out.',
      check:['Why does a boundary clinic create two intersects rows?','It shares a point with both districts; the join is one-to-many, not guaranteed one row per clinic.'],
      after:'Vector areas describe the flood footprint. Next we sample an elevation grid over that same footprint.'
    },
    {
      id:'rasters',title:'Give flood cells a reproducible meaning',short:'Raster processing',
      sources:['3.5','4.5'],
      before:'The vector pipeline gives a hand-checkable flooded area. A synthetic elevation grid lets us verify raster processing against that result.',
      purpose:'Read cell centres, exclude NoData, classify elevation and distinguish grid alignment from reprojection.',
      steps:[
        ['Locate the cells','Our 20 by 20 raster has 100 m cells and its top-left corner at local (0, 2000). Row indices increase southward. Add half a cell to find a centre; the affine transform describes corners, not centre coordinates.'],
        ['Mask and classify valid values','The flood selects 100 cells with elevations 15 through 24: count 100, mean 19.5, area 1000000 m². Classify values below 15, from 15 to below 20, and at least 20. Carry the source validity mask into class output; reserve class 0 for NoData.'],
        ['Align before arithmetic','Map algebra requires matching CRS, transform, shape and resolution. Use nearest resampling for class codes, bilinear or cubic for continuous elevations when appropriate. all_touched includes extra edge cells; fractional coverage is a different, explicit zonal model.']
      ],
      takeaway:'Raster correctness depends on the grid, validity mask and selection rule, not only the array values.',
      check:['Must vector flood area always equal cell count times cell area?','No. They agree here because polygon edges align exactly with cell edges.'],
      after:'We can now connect these vector and raster steps into a defensive end-to-end workflow.'
    },
    {
      id:'workflow',title:'Run the complete flood-exposure pipeline',short:'Worked flood example',
      sources:['3.2','3.3','5','5.1','5.2','5.3'],diagram:'3-2',
      before:'We understand each vector and raster operation separately. The worked example combines them using one consistent synthetic study area.',
      purpose:'Trace the complete script from fixtures through exposed population, catchments, regions and raster checks.',
      steps:[
        ['Build a tiny truth set','Districts A, B and C are each 1000 m squares. The flood spans local x 500–1500 and y 0–1000. Four clinics include one outside every district. Keep this fixture small enough that expected outputs follow from arithmetic.'],
        ['Check outputs between operations','The left join maps P1 to A, P2 to B, P3 to C and P4 to no district. Only P1 and P2 have flooded catchments. The union overlay has five polygon parts. R1 dissolves to 10000 residents over 2000000 m².'],
        ['State the model behind the answer','5000 of 12000 residents are exposed only under uniform population density. Raster and vector areas agree only for this aligned grid. A passing script does not validate those assumptions for a real population or flood event.']
      ],
      takeaway:'A useful pipeline checks intermediate invariants and explains the assumptions behind its final number.',
      check:['Does 41.7% exposed prove exactly 5000 people will flood?','No. It is an areal-weighted estimate on synthetic data, not an observed population count.'],
      after:'The data pipeline is checkable. Next we turn place descriptions into locations without hiding match uncertainty.'
    },
    {
      id:'geocoding',title:'Resolve places without pretending certainty',short:'Geocoding',
      sources:['3.6','4.6'],diagram:'3-6',
      before:'Our fixtures already provide coordinates. Real workflows often begin with text addresses or a point needing a human-readable description.',
      purpose:'Separate normalisation, matching, scoring and positional accuracy; begin with a fully offline clinic gazetteer.',
      steps:[
        ['Normalise and retrieve candidates','Collapse whitespace and normalise case before fuzzy text matching. Require numeric identifiers to match exactly: clinic 9 must never silently become clinic 4. Save the selected candidate, score and match type, not just its coordinates.'],
        ['Separate confidence from accuracy','A strong text match may still locate only a street or locality centroid. Reverse geocoding can mean a containing district or a nearest address; these are different spatial queries. Boundary matches and equally near clinics may produce multiple rows.'],
        ['Make service policies part of the design','The exercises need no public geocoding service. If using one later, identify the application, follow its current policy, cache only as permitted, and coordinate rate limits across all requests. Do not send sensitive addresses casually.']
      ],
      takeaway:'Geocoding returns an evidence-backed candidate, not an automatically authoritative location.',
      check:['Can a 0.875 string similarity justify changing a clinic number?','No. Numeric identity is a hard constraint; fuzzy matching belongs on the text.'],
      after:'Once endpoints are trustworthy, network topology and costs determine how someone can actually reach them.'
    },
    {
      id:'routing',title:'Measure access along roads, not circles',short:'Routing and graphs',
      sources:['3.7','4.7'],diagram:'3-7',
      before:'We can geocode an endpoint and describe its surrounding district. Access still depends on connected roads, travel rules and cost units.',
      purpose:'Read a weighted graph and distinguish shortest paths, reachable vertices, isochrones and routing engines.',
      steps:[
        ['Build topology before routing','Nodes represent intersections and endpoints; edges carry length or time. The toy network uses two-way roads and metre costs. Real networks need direction, access, snapping and often turn restrictions. Keep isolated nodes when closed roads are removed.'],
        ['Follow the least-cost frontier','Dijkstra settles the smallest tentative cost and relaxes outgoing edges, assuming non-negative traversable weights. pgRouting treats negative edge costs as absent directions, not negative traversable weights. A 1500 m service query here returns reachable nodes, not a coverage polygon.'],
        ['Choose an engine intentionally','OSRM favours fast preprocessed routing, Valhalla offers dynamic costing and isochrones, and pgRouting keeps graph queries in SQL. Check HTTP status, profile, snap distance and units. Use a matrix service instead of thousands of separate route calls.']
      ],
      takeaway:'A route result is meaningful only with an explicit graph, access policy, cost model and units.',
      check:['Is a 1500 m circular buffer the same as a 1500 m network service area?','No. Network reachability follows connected edges and travel costs; the circle ignores both.'],
      after:'These operations work on tiny fixtures. Next keep the same logic while reading less data at once.'
    },
    {
      id:'scale',title:'Keep the answer while shrinking memory',short:'Windows and indexes',
      sources:['3.8','4.8','exercise-3','solution-3'],diagram:'3-8',exercise:3,
      before:'We have verified full-read operations on small data. Scaling should preserve their answers, not quietly change the selection rules.',
      purpose:'Combine pushdown, spatial indexes, windowed sums and efficient formats without losing boundary features.',
      steps:[
        ['Move less data first','Filter columns, attributes and source-CRS bounding boxes before loading. Use GeoParquet or indexed FlatGeobuf for suitable vector workloads and COG for range-readable rasters. Partition spatially rather than scattering nearby features randomly across every partition.'],
        ['Accumulate counts and sums','Read native raster blocks, combine validity and per-window geometry masks, then add counts and sums. Divide only at the end; averaging block means is wrong for unequal block sizes. A 20000² float32 raster takes 1.6 GB before intermediate copies.'],
        ['Test the partition boundary','A 512² float32 block takes 1 MiB; covering 20000² cells needs 1600 such blocks. Tile reads can duplicate crossing vectors, so define ownership and use halos for neighbourhood operations. A concave polygon centroid may lie outside it: use a guaranteed interior reference point when ownership relies on bbox retrieval.']
      ],
      takeaway:'Scale by reducing reads and accumulating compatible partial results, while testing boundary and NoData cases.',
      check:['Does block_windows guarantee 512 by 512 windows?','No. It follows the file’s native block layout; the tiny fixture may fit in one block.'],
      after:'The Python workflow is ready to scale. Compare the JavaScript tools before deciding what belongs in a client.'
    },
    {
      id:'javascript',title:'Choose what belongs in JavaScript',short:'JavaScript counterparts',
      sources:['4.9'],
      before:'Our Python tools wrap native engines. A web application may need similar operations without downloading or running that native stack.',
      purpose:'Recognise Turf.js, proj4js and geotiff.js capabilities and their limits relative to the native workflow.',
      steps:[
        ['Keep GeoJSON longitude first','Turf expects geographic GeoJSON coordinates. Its distance options name units explicitly, while Shapely distances use CRS units. Turf 7 intersection takes a FeatureCollection; verify the API for the installed major version.'],
        ['Do not assume identical engines','proj4js implements common projections, not all of PROJ’s operation database and datum-grid machinery. Turf is not a GEOS binding. Send authoritative, high-accuracy transformations to a suitable server-side tool when required.'],
        ['Fetch raster windows deliberately','geotiff.js can read selected COG windows when the host supports byte ranges and browser CORS. The example URL is a placeholder, not a dataset. Browser processing still has memory and responsiveness limits.']
      ],
      takeaway:'JavaScript can handle useful spatial tasks, but matching names do not guarantee matching algorithms or accuracy.',
      check:['Will a .tif URL automatically provide efficient window reads?','No. The file layout and server range support must both permit selective reads.'],
      after:'Bring the checked operations together in a final report on flood-resilient clinic access.'
    },
    {
      id:'capstone',title:'Explain flood-resilient clinic access',short:'Capstone and verification',
      sources:['6','6.1','6.2','7','exercise-4','8','solution-4','9','9.1','9.2','9.3'],exercise:4,
      before:'We can process vectors and rasters, resolve clinic labels and query road graphs. The final challenge combines these into an auditable access study.',
      purpose:'Close flooded roads, compare routes and service areas, and publish results with explicit modelling limitations.',
      steps:[
        ['Define closure precisely','For the exercise, close a road when its intersection with the flood has positive length. Point-only touching is not closed by this rule. R12, R23 and R24 close; P2 remains in the open graph but has no open road.'],
        ['Compare access before and after','P1–P2–P4 costs 2250 m before flooding. The remaining P1–P3–N–P4 route costs 4250 m: a detour factor of 1.889. Reachable clinic vertices within 1500 m shrink from P1, P2, P3 to P1, P3. P2’s host district has 6000 residents; this does not prove all residents are cut off.'],
        ['Publish evidence, not just a map','Write road attributes and reverse-geocoded points to GeoPackage. Include paths, costs, matching scores and assumptions in Markdown. Discuss a depth or flooded-fraction closure alternative, synthetic lengths versus travel time, boundary cases and uniform population density. Optional pgRouting SQL uses the same node IDs and costs.']
      ],
      takeaway:'A defensible GIS report joins reproducible outputs to explicit assumptions, checks and limitations.',
      check:['Does an isolated clinic mean all 6000 district residents are isolated?','No. That is the host district population, not a measured count of residents without alternative access.'],
      after:'Repeat the verified pipeline with real open data, keeping provenance and checks; the synthetic result is a learning fixture, not an emergency plan.'
    }
  ],
  exercises:[
    {number:1,lesson:'crs',title:'Fixtures and CRS discipline',files:['solutions/fixtures.py','solutions/check_ex1.py'],evidence:'Keep CRS and validity checks, three unit areas, a known transformed point, round-trip errors and all GeoPackage read-back counts.'},
    {number:2,lesson:'vectors',title:'The vector pipeline',files:['solutions/vector_ops.py','solutions/test_vector_ops.py'],evidence:'Record 5000 exposed residents, two catchment areas, region totals, boundary join row counts and P4’s 500 m nearest-district distance.'},
    {number:3,lesson:'scale',title:'Rasters and scale',files:['solutions/raster_ops.py','solutions/scale_demo.py'],evidence:'Compare full-read and windowed statistics and class counts, vector area, index versus loop results and actual timings. Test a missing-data cell too.'},
    {number:4,lesson:'capstone',title:'Flood-resilient clinic access',files:['solutions/fixtures.py','solutions/capstone.py','solutions/capstone.sql'],evidence:'Keep flooded lengths, both routes, the 1.889 detour, reachable vertices, isolation and geocoder checks; write a report explaining assumptions and alternatives.'}
  ],
  clarifications:{
    '1.4':'Exercise 2 also needs pytest. HTTP examples need requests; optional raster and distributed examples need the additional packages listed in the note. Downloads run locally, never in this browser.',
    '4.1':'The cell-centre snippet assumes a north-up raster. For rotation, include rx and ry cross terms, or use the full affine transform on (col + 0.5, row + 0.5).',
    '4.2':'Import TransformerGroup from pyproj.transformer, not the top-level pyproj namespace: from pyproj.transformer import TransformerGroup. Use always_xy=True and inspect available operations and grids.',
    '4.3':'Shapely geometry.buffer defaults to quad_segs=16, but the top-level vectorised shapely.buffer defaults to 8. GeoPandas uses resolution=16 by default. Set the parameter explicitly when comparing the 64-gon areas in this note.',
    '4.5':'Rasterio’s default polygon rasterisation is mainly centre-based, with a Bresenham line-selection exception. Use masked reads to handle numeric or NaN NoData and dataset masks. Never reclassify missing values as a valid risk class.',
    '4.6':'Two independent RateLimiter objects do not impose a shared aggregate service limit. Coordinate all geocode and reverse requests against the provider’s current policy. Nearest ties and overlapping districts can multiply rows in the simple offline helper.',
    '4.8':'A concave feature’s centroid can lie outside the feature and its tile may not retrieve it. Use representative_point() for polygon ownership, process an extent covering all reference points, and use halos for cross-tile operations. The sample block sum also needs an empty-block guard and an explicit accumulation dtype for general data.',
    'exercise-2':'Projected does not necessarily mean metres. The supplied solution’s projected-CRS assertion is sufficient for the EPSG:32631 fixture, not a general metric guarantee. Verify units and distortion for other inputs.',
    'solution-2':'These source downloads are teaching solutions for disjoint districts in EPSG:32631. Validate non-null CRS and metre units for general inputs. Set clinics.buffer(buffer_m, resolution=16) explicitly to retain the expected buffer areas.',
    'exercise-3':'The tiny fixture can occupy one native raster block; it demonstrates the window API, not a large-data memory benchmark. Timings depend on the machine. Add a multi-block and missing-data fixture for a stronger test.',
    'solution-3':'The source raster solution assumes every fixture cell is valid when writing risk.tif. For real inputs use src.read(1, masked=True), write class 0 under the mask and accumulate sums in float64. Verify a multi-block input separately. Downloads preserve the source rather than silently fixing it.',
    'exercise-4':'The scenario says “touches”, but the task and solution close roads only when flooded length > 0. A point-only touch has zero length and stays open. The service area here is reachable graph vertices, not an isochrone polygon.',
    'solution-4':'The download assembles make_roads into fixtures.py. Its report writer creates only the summary table: add the required assumptions and limitations yourself. Positive-length intersection is the closure rule. The 6000 residents are the host district population, not a proven count of cut-off residents. SQL creates tables and is not rerunnable unchanged; use a disposable database.'
  }
};
