/* Phase 2 keeps its own IDs; Phase 1 learner records never need migration. */
const Phase2Course = {
  lessons: [
    {
      id:'publishing', title:'One dataset, several jobs', short:'Plan the publishing set',
      sources:['overview','1','1.1','1.2','1.3','2','2.1','2.2','2.3','2.4','3','3.1','3.2','4'], diagram:'3-1',
      before:'In Phase 1 we learned what coordinates, shapes and raster cells mean. Now another person needs to open, query and trust our data.',
      purpose:'Follow three Amsterdam parcels and a synthetic elevation grid from source files to a checked publishing package. These are separate teaching datasets from the Dhaka neighbourhood in Phase 1.',
      steps:[
        ['Separate storage, delivery and discovery','A format tells a program how to read bytes. A service standard tells it how to ask a server for something. Metadata tells the recipient what the dataset means and whether they may use it. A GeoPackage, a WFS endpoint and an ISO metadata record solve different problems.'],
        ['Choose by the work, not the extension','The editable master needs transactions and full field names. A web client may instead need a small JSON response, an indexed subset or a ready-to-draw tile. Keep one authoritative copy, then derive the delivery copies. Do not edit every copy independently.'],
        ['Define done before converting','Our starting vector has three features and a known bounding box. The DEM has a known grid and missing-data block. Record these facts before conversion, so a successful command cannot hide dropped attributes or misplaced pixels.']
      ],
      takeaway:'Storage, services and metadata are three layers of one publishing workflow.',
      check:['Does a WMS URL replace our editable master dataset?','No. It requests a rendered map. Keep the source data separately so it can be edited and analysed.'],
      after:'Before choosing file formats, make the coordinate contract explicit.'
    },
    {
      id:'contracts',title:'Keep the coordinate contract with the bytes',short:'CRS and axis contracts',
      sources:['4.1','4.1.1','4.1.2','4.1.3','6.1'],
      before:'We have separate storage and delivery jobs. Each recipient must still interpret the same place correctly.',
      purpose:'Carry the Phase 1 CRS lessons across file and service boundaries, without assuming every format uses the same axis order.',
      steps:[
        ['Find where the CRS lives','GeoPackage registers a layer CRS in SQL tables. A Shapefile uses a .prj sidecar. RFC 7946 GeoJSON carries no configurable CRS: its positions are WGS 84 longitude, latitude. A missing .prj means unknown coordinates, not permission to assume WGS 84.'],
        ['Read axis order at each boundary','Our point is longitude 4.8926, latitude 52.3731. GeoJSON and CRS84 put longitude first. WMS 1.3.0 with EPSG:4326 uses latitude first. Even projected EPSG systems can have unusual authority axes; inspect the definition instead of treating easting-first as universal.'],
        ['Carry the raster origin too','For the DEM, row zero is the northern edge, and the pixel height is negative. An affine transform maps pixel corners; add half a column and half a row to locate a centre. A CRS label alone cannot place a raster.']
      ],
      takeaway:'A usable coordinate contract includes the CRS, axis order, units and, for rasters, the grid transform.',
      check:['Will assigning EPSG:28992 to degree coordinates transform them into metres?','No. Assignment changes the label. Reprojection computes new coordinates from a verified source CRS.'],
      after:'With the contract fixed, compare how vector formats preserve geometry and attributes.'
    },
    {
      id:'vectors',title:'Choose a vector container deliberately',short:'Vector formats',
      sources:['3.5','4.2','4.2.1','4.2.2','4.2.3','4.2.4','4.2.5','4.2.6','4.2.7'],diagram:'3-5',
      before:'We know the coordinate contract. Now we need a container for the parcels and their attributes.',
      purpose:'Choose a master format and understand what each delivery format gives up.',
      steps:[
        ['Keep the master in GeoPackage','GeoPackage is SQLite with standard registry tables and geometry blobs. It supports multiple layers, typed columns, transactions and spatial indexes in one file. It is a useful editable master, but SQLite still allows only one writer at a time.'],
        ['Match the delivery to its reader','GeoJSON is readable and convenient for small web payloads. FlatGeobuf places an optional spatial index before its features for efficient subset reads. KML is designed for presentation; GML supports schema-rich exchange. These strengths are not interchangeable.'],
        ['Treat Shapefile as a constrained export','Its .shp, .shx and .dbf belong together, with .prj and .cpg for CRS and encoding. Ten-character field names make population_total and population_density collide. Rename fields explicitly and include a dictionary if a legacy recipient requires this format.']
      ],
      takeaway:'GeoPackage is our master; other vector files are deliberate delivery copies.',
      check:['Why can we not send only parcels.shp?','The attributes, record index, CRS and encoding live in other files. Ship the complete file set.'],
      after:'Next we will convert the three parcels and read every result back.'
    },
    {
      id:'conversion',title:'Convert, inspect, and compare',short:'The vector pipeline',
      sources:['4.6','4.6.1','5','5.1','5.3','5.4','6','6.2','exercise-1','solution-1'],exercise:1,
      before:'We selected GeoPackage as the authoritative store and identified the legacy and web deliveries.',
      purpose:'Turn that choice into commands whose outputs you can verify, not just commands that exit successfully.',
      steps:[
        ['Inspect the original first','Download parcels.geojson and run check_geojson.py. It should report three features, bbox [4.892, 52.3728, 4.8945, 52.3744], and a clockwise exterior on feature 2. This is a writer-convention issue, not proof the polygon is topologically invalid.'],
        ['Put destination before source','ogr2ogr takes the destination first. Create the master with layer parcels, geometry column geom and PROMOTE_TO_MULTI. Use -t_srs to transform, -a_srs only to assign a verified label. Keep original input files outside your output directory.'],
        ['Read every export back','Use ogrinfo to compare count, CRS, schema and extent. Export RFC 7946 GeoJSON and rerun the downloadable checker, which supports Polygon and MultiPolygon. Record the actual Shapefile field names rather than guessing the driver’s collision renaming.']
      ],
      takeaway:'A conversion is finished only after checking the output against the source contract.',
      check:['Does -skipfailures prove all features were converted?','No. It can skip broken records. Compare counts and investigate every difference.'],
      after:'The vector chain is now checkable. Apply the same discipline to the elevation raster.'
    },
    {
      id:'rasters',title:'Give every elevation cell a meaning',short:'GeoTIFF and NoData',
      sources:['4.3','4.3.1','4.6.2','4.6.3','5.6','exercise-3','solution-3'],exercise:3,
      before:'We verified feature counts and field names. For a raster, the contract is the grid, values and missing-data rule.',
      purpose:'Build the synthetic DEM and distinguish valid heights from its -9999 sentinel.',
      steps:[
        ['Build a grid with known facts','make_dem.py writes 1200 columns by 800 rows of 2.5 m cells. Its lower-left corner is (121000, 486000), so its upper-left origin is (121000, 488000). This synthetic RD New grid has an arbitrary vertical datum; it is not surveyed flood data.'],
        ['Exclude missing values deliberately','There are 960000 cells, of which 5000 are NoData. The 955000 valid values range from 2 to 10 with mean about 3.0096. Without the missing-data declaration, -9999 contaminates both statistics and resampling. Use -a_nodata none to explicitly remove an inherited declaration for the comparison experiment.'],
        ['Preserve values while changing storage','Use Float32, tiled GeoTIFF and lossless DEFLATE with predictor 3. Choose bilinear or cubic for continuous elevation reprojection; nearest or mode for class codes. Float32 base storage is 1200 × 800 × 4 = 3840000 bytes before compression and metadata.']
      ],
      takeaway:'NoData is part of the data model, not a display colour.',
      check:['Why does omitting -a_nodata not necessarily remove NoData?','GDAL may inherit the source’s NODATA_value. Explicitly remove it with -a_nodata none, and inspect the output.'],
      after:'Now organise the same raster so remote readers can fetch only the blocks they need.'
    },
    {
      id:'cloud',title:'Fetch the bytes you need',short:'Cloud-native access',
      sources:['3.4','4.3.2','4.5'],diagram:'3-4',
      before:'Our GeoTIFF has a correct grid and values. A remote reader should not have to download every pixel.',
      purpose:'Understand the shared design behind COG, indexed FlatGeobuf and PMTiles.',
      steps:[
        ['Put the lookup before the payload','A client first reads metadata or an index to discover where relevant chunks live. COG uses TIFF directories and offset tables; FlatGeobuf uses a packed R-tree; PMTiles uses tile directories. Putting an ordinary file on a CDN does not add this structure.'],
        ['Select a useful resolution','COG overviews are reduced-resolution copies, so a world view does not read the full-resolution raster. For our DEM, overview factors 2, 4 and 8 give 600 × 400, 300 × 200 and 150 × 100 cells. Use continuous-data overview resampling here, not for class codes.'],
        ['Test the hosting contract','The server must actually honour byte ranges with 206 Partial Content. Browser clients also need suitable CORS permissions. Check real responses, signed-URL behaviour and request count. The four-tile sequence in the source is an illustration, not a promise about every viewport.']
      ],
      takeaway:'Cloud-native access combines chunk layout, a lookup structure and a working range-serving host.',
      check:['Is a compressed, striped GeoTIFF automatically a COG?','No. Compression alone does not provide tiled multiresolution, range-friendly layout. Create with the COG driver and validate the result.'],
      after:'The same chunk idea extends beyond 2-D images to time and depth.'
    },
    {
      id:'cubes',title:'Add time and depth without losing the grid',short:'NetCDF, Zarr and CF',
      sources:['4.3.3'],
      before:'We learned how chunks make spatial subsets efficient. Some datasets also have time, depth or atmospheric levels.',
      purpose:'Recognise when a two-dimensional image is the wrong model for the job.',
      steps:[
        ['Name the dimensions','A variable such as temperature[time, level, lat, lon] is an array over named axes. One band list is not enough to explain its coordinates, units and time calendar. NetCDF supports dimensions, variables and attributes; NetCDF-4 uses HDF5, while classic NetCDF has a different layout.'],
        ['Choose chunks for the questions','A map at one time and a time series at one location read different slices. Zarr stores chunks as independent keys, permitting selective reads and parallel writes. Poor chunk shapes can still make a cloud-native dataset slow.'],
        ['Read the conventions, not only the values','CF attributes describe units, coordinate variables and grid mappings. Check dimension order, CRS, missing-value rules and scale_factor/add_offset before interpreting stored numbers. Zarr metadata versions and geospatial conventions vary between datasets.']
      ],
      takeaway:'An N-D array needs named dimensions and conventions as well as chunks.',
      check:['Does finding a latitude variable guarantee that every array uses lat,lon order?','No. Inspect each variable’s dimensions and coordinate metadata. Array order is part of its contract.'],
      after:'For web maps, we instead organise multiple resolutions into a tile pyramid.'
    },
    {
      id:'tiles',title:'Address the same place at every zoom',short:'XYZ, TMS and MBTiles',
      sources:['4.4','4.4.1','4.4.2','5.2','5.5','exercise-2','solution-2'],exercise:2,
      before:'We know why multiple resolutions help. Web maps name each resolution and chunk with z/x/y.',
      purpose:'Compute the tile addresses for the parcels instead of guessing from a map.',
      steps:[
        ['Start with the Web Mercator square','At zoom z, the world has 2^z columns and rows. XYZ row zero is at the top; TMS and MBTiles row zero is at the bottom. Convert with tms_y = 2^z - 1 - y. Use Web Mercator for display, not parcel-area analysis.'],
        ['Locate a known point','The point (4.8926, 52.3731) lies in XYZ tile 14/8414/5384. Its MBTiles row is 10999. Tile bounds in EPSG:3857 are approximately [543008.649, 6865879.629, 545454.634, 6868325.614]. Use tilemath.py to recompute them.'],
        ['Cover the dataset, not just its centre','The parcel bbox requires one tile at each zoom 10 through 15, and two at zoom 16: eight theoretical bbox-cover addresses. The z16 columns are 33658 and 33659 in row 21536. Actual generators can add buffered edge tiles or omit simplified features, so inspect rather than promise an identical generated tile count.']
      ],
      takeaway:'Tile addressing is a grid convention; the same place has different row numbers in XYZ and TMS.',
      check:['Which MBTiles row stores either z16 parcel tile?','43999, because 65535 - 21536 = 43999. The columns do not change.'],
      after:'The tile address locates a chunk. Next inspect the coordinates encoded inside it.'
    },
    {
      id:'bytes',title:'Read the geometry inside the container',short:'GeoPackage and MVT bytes',
      sources:['4.4.3','4.4.4','exercise-4','solution-4'],exercise:4,
      before:'We can locate a tile in the world. Its feature coordinates are local integers, not longitude and latitude.',
      purpose:'Decode two binary seams without confusing a geometry blob, a command stream and an entire file format.',
      steps:[
        ['Read the GeoPackage header before WKB','A geometry blob begins with GP, a version and flags, followed by the signed CRS identifier. An XY envelope has four doubles in minx,maxx,miny,maxy order. In the sample blob it ends at byte 40, where an independently byte-ordered WKB geometry begins.'],
        ['Walk an MVT cursor','MVT commands pack an ID in the low three bits and a count above them. MoveTo and LineTo parameters are zigzag-encoded coordinate deltas. The square stream [9,20,20,26,40,0,0,40,39,0,15] visits four corners and closes the path. This integer list is not a complete Protocol Buffers MVT tile.'],
        ['Keep local axes and archives separate','MVT y points down the screen, so positive exterior-ring area looks clockwise. GeoJSON latitude increases north, so positive area looks counter-clockwise. PMTiles archives complete tiles with range-readable directories; it does not turn tile geometry back into authoritative analysis data.']
      ],
      takeaway:'Decode headers, byte order and coordinate conventions before interpreting geometry.',
      check:['Is the sample P001 blob necessarily a real output of our promoted master?','No. It contains a Polygon. The master built with PROMOTE_TO_MULTI normally contains MultiPolygon WKB. Both can have the same envelope.'],
      after:'We have storage and tile delivery. Now distinguish the network services clients can request.'
    },
    {
      id:'services',title:'Ask for pictures, features or coverage values',short:'OGC services and APIs',
      sources:['4.7','4.7.1','4.7.2','4.7.3'],diagram:'4-7-2',
      before:'Our delivery files serve different access patterns. Network services also expose different kinds of results.',
      purpose:'Build requests from a discovered service contract rather than hard-coded assumptions.',
      steps:[
        ['Choose the kind of result','WMS returns a rendered image for a bbox; WMTS returns an image at a defined tile address. WFS returns vector features and WCS returns coverage values. CSW searches metadata. A map picture can support feature-info queries, but is not a replacement for source geometry or analytical raster values.'],
        ['Discover the contract first','Classic services publish GetCapabilities. OGC APIs expose a landing page, conformance classes and links to collections and API definitions. Check supported layer names, formats, CRS and tile-matrix identifiers. A WMTS matrix identifier need not equal an XYZ zoom number.'],
        ['Follow pages and preserve axes','OGC API Features defaults to CRS84 lon/lat bboxes. Follow rel=next links instead of inventing offsets. Classic WFS and WMS have version-specific parameters and axis rules. The example.org requests in this course are templates, not working municipal endpoints.']
      ],
      takeaway:'Choose the service by the result you need, then discover its actual capabilities.',
      check:['Can we reuse a GeoJSON bbox unchanged for WMS 1.3.0 EPSG:4326?','No. GeoJSON is minLon,minLat,maxLon,maxLat; that WMS request uses minLat,minLon,maxLat,maxLon.'],
      after:'A valid service request still cannot tell us the dataset’s provenance or licence.'
    },
    {
      id:'metadata',title:'Make the dataset discoverable and trustworthy',short:'Metadata and INSPIRE',
      sources:['4.8','4.8.1','4.8.2','4.8.3'],
      before:'A client can fetch the right data. Its user still needs to know where it came from and how it may be used.',
      purpose:'Publish an honest metadata record alongside the derived data.',
      steps:[
        ['Answer the recipient’s questions','Record title, abstract, extent, CRS, dates, lineage, licence and a contact. Lineage connects every output to its source and conversion commands. Update the metadata in the same change as the data.'],
        ['Separate a model from an encoding','ISO 19115 describes geographic metadata concepts. ISO 19139 and ISO 19115-3 provide XML implementations. INSPIRE adds an EU legal and interoperability context; including a few gmd elements does not establish compliance.'],
        ['Validate the claims you make','The downloadable parcels.xml is intentionally abridged. It is XML that can be parsed, not a schema-complete or INSPIRE-conformant record. Use a catalogue editor and the appropriate validator for a real release; keep their reports with the tool versions.']
      ],
      takeaway:'Metadata must describe what was produced and checked, without implying compliance that was not validated.',
      check:['Does a bounding box plus an ISO namespace prove INSPIRE conformity?','No. Required content, codelists, schema validation and the applicable profile must all be assessed.'],
      after:'Finally assemble the files, requests and evidence into one release.'
    },
    {
      id:'release',title:'Ship a package with evidence',short:'Verify the release',
      sources:['3.3','5.7','6.3','6.4','7','8','9','9.1','9.2','9.3','9.4','exercise-5','solution-5'],diagram:'3-3',exercise:5,
      before:'We have a master, delivery formats, service templates and metadata. They now need a reproducible release contract.',
      purpose:'Assemble the five exercises into a package whose claims match its verification evidence.',
      steps:[
        ['Build a traceable directory','Keep vectors, tiles, rasters and metadata in separate folders. Record the exact GDAL and PMTiles versions and commands. Preserve original inputs. The exercise reports should explain the format choice and at least one limitation of every output.'],
        ['Check real outputs, not stand-in fixtures','The note’s sample verifier reads an ASCII source, not the released COG, and computes a theoretical tile cover rather than inspecting an archive. The downloadable verifier checks actual release paths, reads MBTiles or MVT directories, and requires GDAL for raster and FlatGeobuf inspection. PMTiles needs its separate CLI. Missing checks must not be labelled PASS.'],
        ['Make failure useful','Write checks.json and return a non-zero exit code if a required check fails. Compare counts, field names, CRS, bbox, winding, grid and statistics. A passing smoke check is not a guarantee of every format’s conformance, nor proof that placeholder service URLs are deployed.']
      ],
      takeaway:'A release is data plus provenance plus evidence; every unverified claim remains a limitation.',
      check:['May a report call the package fully verified after checking only dem.asc?','No. It must check the released raster, or explicitly state that the COG is unverified.'],
      after:'You have completed Phase 2’s path. Repeat the workflow with a real open dataset, then continue to Phase 3 to automate checked spatial processing.'
    }
  ],
  exercises:[
    {number:1,lesson:'conversion',title:'Inspect, check, and convert vector data',files:['parcels.geojson','check_geojson.py','commands.sh','report_ex1.md'],evidence:'Record all three feature counts, actual Shapefile field names, original and repaired winding results, and three justified format choices.'},
    {number:2,lesson:'tiles',title:'Tile addressing and OGC requests',files:['tilemath.py','tiles_cover.py','tiles.py','requests.txt'],evidence:'Produce eight bbox-cover rows for z10–16, correct XYZ/TMS rows, and five requests with explicit axis conventions.'},
    {number:3,lesson:'rasters',title:'From ASCII grid to verified COG',files:['make_dem.py','commands.sh','raster_report.md'],evidence:'Compare actual GDAL raster facts with the independent DEM statistics. Explicitly remove inherited NoData for the comparison.'},
    {number:4,lesson:'bytes',title:'Read GeoPackage and MVT geometry bytes',files:['gpkg_blob.py','mvt_decode.py','sample_polygon.hex','test_helpers.py'],evidence:'Parse the sample envelope and WKB offset 40; decode the square command stream and show signed area +400.'},
    {number:5,lesson:'release',title:'Build and verify a publishing package',files:['verify_package.py','requests.txt','parcels.xml','release_readme.md'],evidence:'Create the real release files and checks.json. Report failures and limitations honestly; abridged metadata is not an INSPIRE-conformity claim.'}
  ],
  clarifications:{
    '4.1.2':'Projected CRS authority axes are not universally easting,northing. Phase 1’s EPSG:3035 example is northing,easting. Inspect the particular CRS and service contract.',
    '4.2.2':'RFC 8142 GeoJSON Text Sequences use record-separator framing, not simply an arbitrary newline-delimited JSON file. Six decimal places is a reporting choice, not a universal accuracy limit.',
    '4.3.2':'The diagram is schematic: exact IFD reads and tile requests depend on file size and client. Small COGs need not have a particular number of overviews. The COG driver documents PREDICTOR=STANDARD or FLOATING_POINT (or YES for automatic selection), whereas the GTiff driver uses numeric 2 or 3. Check the installed driver and validate the result.',
    '4.4.3':'MVT values are typed in the layer value table and features reference them through tag indexes. The geometry integer lists shown here are command streams, not complete Protocol Buffers tiles.',
    '4.7.2':'Features Part 3 is Filtering (OGC 19-079r2); CQL2 is a separate query-language standard (OGC 21-065r2). Part 1 support alone does not imply these extensions. Discover the server’s queryables, filter encodings and conformance links before using them.',
    '5.1':'The source checker’s main loop only handles Polygon. The conversion promotes our master to MultiPolygon, so use the corrected downloadable checker for both types. This is a limited geometry sanity check, not a full RFC 7946 or topology validator.',
    '5.3':'The downloadable checker handles MultiPolygon output. -makevalid repairs topological validity but is not a general guarantee of the requested ring winding; explicitly rewind or write in RFC 7946 mode and check the result.',
    '5.5':'Eight is the theoretical bbox cover for the supplied extent, not a guaranteed exact GDAL output tile count. Buffering, simplification and clipping settings can change populated tiles. Inspect actual outputs.',
    '5.6':'Keep PREDICTOR=3 for the GTiff Float32 step, but use the COG driver’s documented PREDICTOR=FLOATING_POINT for the COG step. The downloadable commands distinguish these driver options. Values and output layout still require inspection with the installed GDAL version.',
    'exercise-3':'The ASCII input already declares NODATA_value. Omitting -a_nodata generally inherits it. Use -a_nodata none to create the intended broken comparison. The checked command download includes this correction.',
    'solution-3':'Correct the comparison command with -a_nodata none; otherwise the source NoData can survive. Removing it is an experiment only: keep -9999 declared in the real release. For COG creation use its documented PREDICTOR=FLOATING_POINT rather than the GTiff driver’s numeric PREDICTOR=3.',
    'solution-4':'The source parser and MVT decoder are minimal teaching examples without complete malformed-input checks. Downloaded helpers add bounds, flags, command and parameter checks; they still are not full file-format validators.',
    'exercise-5':'Use the corrected verifier and release layout from the downloads. The source example’s current-directory paths do not match its release tree, and checking dem.asc alone cannot certify the released COG.',
    'solution-5':'The source verifier was run on hand-built fixtures, not a complete GDAL-produced release. Its tile check computes expected addresses and its raster check reads the source ASCII grid. The download checks real release artifacts and requires GDAL; metadata remains explicitly abridged.'
  }
};
