/* A connected emergency-response study; the supplied source remains separate. */
const Phase4Course = {
  lessons:[
    {
      id:'foundations',short:'Types and coordinates',title:'Give spatial data a database contract',
      sources:['overview','1','1.1','1.2','1.3','2','2.1','2.2','2.3','3','3.1','4','4.1','exercise-1','8','8.1'],diagram:'3-1',exercise:1,
      purpose:'Move from checked files and scripts to typed PostGIS columns, known units and reproducible SQL.',
      before:'Earlier phases taught us to inspect, publish and process spatial files. We now keep shared data and its rules inside a database.',
      steps:[
        ['Choose the measurement model','PostGIS extends PostgreSQL with spatial types, functions and indexes. Use geometry in a suitable local projected CRS for regional analysis, geography for spheroidal measurements in metres, and separate raster or topology extensions when their models fit. Our invented fire stations and incidents use EPSG:28992, in metres.'],
        ['Enforce the coordinate contract','A geometry(Point,28992) column checks geometry type, SRID and dimensionality. ST_SetSRID labels existing numbers; ST_Transform changes coordinates from a known source CRS. A geometry distance in EPSG:4326 is in degrees; geography gives about 111319.49 m for one degree along the equator.'],
        ['Build a scratch database','Use PostgreSQL with PostGIS, plus psql or another SQL client. Inspect postgis_full_version(), then build the three-station, three-incident, two-district fixture. Record counts, geometry_columns and a rejected wrong-SRID insert. SQL runs in your own database, not this website.']
      ],
      takeaway:'Store a known type and SRID, and choose geometry or geography before interpreting a distance.',
      check:['Does ST_SetSRID turn longitude and latitude into RD New metres?','No. It only changes the label. Label the known geographic coordinates correctly, then use ST_Transform.'],
      after:'The database knows what each geometry means. Next decide what it means for an incident to belong to a district.'
    },
    {
      id:'relationships',short:'Boundaries and predicates',title:'Count incidents without losing boundary points',
      sources:['2.4','4.3','5','5.1','5.2','5.3','5.6'],
      purpose:'Read the emergency-response fixture and distinguish contact, containment and one-owner assignment.',
      before:'Our point and polygon columns share a known metric CRS. Correct units alone do not decide how a point on a district edge should count.',
      steps:[
        ['Keep the fixture hand-checkable','West and East are adjacent 3000 by 5000 m rectangles, each 15000000 m². Incident I2 sits exactly on their shared x = 122000 boundary. Validate geometry, row counts and extents before testing predicates. The coordinates are synthetic, not operational fire-service data.'],
        ['Ask the right relationship question','ST_Intersects and ST_Covers include a boundary point; ST_Contains excludes a point lying only on the boundary. For district versus I2, ST_Relate returns FF20F1FF2. The empty interior/interior cell explains why containment is false.'],
        ['Separate matches from ownership','Intersects counts are East 1 and West 3: four matches for three incidents. Contains gives East 0 and West 2, losing I2. For one district per incident, use ST_Covers with DISTINCT ON and the smallest district_id as the explicit tie rule. Keep unmatched points visible in a separate audit.']
      ],
      takeaway:'A spatial match can be one-to-many; exactly-one ownership requires a declared boundary policy.',
      check:['Will replacing ST_Contains with ST_Covers guarantee one district per point?','No. A shared-boundary point is covered by both polygons, so you still need a deterministic ownership rule.'],
      after:'We can explain which rows should match. Next learn how the database avoids testing every full geometry.'
    },
    {
      id:'indexes',short:'GiST and query plans',title:'Read the filter-and-refine plan',
      sources:['2.5','3.2','4.2','4.4','5.8'],diagram:'3-2',
      purpose:'Create spatial indexes, recognise usable predicates and interpret plans without mistaking candidates for answers.',
      before:'Our district and incident queries have explicit semantics. On larger tables, exact geometry tests need a fast way to find plausible candidates.',
      steps:[
        ['Filter bounding boxes first','A GiST spatial index uses an R-tree-like hierarchy of bounding boxes. The && operator tests box overlap, not exact shape intersection. Boxes may overlap when shapes do not, so an exact predicate must refine the candidate rows.'],
        ['Make the index usable','Create GiST indexes on geom and run ANALYZE after bulk loads. Use ST_DWithin for a distance bound and transform the query constant into the data CRS. Wrapping the indexed column needs a matching expression index. SP-GiST and BRIN fit different distributions and storage layouts.'],
        ['Explain actual work','Read Index Cond, Filter, rows removed, row estimates and Buffers in EXPLAIN (ANALYZE, BUFFERS). A sequential scan on three incidents is sensible. Disable it only temporarily for learning, then RESET. Subdivide huge polygons when loose boxes or expensive exact tests dominate; de-duplicate original feature IDs afterward.']
      ],
      takeaway:'An index narrows candidates; an exact predicate establishes the answer, and the plan shows the work.',
      check:['Does a sequential scan on the three-row fixture prove the index is broken?','No. Scanning three rows can cost less than using an index. Examine realistic data and selectivity before tuning.'],
      after:'With index behaviour visible, we can write nearest-neighbour, bounded-distance and clustering queries deliberately.'
    },
    {
      id:'queries',short:'KNN, radius and clusters',title:'Find nearby stations and connected hot spots',
      sources:['4.5','4.5.1','4.5.2','4.5.3','5.4','5.5','5.7','7','exercise-2','8.2'],exercise:2,
      purpose:'Use distance for reporting, ST_DWithin for filtering and KNN ordering for nearest-neighbour search.',
      before:'We know how an index filters candidates and how to check the plan. Now choose a query pattern that matches each response-analysis question.',
      steps:[
        ['Probe nearest neighbours per incident','ORDER BY geom <-> point LIMIT k supports GiST KNN. A LATERAL subquery performs one probe per incident. Nearest stations are I1 → S1 at 500 m, I2 → S2 at 1000 m, and I3 → S3 at about 1720.47 m. Decide how to break equal-distance ties.'],
        ['Define the threshold boundary','ST_DWithin uses distance <= d. At 2000 m it includes S1–I2 exactly on the threshold, producing station counts 2, 1, 1. Replacing an original strict ST_Distance < 2000 predicate with ST_DWithin alone changes this edge case; add ST_Distance < 2000 if strictness must be preserved.'],
        ['Read density reachability','With eps 1000 and minpoints 2, all three incidents are DBSCAN noise. With eps 2000, I1 connects I2 and I3 into one cluster even though I2–I3 is farther than eps. A cluster is not a promise that every pair is within the radius. Use an ordered window for reproducible ambiguous border assignments on general inputs.']
      ],
      takeaway:'Filtering, ordering, distance reporting and density clustering answer different questions with different boundary rules.',
      check:['Why are there four pairs at 2000 m but only three with a strict < 2000 test?','S1–I2 is exactly 2000 m away. ST_DWithin includes equality; the strict comparison excludes it.'],
      after:'The analytical query is clear. Next package a spatial subset for a web map without confusing display coordinates with measurement units.'
    },
    {
      id:'tiles',short:'Vector tiles',title:'Serve a bounded view of the incidents',
      sources:['3.3','4.5.4','5.9'],diagram:'3-3',
      purpose:'Trace an XYZ tile request through bounds, indexed filtering, clipping and MVT encoding.',
      before:'Our SQL can find and summarise incidents. A web map needs small display-ready subsets instead of downloading every database row.',
      steps:[
        ['Locate the tile','XYZ tiles use EPSG:3857 with a north-origin y axis. ST_TileEnvelope returns projected tile bounds. The Amsterdam reference location at zoom 10 maps to 10/525/336, but that location alone does not prove a tile covers every synthetic incident. Transform actual fixture points to locate their tiles.'],
        ['Filter then encode','Keep filtering on the indexed data column. Transform bounds into the source CRS or use an indexed 3857 display column, then pass display geometry to ST_AsMVTGeom and aggregate with ST_AsMVT. If a tile buffer is intended, expand the candidate search bounds too; clipping with buffer 64 cannot recover rows already filtered out.'],
        ['Separate display and analysis','Mercator is a display CRS, not a reliable local distance model. Whole-world tile bounds transformed into regional EPSG:28992 may fail or be meaningless. Restrict supported zooms or store an appropriate display copy. Record tile size and decoded features; a bytea result alone does not demonstrate the expected incidents were served.']
      ],
      takeaway:'A correct tile needs compatible bounds, an indexed candidate query and a deliberate clipping/buffer policy.',
      check:['Does ST_AsMVTGeom buffer 64 automatically expand the preceding WHERE search?','No. Expand the candidate envelope separately if off-tile features should appear in the tile buffer.'],
      after:'Straight-line queries and display tiles are ready. Network access needs a different model: connected edges with directional costs.'
    },
    {
      id:'routing',short:'pgRouting networks',title:'Compare straight-line and network-nearest stations',
      sources:['4.6','exercise-3','8.3'],exercise:3,
      purpose:'Hand-check Dijkstra, many-to-many costs, reachable vertices and one-way travel on the toy graph.',
      before:'We can find the station closest in projected distance. Actual access depends on network connectivity and costs, not just the point coordinates.',
      steps:[
        ['Build the graph contract','The nine-edge toy graph uses abstract costs, not metres. Edges have id, source, target, cost and reverse_cost. Negative direction costs mean that traversal is absent. Road geometry does not establish connectivity automatically: real imports need noding, vertex IDs, snapping and consistent units.'],
        ['Verify the cheapest path','From vertex 1 to 6, the path 1 → 3 → 2 → 4 → 5 → 6 costs 13. Many-to-many station-to-incident costs are S1: 2, 8, 10 and S2: 11, 5, 3. For I3 the network selects S2 although the Euclidean comparison restricted to S1 and S2 selects S1.'],
        ['Change one direction','A cost budget of 8 from S1 reaches vertices 1, 3, 2 and 4, covering I1 and I2. Making edge 9 one-way 5 → 6 changes S2 → I3 to 6 → 4 → 5 at cost 8; S2 still wins. Reachable vertices are not a continuous isochrone polygon. Verify pgRouting signatures for your installed version.']
      ],
      takeaway:'Network proximity depends on the graph, allowed directions and additive cost model, not Euclidean distance alone.',
      check:['Is I3’s Euclidean-nearest station S1 when all three stations are considered?','No. It is S3. Exercise 3 deliberately compares only S1 and S2, the two stations mapped to graph vertices.'],
      after:'The same spatial ideas appear in other engines. Choose one by workload and verify its exact semantics.'
    },
    {
      id:'engines',short:'Alternative engines',title:'Choose the database for the workload',
      sources:['3.5','4.7'],diagram:'3-5',
      purpose:'Compare transactional servers, embedded files and analytical engines without assuming SQL portability.',
      before:'PostGIS and pgRouting give us a shared database with analytical and graph functions. Not every project needs a multi-user server.',
      steps:[
        ['Start with access patterns','PostGIS fits multi-user transactional spatial applications. SpatiaLite and GeoPackage suit embedded, offline, single-file exchange; GeoPackage is a container standard and does not itself provide every SpatiaLite function. SQLite permits many readers but generally one writer at a time.'],
        ['Distinguish analytics from transactions','DuckDB spatial is useful for columnar scans, GeoParquet and file-based ETL. Its geometry and index behaviour are version-dependent and do not mirror PostgreSQL planning. Oracle Spatial and SQL Server can fit existing enterprise deployments with their own metadata, index and SQL conventions.'],
        ['Port a small truth set first','Repeat the fixture distance, boundary and validity checks before trusting an equivalent-looking function. SpatiaLite may need explicit SpatialIndex probing; SQL Server uses method syntax and grid-tessellation indexes. Document CRS, units, concurrency and deployment requirements alongside query results.']
      ],
      takeaway:'Choose by concurrency, storage, analysis and operational needs, then verify units and predicates in that engine.',
      check:['Does a GeoPackage file guarantee that every PostGIS ST_* function can run against it?','No. It standardises storage and metadata; the application or spatial extension supplies its query functions.'],
      after:'Engine selection solves deployment needs. The remaining task is keeping geometry, topology and history trustworthy as data changes.'
    },
    {
      id:'modeling',short:'Quality and topology',title:'Make spatial quality a schema concern',
      sources:['4.8','4.8.1','4.8.2','4.8.4','6','9','9.1','9.2','9.3','9.4'],
      purpose:'Separate row constraints, cross-feature topology audits and operational maintenance.',
      before:'We can choose an engine and issue useful spatial queries. Shared data also needs rules that remain true when someone inserts or edits a feature.',
      steps:[
        ['Constrain each stored row','Use stable business keys alongside integer primary keys, one geometry type and SRID per column, NOT NULL, validity and nonempty checks. Repair during ingestion and log changes. A bbox-overlap extent check is full containment only for points; use an appropriate covers/containment rule for larger shapes.'],
        ['Audit relationships between rows','Individually valid polygons may overlap or leave gaps. Compare positive-area intersections once per pair, and test missing coverage against an explicit expected study boundary. Counting holes in a union misses outer missing regions and gaps between disconnected polygons. Simple triggers need concurrency control when enforcing cross-row rules.'],
        ['Choose a topology model deliberately','PostGIS topology stores shared nodes, edges and faces once. Simple features store ordinary geometries and use audits or enforced rules. Version-dependent coverage functions can help with edge consistency and simplification. Keep derived display layers separate with documented refresh policies and rerun a tiny regression fixture after upgrades.']
      ],
      takeaway:'Valid rows do not guarantee a valid coverage; quality rules must name their scope and reference boundary.',
      check:['Can ST_IsValid on every district prove there are no district gaps or overlaps?','No. It checks each geometry individually. Coverage rules compare features and the expected study boundary.'],
      after:'Quality rules protect today’s features. Finally preserve when each station location was true so historical dispatch questions remain answerable.'
    },
    {
      id:'registry',short:'Valid-time capstone',title:'Preserve the station location that was true then',
      sources:['3.4','4.8.3','exercise-4','8.4'],diagram:'3-4',exercise:4,
      purpose:'Build a versioned station registry with temporal exclusions, atomic relocation and as-of nearest search.',
      before:'Our schema can reject bad geometries and audit topology. Overwriting a station location would still destroy the answer to yesterday’s dispatch question.',
      steps:[
        ['Store real-world validity','Valid time asks when a fact was true; transaction time asks when it was recorded. Store station versions in half-open tstzrange intervals [start,end). Use btree_gist and an exclusion constraint on station_id equality plus range overlap. Require nonempty ranges and define finite lower bounds and half-open conventions explicitly.'],
        ['Relocate as one transaction','Close the open version and insert the replacement atomically. Reject missing or non-finite effective dates and dates not after its start. The source uses FOR UPDATE and exclusion constraints; production writers need a stable per-station lock and retry strategy for concurrent relocations. Run the negative tests in separate transactions or savepoints.'],
        ['Verify history changes the answer','S2 moves from x 123000 to 125000 on 2026-01-01. On 2025-06-01 I2 selects S2 at 1000 m; on 2026-06-01 it selects S1 at 2000 m. I1 and I3 keep their nearest stations. Check open-version counts, no overlaps, failed duplicate-date relocation and actual query plans as historical versions accumulate.']
      ],
      takeaway:'Historical spatial answers need valid-time versions, database-enforced non-overlap and a tested write protocol.',
      check:['Will a current-row partial index automatically accelerate every as-of query?','No. The query must imply the partial-index predicate. Historical as-of queries still need their own measured strategy.'],
      after:'Complete the registry, record real SQL outputs and explain the plan, temporal invariants and synthetic-data limitations in your final report.'
    }
  ],
  exercises:[
    {number:1,lesson:'foundations',title:'Foundations, SRIDs and units',files:['solutions/exercise-1.sql'],evidence:'Keep the three table counts (3, 3, 2), geometry_columns, wrong-SRID rejection, degree versus metre distances and both FF20F1FF2 relationships.'},
    {number:2,lesson:'queries',title:'Index-aware spatial SQL',files:['solutions/exercise-2.sql'],evidence:'Keep the GiST plan, four inclusive-radius pairs, six ranked nearest rows, three deterministic district assignments and both DBSCAN outputs. Explain why strict < gives three pairs.'},
    {number:3,lesson:'routing',title:'Network analysis with pgRouting',files:['solutions/exercise-3.sql'],evidence:'Record the six station-to-incident costs, the I3 comparison restricted to S1/S2, budget-8 reachable vertices and the one-way cost of 8.'},
    {number:4,lesson:'registry',title:'A versioned station registry',files:['solutions/exercise-4.sql'],evidence:'Keep both as-of result tables, three expected errors, rejected duplicate-date relocation, open-version and overlap audits, and the 5–8-line performance note.'}
  ],
  solutionKeys:{1:'8.1',2:'8.2',3:'8.3',4:'8.4'},
  clarifications:{
    '4.2':'The geography expression-index example applies only to geodetic geometry. The earlier poi table uses projected EPSG:28992, so geom::geography is not valid on that table. Transform to a suitable geodetic CRS first or use the separate geography table.',
    '4.4':'Spatially index-aware functions can supply bounding-box conditions; exact planner output varies by query, PostGIS version and selectivity. Not every PostGIS function is parallel-safe. Check the installed function metadata and actual plan rather than assuming all functions run in parallel.',
    '4.5.2':'The source BAD example uses strict < 2000, while ST_DWithin is inclusive <= 2000. To preserve strict semantics, use ST_DWithin as the candidate filter plus ST_Distance < 2000. The course exercise intentionally expects the inclusive four-pair result.',
    'exercise-2':'The requested four-pair result changes the original strict < 2000 semantics: S1–I2 at exactly 2000 is included by ST_DWithin. Preserve strictness with an additional distance comparison if the original contract is required.',
    '8.2':'The inclusive rewrite produces four pairs, whereas the original strict predicate produces three. For general DBSCAN data, use OVER (ORDER BY incident_id) for deterministic ambiguous border assignments. Keep KNN tie handling explicit.',
    '4.5.4':'The source tile query filters unbuffered bounds even though ST_AsMVTGeom uses buffer 64. For buffered output, expand the search envelope by buffer/extent (64/4096), but pass the unexpanded bounds to ST_AsMVTGeom. Regional-CRS transformations also need supported zoom and extent limits.',
    '5.9':'Tile 10/525/336 is calculated for the Amsterdam reference coordinate, not for every synthetic incident. Transform each actual point to EPSG:4326 and compute its tile address before checking tile membership.',
    '4.6':'pgr_contraction performs graph contraction operations; it is not a complete contraction-hierarchy routing preprocessing pipeline. Verify algorithms, function signatures and return columns in the installed pgRouting release. Reachable vertices are not an isochrone polygon.',
    '4.8.2':'The district_extent && constraint checks only bounding-box overlap, not that an entire polygon is inside the extent. Use an appropriate containment predicate for that rule. For a nonempty point, bbox overlap with the rectangle is sufficient.',
    '4.8.4':'Counting interior rings detects only enclosed holes, not every coverage gap. Compare the dissolved coverage with an explicit expected boundary. Trigger-based cross-row checks need locking or another concurrency strategy to avoid simultaneous writes violating the intended rule.',
    '8.1':'The wrong-SRID INSERT intentionally raises an error. Run it separately or with a savepoint; an error inside an explicit transaction aborts subsequent commands until rollback. With psql ON_ERROR_STOP enabled the file stops at that test. Downloads preserve the source listing.',
    'exercise-4':'The exercise requires an atomic relocation and rejected repeat date. Also test NULL and non-finite effective dates, temporal boundary instants and concurrent writers. Nonempty ranges alone do not enforce finite starts or half-open interval conventions.',
    '8.4':'Source SQL preserves the teaching implementation. Reject NULL/non-finite effective dates explicitly; otherwise NULL can produce unbounded ranges. Define finite lower-bound and half-open constraints, and use a stable station-row/advisory lock plus retry policy for concurrent relocations. FOR UPDATE on the current version alone does not guarantee every waiting call sees the newly inserted version. Run each deliberate failure separately or with savepoints. A current-row partial index needs a query predicate that implies upper_inf(valid_during); verify combined spatial/range index plans rather than assuming a benefit.'
  }
};
