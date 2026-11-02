/* Original explanations and practice, mapped to the supplied study note. */
const choice = (prompt, options, answer, explanation, hint, level = 'Recall') => ({ type: 'choice', prompt, options, answer, explanation, hint, level });
const numeric = (prompt, answer, tolerance, unit, explanation, hint, level = 'Apply') => ({ type: 'number', prompt, answer, tolerance, unit, explanation, hint, level });
const task = (title, prompt, rubric) => ({ title, prompt, rubric });

const TOPICS = [
  {
    id: 'earth', title: 'Earth, ellipsoids & datums', short: 'Modelling the Earth', group: '01 · Locate', time: 20, level: 'Foundation',
    summary: 'Before you can put a pin on a map, you need a model of the planet.',
    analogy: 'An ellipsoid is a smooth mannequin. A datum tells you exactly where to stand it, how to rotate it, and what size it is. The actual Earth is the irregular clothing over it.',
    goals: ['Separate the terrain, geoid and ellipsoid.', 'Explain why the same place can have different coordinates in two datums.'],
    sections: [
      ['Three surfaces, three jobs', '<b>Terrain</b> is the bumpy ground. The <b>geoid</b> is a gravity-based surface close to mean sea level; use it to talk about heights above sea level. An <b>ellipsoid</b> is a smooth, slightly squashed sphere that makes coordinate calculations manageable. GPS ellipsoidal height is not automatically height above sea level.'],
      ['A datum anchors the model', 'A datum ties an ellipsoid to the real Earth with an origin, orientation and scale. Modern reference frames may also need a date, called a <b>coordinate epoch</b>. WGS 84 is global; ETRS89 follows the stable Eurasian plate; NAD83 is tied to North America. Two datums can use almost identical ellipsoids and still disagree by metres.'],
      ['Why developers notice', 'A metre is irrelevant on a world overview but matters for a property boundary or buried pipe. The WGS 84 ellipsoid has a semi-major axis of 6,378,137 m. That number describes the model, not the accuracy of a GPS fix.']
    ],
    lab: ['A moving reference frame', 'Predict first: how far would 2.5 cm of plate motion per year accumulate in 40 years? Then move the slider.', 'Exaggerated schematic: movement is shown for intuition, not as an actual WGS 84–ETRS89 transformation.'],
    code: 'from pyproj import CRS\ncrs = CRS.from_epsg(4326)\nprint(crs.datum)\nprint(crs.ellipsoid.semi_major_metre)  # 6378137.0',
    trap: 'Similar ellipsoid ≠ same datum. More coordinate digits do not fix a datum mismatch.', reference: '2.1, 3.1, 4.3', links: [['PROJ: geodetic concepts', 'https://proj.org/en/stable/usage/transformation.html']],
    exercises: [
      choice('Which surface best supports heights above mean sea level?', ['Reference ellipsoid', 'Geoid', 'Map tile'], 1, 'The geoid is the gravity-based reference for orthometric heights.', 'Think gravity, not a smooth geometric formula.'),
      choice('Can two datums use the same ellipsoid but give different coordinates?', ['Yes', 'No'], 0, 'Their anchoring, orientation or evolution in time can differ.', 'Separate the shape from its placement.'),
      choice('Which model is a smooth oblate spheroid?', ['Terrain', 'Geoid', 'Ellipsoid'], 2, 'An ellipsoid is a flattened sphere defined by a semi-major axis and flattening.', 'Which surface is designed to be easy to calculate with?'),
      numeric('A plate moves 0.025 m/year. How far in 40 years?', 1, .001, 'm', '0.025 × 40 = 1 metre. Small annual changes accumulate.', 'Multiply speed by elapsed time.'),
      choice('Which reference frame is fixed to stable Eurasia?', ['ETRS89', 'NAD83', 'A GeoJSON file'], 0, 'ETRS89 is plate-fixed to stable Eurasia.', 'The E stands for European.'),
      choice('GPS ellipsoidal height is 80 m. Can you label it “80 m above sea level” without checking?', ['Yes, always', 'No, a vertical reference/conversion is needed'], 1, 'The geoid and ellipsoid are different surfaces.', 'Does GPS measure from the geoid?', 'Diagnose'),
      choice('Two parcel layers differ consistently by 1–2 m. What deserves investigation?', ['Datum and selected transformation', 'Only the line colour', 'Only the number of decimals'], 0, 'A missing or approximate datum operation can create metre-level offsets; investigate other causes too.', 'A consistent small offset can be a reference-frame issue.', 'Diagnose'),
      numeric('At 0.03 m/year, how many years produce 0.9 m of movement?', 30, .01, 'years', 'Time = distance / speed = 0.9 / 0.03 = 30.', 'Divide the accumulated movement by annual movement.')
    ],
    tasks: [task('Explain it without GIS jargon', 'Describe terrain, geoid, ellipsoid and datum to a colleague in four sentences.', 'One sentence per concept; distinguish physical ground, gravity reference, smooth shape and Earth anchoring.'), task('Audit a height field', 'Imagine an API returns elevation: 37. List the questions you must ask before using it for flood analysis.', 'Ask about units, vertical datum, ellipsoidal versus orthometric height, accuracy, source and epoch where relevant.')]
  },
  {
    id: 'crs', title: 'CRS & EPSG, without the mystery', short: 'CRS & EPSG codes', group: '01 · Locate', time: 25, level: 'Foundation',
    summary: 'Give coordinates their missing instruction manual: axes, units and reference frame.',
    analogy: 'A coordinate pair is like “meet me at 12”. A CRS adds the address system, units and directions so the numbers become useful.',
    goals: ['Recognise geographic, projected, geocentric and vertical systems.', 'Choose storage, analysis and display CRSs independently.'],
    sections: [
      ['Numbers need context', 'A <b>CRS</b> combines a datum with a coordinate system: its axes, order and units. A projected CRS also has a projection and its parameters. A pair such as (4.9003, 52.3791) is incomplete without that context and an axis convention.'],
      ['The code is a lookup key', '<b>EPSG:4326</b> identifies WGS 84 geographic 2D, in degrees. <b>EPSG:32631</b> is WGS 84 / UTM 31N, in metres. <b>EPSG:3857</b> is Web Mercator, a projected display CRS—not a separate mathematical kind of CRS. EPSG:4978 is geocentric XYZ in metres. Vertical systems describe heights; compound CRSs combine horizontal and vertical references.'],
      ['Choose three systems on purpose', '<div class="table-wrap"><table><tr><th>Job</th><th>Typical choice</th></tr><tr><td>Store / exchange</td><td>4326 or a suitable national CRS</td></tr><tr><td>Measure locally</td><td>Local national grid or appropriate UTM zone</td></tr><tr><td>Compare regional areas</td><td>Equal-area, e.g. 3035 (Europe), 5070 (CONUS)</td></tr><tr><td>Display web tiles</td><td>3857</td></tr></table></div>A metre-based CRS can still distort ground measurements. Units alone do not tell you whether a CRS fits your analysis.']
    ],
    lab: ['One place, different coordinate languages', 'Switch between representations. Notice which parts of the location’s description change.', 'Values are the study note’s rounded Amsterdam reference coordinates, not a live reprojection service.'],
    code: 'from pyproj import CRS\nfor epsg in (4326, 32631, 3857, 3035):\n    c = CRS.from_epsg(epsg)\n    print(c.name, c.is_projected)\n    print([(a.name, a.unit_name) for a in c.axis_info])',
    trap: 'EPSG:4326 is not “any latitude/longitude”. Its datum and authority axis order are specific.', reference: '2.2, 4.2, 8 Solution 1', links: [['EPSG registry', 'https://epsg.org/'], ['pyproj CRS', 'https://pyproj4.github.io/pyproj/stable/api/crs/crs.html']],
    exercises: [
      choice('What are the angular units of EPSG:4326?', ['Metres', 'Degrees', 'Pixels'], 1, '4326 is a geographic CRS with degree units.', 'Latitude and longitude are angles.'),
      choice('Which is suitable for local station measurements around Amsterdam in this course?', ['EPSG:3857', 'EPSG:32631', 'Unlabelled coordinate pairs'], 1, 'UTM 31N is a good local choice for the Dutch station example.', 'The stations are between 0° and 6° E.'),
      choice('Which is a suitable equal-area CRS for Europe?', ['EPSG:3035', 'EPSG:3857', 'EPSG:4326'], 0, '3035 is ETRS89-extended / LAEA Europe.', 'LAEA means Lambert Azimuthal Equal-Area.'),
      choice('A CRS uses metres. Does that guarantee accurate ground distances everywhere?', ['Yes', 'No'], 1, 'Projected metre units do not eliminate projection distortion.', 'Web Mercator uses metres too.', 'Diagnose'),
      choice('Which system has Earth-centred X, Y, Z axes?', ['Geocentric', 'Geographic 2D', 'A page layout'], 0, 'Geocentric coordinates locate positions in 3D relative to the Earth’s centre.', 'Think satellites and three-dimensional positioning.'),
      choice('Which code is the usual web tile display CRS?', ['EPSG:4269', 'EPSG:3857', 'EPSG:26918'], 1, '3857 is WGS 84 / Pseudo-Mercator.', 'Display and measurement are different jobs.'),
      choice('A continental dataset crosses many UTM zones. Best plan?', ['Force everything into zone 31', 'Choose a suitable regional CRS or segment the analysis', 'Remove CRS metadata'], 1, 'UTM is local; distortion grows far from a zone’s central meridian.', 'Fit the CRS to both extent and task.', 'Apply'),
      choice('What should a height field include beyond its numeric value?', ['A vertical reference and units', 'Only a colour', 'Only a horizontal EPSG code'], 0, 'A horizontal CRS alone does not define the meaning of height.', 'Height above which surface?', 'Apply')
    ],
    tasks: [task('Build your CRS cheat sheet', 'Look up 4326, 3857, 32631, 4258, 3035, 4269, 26918 and 5070. Record name, type, units, authority axis order and one use.', '4258 and 4269 are geographic, latitude first. 3035 is northing first. The other projected examples here use easting first. Verify with axis_info, not memory.'), task('Design a mapping API contract', 'Specify storage, analysis and display CRS for a city’s school-access dashboard.', 'Name the region; choose a local analysis CRS; document API axis order and units; do not calculate coverage in 3857.')]
  },
  {
    id: 'axes', title: 'Latitude, longitude & axis order', short: 'Axis order', group: '01 · Locate', time: 20, level: 'Foundation',
    summary: 'Understand how two perfectly valid numbers can put Amsterdam in the ocean.',
    analogy: '“Smith, Alex” and “Alex Smith” name the same person, but the reader needs to know which field comes first. Coordinates have the same problem.',
    goals: ['Use longitude, latitude at GeoJSON and x/y boundaries.', 'Detect swaps with an area of interest, not just range checks.'],
    sections: [
      ['Two conventions coexist', 'The EPSG definition of 4326 lists <b>latitude, longitude</b>. GeoJSON uses <b>longitude, latitude</b>. In PostGIS, ST_MakePoint(x, y) takes longitude then latitude for geographic data. pyproj Transformer follows authority order unless you request <code>always_xy=True</code>.'],
      ['The familiar bug', 'Amsterdam is about <b>4.9003° E, 52.3791° N</b>. Read the same pair backwards and you get 52.3791° E, 4.9003° N, in the Indian Ocean. Both values pass the global latitude/longitude range checks. The expected region—the Netherlands—disambiguates them. If both or neither interpretation fits, refuse to guess.'],
      ['Read the boundary contract', '<div class="table-wrap"><table><tr><th>Context</th><th>Order</th></tr><tr><td>GeoJSON / CRS84 / WMS 1.1.1 (4326)</td><td>lon, lat</td></tr><tr><td>EPSG:4326 / WMS 1.3.0 (4326)</td><td>lat, lon</td></tr><tr><td>pyproj always_xy=True / QGIS internal x/y</td><td>lon, lat</td></tr><tr><td>EPSG:3035 authority axes</td><td>northing, easting</td></tr></table></div>Do not assume projected always means easting first. Inspect axis_info for every unfamiliar CRS.']
    ],
    lab: ['The 5,000 km typo', 'Toggle the coordinate interpretation. Read the axes and the location label, not just the colour of the pin.', 'Longitude/latitude plot with schematic region markers; it is not a detailed basemap.'],
    code: 'from pyproj import Transformer\nto_utm = Transformer.from_crs(4326, 32631, always_xy=True)\neasting, northing = to_utm.transform(4.9003, 52.3791)\n# GeoJSON: "coordinates": [4.9003, 52.3791]',
    trap: 'A range check accepts the swapped Amsterdam pair. Use an expected area and a known control point.', reference: '2.3, 5.1–5.4, Exercise 2', links: [['GeoJSON coordinate rules', 'https://www.rfc-editor.org/rfc/rfc7946#section-3.1.1']],
    exercises: [
      choice('Correct GeoJSON coordinates for Amsterdam?', ['[52.3791, 4.9003]', '[4.9003, 52.3791]'], 1, 'GeoJSON always uses longitude, latitude.', 'x points east; y points north.'),
      choice('EPSG:4326 authority order is…', ['Latitude, longitude', 'Longitude, latitude'], 0, 'The registry’s axis order is latitude then longitude.', 'Do not confuse the authority with GeoJSON.'),
      choice('Why does a global range check miss the Amsterdam swap?', ['Both values fit both axis ranges', 'The values contain too many decimals', 'The Earth is flat'], 0, '4.9 and 52.4 are both valid latitudes and longitudes.', 'Check each number against ±90 and ±180.', 'Diagnose'),
      choice('Both axis interpretations fit your AOI. What should your resolver do?', ['Pick the first', 'Raise an ambiguity error', 'Average the candidates'], 1, 'There is not enough evidence. Ask for metadata rather than silently corrupting data.', 'An AOI is evidence, not a universal solution.', 'Apply'),
      choice('Which pyproj option makes Transformer use conventional x/y order?', ['always_xy=True', 'latitude_first=False in every library', 'EPSG=None'], 0, 'always_xy=True normalises input/output to traditional GIS x/y order.', 'It is shown in the code example.'),
      choice('WMS 1.3.0 with CRS=EPSG:4326 expects BBOX axes in…', ['lon, lat', 'lat, lon'], 1, 'WMS 1.3.0 follows the authority definition for 4326; CRS:84 uses lon, lat.', 'The protocol version matters.', 'Apply'),
      choice('EPSG:3035 authority axis order is…', ['Easting, northing', 'Northing, easting'], 1, '3035 is a useful counterexample to the easting-first assumption.', 'Read axis_info for an unfamiliar CRS.'),
      choice('Does swapping axes by itself change the datum?', ['Yes', 'No'], 1, 'Reordering numbers is not a datum change or map projection.', 'Same place, same reference, different field order.')
    ],
    tasks: [task('Write the resolver', 'Implement resolve_axis_order(first, second, aoi). Try Dutch, ambiguous and impossible cases using stations_mixed.csv from the downloads.', 'Test both candidates independently. Exactly one must fit. (10,20) in a 0–60 / 0–60 box is ambiguous; (100,100) does not fit the Netherlands.'), task('Catch a regression', 'Write three tests for an API returning GeoJSON station points.', 'Assert lon/lat order, the Dutch AOI and a known station coordinate within tolerance. Range checks alone are insufficient.')]
  },
  {
    id: 'projections', title: 'Flattening Earth, choosing trade-offs', short: 'Map projections', group: '01 · Locate', time: 25, level: 'Foundation',
    summary: 'Every flat map makes a compromise. Pick the one your analysis can afford.',
    analogy: 'Try flattening an orange peel without tearing or stretching it. A projection is a precise rule for deciding where that stretching happens.',
    goals: ['Distinguish conformal, equal-area and equidistant.', 'Explain Web Mercator inflation and select a UTM zone.'],
    sections: [
      ['Preserve what matters', '<b>Conformal</b> projections preserve local angles; <b>equal-area</b> preserve area; <b>equidistant</b> preserve distances only along particular lines or from particular points. Compromise projections balance appearance without preserving one property exactly. No flat world map preserves everything.'],
      ['Web Mercator is for display', 'EPSG:3857 is convenient for tiles but stretches high latitudes. On a sphere, local length scale is <code>k = 1 / cos(latitude)</code> and area factor is k². At 60°, lengths double and areas quadruple. These factors are approximations relative to the ellipsoid; do not use them as a general correction for arbitrary map measurements.'],
      ['UTM is a local tool', 'UTM has 60 zones, normally 6° wide. Away from special zones: <code>zone = floor((lon + 180) / 6) + 1</code>, with +180° handled as zone 60. WGS 84 north uses 32600 + zone; south uses 32700 + zone. Zone 31 has central meridian 3° E, false easting 500,000 m and central scale 0.9996. Standard UTM covers about 80° S–84° N; Norway and Svalbard have exceptions.']
    ],
    lab: ['Watch distortion grow', 'Before setting latitude to 60°, predict the length and area factors. The left square represents ground; the right shows spherical Mercator scale.', 'Schematic local comparison using sec(latitude), not a full projected world map.'],
    code: 'from pyproj import Transformer\n# A local analysis CRS, not the web display CRS:\nt = Transformer.from_crs(4326, 32631, always_xy=True)\ne, n = t.transform(4.9003, 52.3791)',
    trap: '“Metres” in Web Mercator are coordinate units, not distortion-free ground metres.', reference: '2.2, 4.1–4.2, 5.7', links: [['USGS projection manual', 'https://pubs.usgs.gov/publication/pp1395'], ['PROJ UTM', 'https://proj.org/en/stable/operations/projections/utm.html']],
    exercises: [
      choice('Comparing areas across Europe needs…', ['An equal-area projection', 'Any conformal projection', 'Web Mercator'], 0, 'Use an equal-area projection suitable for the region, such as 3035.', 'Which property must survive flattening?'),
      numeric('At 60° N, spherical Mercator length scale is 1/cos(60°). What is it?', 2, .001, '×', 'cos(60°) = 0.5, so k = 2.', 'Take the reciprocal of 0.5.'),
      numeric('If local length scale is 2, what is the area scale?', 4, .001, '×', 'Area scale is k² = 4.', 'Both dimensions stretch.'),
      numeric('Ignoring special zones, which UTM zone contains longitude 4.9° E?', 31, 0, 'zone', 'floor((4.9 + 180) / 6) + 1 = 31.', 'Zone 31 spans 0°–6° E.'),
      numeric('WGS 84, UTM zone 31, southern hemisphere: what EPSG number?', 32731, 0, 'EPSG', '32700 + 31 = 32731.', 'North is 326xx; south is 327xx.'),
      choice('Does “equidistant” mean every pairwise distance is correct?', ['Yes', 'No'], 1, 'Distance preservation applies only to specified lines or origins.', 'A projection name is not a global guarantee.'),
      choice('At UTM’s central meridian, k=0.9996 means a short projected distance is…', ['Slightly shorter than the ellipsoidal distance', 'Exactly twice as long', 'Measured in degrees'], 0, 'The central scale is slightly less than one.', 'Compare the factor with 1.', 'Apply'),
      choice('Which is appropriate for a world overview whose main goal is balanced appearance?', ['Compromise projection', 'One UTM zone', 'Unlabelled pixels'], 0, 'Robinson and Winkel Tripel are familiar compromise examples.', 'This task is about overview appearance.', 'Apply')
    ],
    tasks: [task('Make a distortion table', 'Use the lab at 0°, 30°, 45°, 60° and 80°. Write length/area factors and explain the pattern.', 'About 1/1, 1.155/1.333, 1.414/2, 2/4, 5.759/33.16. Clearly label spherical approximations.'), task('Choose, then defend', 'Pick CRSs for a local buffer, a European density map and a world web basemap.', 'Appropriate national/UTM for local buffer; equal-area for regional comparison; 3857 for tile display only. State extent and measurement property.')]
  },
  {
    id: 'transformations', title: 'Assign vs. transform', short: 'Reprojection & datums', group: '01 · Locate', time: 25, level: 'Foundation',
    summary: 'Changing a label and changing coordinates are two very different operations.',
    analogy: 'Assigning is putting the right language label on a sentence. Transforming is translating the sentence: the words change, but the meaning stays the same.',
    goals: ['Repair metadata without accidentally moving the data.', 'Inspect PROJ operations, grids and accuracy.'],
    sections: [
      ['Assign: numbers stay', 'If documentation proves (4.9003, 52.3791) is WGS 84 lon/lat but the label is missing, <b>assign 4326</b>. The values do not change. If the existing label is wrong, correct it before transforming. Never guess a source CRS silently.'],
      ['Transform: location stays', 'Once the source is correctly defined, convert it to another CRS. Amsterdam becomes approximately (629345.7, 5804903.4) in UTM 31N. A correct reprojection changes coordinates while preserving the physical place. Assigning 32631 to degree values does not perform that calculation.'],
      ['Not all datum operations are equal', 'PROJ chooses a pipeline from available definitions, area of use and grid files. A <b>ballpark</b> operation is only an approximation with unknown accuracy. A 7-parameter Helmert uses translations, rotations and scale in XYZ. Grid shifts model local variation; time-dependent operations need an epoch. Inspect the description, accuracy and missing grids. Build a transformer once and reuse it for arrays.']
    ],
    lab: ['A label is not a conversion', 'Compare a correct transform with relabelling degrees as metres. Which operation preserves Amsterdam?', 'Reference values rounded from the source note. A wrong assignment is shown as a diagnostic example, not a valid location conversion.'],
    code: 'gdf = gdf.set_crs(4326)  # assign verified source; values unchanged\nprojected = gdf.to_crs(32631)  # transform values\n\n# PostGIS equivalents:\n# ST_SetSRID(geom, 4326)\n# ST_Transform(geom, 32631)',
    trap: 'Enabling network grids may supply a missing operation; it does not guarantee a particular accuracy. Inspect the operation actually chosen.', reference: '3.3–3.4, 4.3, 4.8', links: [['pyproj Transformer', 'https://pyproj4.github.io/pyproj/stable/api/transformer.html'], ['PROJ transformations', 'https://proj.org/en/stable/usage/transformation.html']],
    exercises: [
      choice('Verified WGS 84 data has no CRS metadata. First action?', ['Assign EPSG:4326', 'Transform from an invented source', 'Assign 3857 because the basemap uses it'], 0, 'Assignment labels values that already describe the correct CRS.', 'Repair the missing context before doing arithmetic.', 'Apply'),
      choice('Which PostGIS function changes coordinate values to a target CRS?', ['ST_SetSRID', 'ST_Transform', 'ST_AsText'], 1, 'ST_Transform performs the coordinate operation.', 'Set is metadata; Transform computes.'),
      choice('Assigning EPSG:32631 to (4.9003, 52.3791) does what?', ['Computes UTM', 'Leaves numbers unchanged and mislabels them', 'Fixes axis order'], 1, 'The degree values are incorrectly interpreted as metre coordinates.', 'Assignment does not run a projection.', 'Diagnose'),
      choice('Which preserves a correctly located point when changing CRS?', ['A correct transform', 'An arbitrary reassignment'], 0, 'A correct transform changes the representation, not the real-world point.', 'Think translation versus relabelling.'),
      choice('A required datum grid is missing. What may happen?', ['PROJ may choose a less accurate fallback', 'All results are guaranteed centimetre accurate', 'The datum stops existing'], 0, 'Inspect alternatives and grid availability with TransformerGroup.', 'Available resources influence operation choice.', 'Diagnose'),
      choice('A ballpark operation means…', ['Survey-grade accuracy guaranteed', 'Approximate operation with unknown accuracy'], 1, 'Ballpark does not promise a known metre or centimetre accuracy.', 'The word means approximate.'),
      choice('For 100,000 coordinates, create a Transformer…', ['Once and reuse it, preferably on arrays', 'Once per coordinate'], 0, 'Construction involves database and operation lookup; application is comparatively cheap.', 'Separate setup cost from per-point work.', 'Apply'),
      choice('A time-dependent frame transformation may require…', ['A coordinate epoch', 'A darker line style', 'A smaller PNG'], 0, 'Frame motion depends on the time associated with the coordinates.', 'Plates and reference frames move.')
    ],
    tasks: [task('Translate the operation', 'Write assign and transform equivalents for GeoPandas, PostGIS, ogr2ogr and QGIS.', 'set_crs / to_crs; ST_SetSRID / ST_Transform; -a_srs / -t_srs; Assign projection / Reproject layer. Assignment keeps values.'), task('Inspect a real pipeline', 'Run projinfo -s EPSG:4326 -t EPSG:32631, or inspect a pyproj transformer after using it.', 'Identify axis handling, angular unit conversion and UTM. For a datum-changing pair also record operation accuracy, area of use and any missing grids.')]
  },
  {
    id: 'distances', title: 'Degrees, distances & area', short: 'Distance & area', group: '02 · Analyse', time: 30, level: 'Build skills',
    summary: 'Measure in the right space—and quantify the cost of a shortcut.',
    analogy: 'Longitude lines are slices of an orange. A one-degree slice is wide around the equator and tiny near the tip; degrees are not a universal ruler.',
    goals: ['Compare geodesic, spherical and local planar distance.', 'Understand why a degree square has no fixed area in square metres.'],
    sections: [
      ['Angles are not lengths', 'A degree of latitude is about 111 km. A degree of longitude gets shorter toward the poles: about 111.3 km at the equator and 68.1 km at Amsterdam. Use ellipsoid curvature formulas when precision matters, rather than a single global degrees-to-metres factor.'],
      ['Three valid approaches, different errors', '<b>Haversine</b> assumes a sphere and can err by roughly 0.5%. <b>Ellipsoidal geodesic</b> algorithms, such as Karney in pyproj.Geod, model the ellipsoid. Vincenty is accurate when it converges but can fail for near-antipodal pairs. <b>Planar</b> measurement is fast in a suitable local projected CRS; its error depends on projection scale.'],
      ['A real comparison', '<div class="table-wrap"><table><tr><th>Amsterdam–Utrecht</th><th>Metres</th></tr><tr><td>Ellipsoidal geodesic</td><td>35,283.9</td></tr><tr><td>Haversine</td><td>35,244.9</td></tr><tr><td>UTM 31N planar</td><td>35,278.0</td></tr><tr><td>Web Mercator planar</td><td>57,613.6</td></tr></table></div>The course’s Amsterdam 0.01° × 0.01° cell has ellipsoidal area about 757,739.2 m²; Mercator gives about 2,030,035.4 m². Use geodesic area, an appropriate equal-area CRS or a local projection with a quantified error budget.']
    ],
    lab: ['How long is one degree?', 'Move toward the pole and compare latitude and longitude degree lengths. Predict the ratio before reading it.', 'WGS 84 differential lengths from ellipsoid radii of curvature; these approximate a small one-degree step locally.'],
    code: 'from pyproj import Geod\ngeod = Geod(ellps="WGS84")\n_, _, distance_m = geod.inv(4.9003, 52.3791, 5.1103, 52.0894)\nprint(round(distance_m, 1))  # about 35283.9\n# Geod.inv takes longitude FIRST.',
    trap: 'A planar result in degrees² is not square metres. There is no one constant that converts it everywhere on Earth.', reference: '4.1, 5.5–5.7', links: [['pyproj Geod', 'https://pyproj4.github.io/pyproj/stable/api/geod.html']],
    exercises: [
      numeric('At Amsterdam, 1° longitude ≈ 68096.4 m. How long is 0.001°?', 68.0964, .15, 'm', '68096.4 × 0.001 = 68.0964 m.', 'Multiply the angular difference by the local length per degree.'),
      choice('Which distance method assumes a sphere?', ['Haversine', 'Karney ellipsoidal geodesic', 'Local UTM projection only'], 0, 'The haversine formula here uses a mean spherical Earth radius.', 'The sphere is a useful approximation.'),
      choice('Best robust method for high-accuracy nearly antipodal distances?', ['Vincenty without convergence checks', 'Karney / GeographicLib / pyproj.Geod', 'Euclidean distance on lon/lat'], 1, 'Karney’s method is robust near antipodes where Vincenty can fail.', 'Accuracy is not enough if an iterative method fails to converge.', 'Apply'),
      numeric('Two projected points are (0,0) and (3000,4000) metres. Planar distance?', 5000, .001, 'm', 'sqrt(3000² + 4000²) = 5000.', 'Use the 3–4–5 triangle.'),
      numeric('A 0.01° × 0.01° square has what planar degree-area?', .0001, .00000001, 'degrees²', '0.01 × 0.01 = 0.0001 degrees². This is not a ground area.', 'Multiply the two angular spans.'),
      choice('At higher latitudes, a fixed longitude interval becomes…', ['Shorter on the ground', 'Longer on the ground', 'Exactly unchanged'], 0, 'Meridians converge toward the poles.', 'Think orange slices.'),
      numeric('Web Mercator gives 57613.6 m instead of 35283.9 m. Approximate overstatement?', 63.286, .15, '%', '(57613.6 / 35283.9 − 1) × 100 ≈ 63.3%.', 'Compute relative error, not just the ratio.', 'Diagnose'),
      choice('A good local projected distance differs slightly from geodesic distance. Is that automatically a bug?', ['Yes', 'No, inspect local projection scale and tolerances'], 1, 'Projected distances inherit local scale distortion. The note’s UTM result is about 0.017% short.', 'An appropriate projection is not a perfect flattening.', 'Diagnose')
    ],
    tasks: [task('Reproduce the six pairs', 'Using the four station CSV rows, compute all six pairwise distances geodesically, with haversine, in UTM and in Web Mercator.', 'Amsterdam–Utrecht: 35283.9, 35244.9, 35278.0, 57613.6 m. Report relative errors and verify other pairs against source §5.6.'), task('Test a dangerous shortcut', 'Explain why one degrees²-to-metres² conversion cannot work for both an equatorial cell and an Amsterdam cell.', 'Longitude degree length changes with latitude; identical angular areas cover different ground areas. Quantify using the degree-length lab.')]
  },
  {
    id: 'geometry', title: 'Points, lines, polygons & validity', short: 'Geometry model', group: '02 · Analyse', time: 25, level: 'Build skills',
    summary: 'Learn the shapes GIS software understands—and the rules those shapes must obey.',
    analogy: 'A Point is a pin, a LineString is a thread, and a Polygon is a sheet of paper that can have cut-out holes. Multi-geometries bundle several of the same kind.',
    goals: ['Choose a Simple Features geometry type.', 'Recognise invalid rings and repair them deliberately.'],
    sections: [
      ['The Simple Features vocabulary', '<b>Point</b> is dimension 0. <b>LineString</b> is dimension 1 with at least two positions. <b>Polygon</b> is dimension 2, with an exterior ring and optional holes. A LinearRing is closed and simple; it is a polygon building block, not a standalone GeoJSON type. MultiPoint, MultiLineString and MultiPolygon group one type; GeometryCollection mixes types.'],
      ['What makes a polygon valid?', 'Its rings must close and not self-cross or self-touch. Holes belong inside the shell. Rings must not cross or share segments, and the polygon interior must stay connected. MultiPolygon member interiors must not overlap. These are informal OGC rules; validate with the consumer’s library because dialects differ.'],
      ['Repair is a data decision', 'A self-crossing bow-tie can have signed shoelace area zero even though its two lobes visibly occupy space. make_valid can split it into valid pieces. Inspect the returned type—it might become a MultiPolygon or collection. Do not assume buffer(0) preserves every part. Plain WKT/WKB geometry does not carry a complete CRS; the layer or database column must supply it.']
    ],
    lab: ['Spot the invalid shape', 'Switch geometry examples. Before reading the result, describe its interior and boundary or identify the broken rule.', 'Schematic Simple Features examples; polygon shading uses the even-odd fill rule to show holes.'],
    code: 'from shapely.geometry import Polygon\nfrom shapely.validation import explain_validity, make_valid\nbow = Polygon([(0,0), (2,2), (2,0), (0,2)])\nprint(bow.is_valid, explain_validity(bow))\nfixed = make_valid(bow)\nprint(fixed.geom_type, fixed.area)  # MultiPolygon, 2.0',
    trap: 'An invalid polygon can return an area number. A number is not proof the geometry was meaningful.', reference: '2.4, 3.2, 4.4.5', links: [['Shapely validation', 'https://shapely.readthedocs.io/en/stable/manual.html#diagnostics']],
    exercises: [
      choice('One logical country made of separated islands is naturally a…', ['MultiPolygon', 'LineString', 'MultiPoint only'], 0, 'A MultiPolygon groups separate polygon parts into one logical feature.', 'Same type, multiple parts.'),
      choice('A polygon has one shell and…', ['Exactly one hole', 'Zero or more holes', 'No boundary'], 1, 'Interior rings are optional.', 'A solid square is a valid polygon too.'),
      choice('A Point’s topological dimension is…', ['0', '1', '2'], 0, 'Dimension 0 represents a position with no length or area.', 'A pin does not enclose an area.'),
      choice('A bow-tie ring is invalid because…', ['It has four vertices', 'It intersects itself', 'It has no hole'], 1, 'Non-adjacent edges cross.', 'Look at the centre of the bow-tie.', 'Diagnose'),
      choice('Can a polygon hole lie completely outside its shell?', ['Yes', 'No'], 1, 'A hole must be inside the exterior ring.', 'A hole is removed from the polygon interior.'),
      numeric('Splitting the course’s bow-tie yields two triangles of area 1 each. Total repaired area?', 2, .0001, 'square units', '1 + 1 = 2. Signed cancellation before repair did not mean empty geometry.', 'Add positive areas of the valid pieces.'),
      choice('After make_valid, should you check the returned geometry type?', ['Yes', 'No, it is guaranteed to remain Polygon'], 0, 'Repair can change Polygon to MultiPolygon or another geometry type.', 'A crossing can split a shape into parts.', 'Apply'),
      choice('Which is not a standalone GeoJSON geometry type?', ['Polygon', 'LinearRing', 'MultiLineString'], 1, 'Linear rings appear as polygon coordinate arrays; GeoJSON does not define a LinearRing type.', 'Distinguish the OGC building block from GeoJSON types.')
    ],
    tasks: [task('Make a validity gallery', 'Draw a square with a hole, a bow-tie, a hole outside the shell and two overlapping MultiPolygon members. Label each rule.', 'Only the first is valid as described. Explain self-intersection, hole containment and overlapping interiors.'), task('Validate on ingest', 'Write a small validator that records feature ID, is_valid, reason and repaired geometry type.', 'Keep the original data, log the reason and inspect changes in parts/area. Do not blindly overwrite failed features.')]
  },
  {
    id: 'topology', title: 'Spatial relationships & topology', short: 'Topology & DE-9IM', group: '02 · Analyse', time: 30, level: 'Build skills',
    summary: 'Touching is not overlapping. “Inside” needs a boundary policy.',
    analogy: 'Two rooms can share a wall without sharing floor space. Topology describes that relationship, not the exact colour or shape of the rooms.',
    goals: ['Select intersects, touches, contains, within and covers deliberately.', 'Read a DE-9IM matrix and recognise duplicated-edge problems.'],
    sections: [
      ['Interior, boundary, exterior', 'For a polygon, the interior is its area excluding rings, the boundary is the rings, and the exterior is everything else, including holes. An open line’s boundary is its two endpoints; a closed line’s boundary is empty. A point is its own interior and has an empty boundary.'],
      ['Names are executable policy', '<b>intersects</b> means any shared point, including a border. <b>touches</b> means shared points but disjoint interiors. <b>overlaps</b> for two polygons means shared area without either wholly containing the other. A polygon <b>contains</b> an interior point but not a boundary point; <b>covers</b> includes boundary points. contains is more nuanced for lines/polygons: sharing part of a boundary does not alone make containment false.'],
      ['The 3 × 3 relationship fingerprint', 'DE-9IM intersects A’s interior/boundary/exterior with B’s equivalents. Each cell records F (empty), 0 (point), 1 (line) or 2 (area). Read row by row. Overlapping squares yield <code>212101212</code>; edge-touching squares yield <code>FF2F11212</code>. Simple Features stores neighbouring polygon borders twice: edits can create gaps, slivers and overlaps. Shared-edge models and topology-aware simplification protect boundaries.']
    ],
    lab: ['Move from disjoint to overlap', 'Choose a relationship and explain the first cell: do the two interiors share an area?', 'Exact DE-9IM strings for the displayed square configurations. Matrix rows are A interior/boundary/exterior; columns are B interior/boundary/exterior.'],
    code: 'from shapely.geometry import box, Point\na = box(0, 0, 1, 1); b = box(1, 0, 2, 1)\nprint(a.touches(b), a.overlaps(b))  # True, False\nprint(a.relate(b))  # FF2F11212\np = Point(0, 0.5)\nprint(a.contains(p), a.covers(p))  # False, True',
    trap: 'Using intersects to select “strictly inside” includes neighbours that only touch. Write boundary cases into your tests.', reference: '2.4, 4.4.3–4.4.4', links: [['Shapely predicates', 'https://shapely.readthedocs.io/en/stable/predicates.html']],
    exercises: [
      choice('Two parcels share only an edge. Which is true?', ['touches and intersects', 'overlaps only', 'disjoint'], 0, 'Their boundaries meet but their interiors do not.', 'Shared wall, separate floors.'),
      choice('A point on a polygon boundary is included by…', ['covers', 'contains', 'neither'], 0, 'covers includes a polygon’s boundary points; contains excludes a point lying only on the boundary.', 'Choose an explicit boundary policy.', 'Apply'),
      choice('What does “F” in DE-9IM mean?', ['False / empty intersection', 'A filled polygon', 'A floating-point error'], 0, 'F denotes an empty set intersection.', 'The matrix records intersection dimension or emptiness.'),
      numeric('Two overlapping polygon interiors intersect in which dimension?', 2, 0, 'dimension', 'A shared patch is a two-dimensional area.', 'Point = 0; line = 1; area = 2.'),
      choice('What is the boundary of an open simple LineString?', ['Every vertex', 'Its two endpoints', 'Its entire bounding box'], 1, 'Intermediate vertices belong to the line interior.', 'Boundary means ends, not every coordinate.'),
      choice('Simple Features stores a shared parcel edge…', ['Once globally by default', 'Separately in each feature'], 1, 'Independent coordinate copies can drift apart during editing.', 'The model is not a shared-edge topology.'),
      choice('Best approach for simplifying adjoining administrative polygons?', ['Simplify independently with no checks', 'Topology-aware/shared-edge simplification'], 1, 'It keeps shared boundaries consistent and avoids gaps or overlaps.', 'Protect what the neighbours share.', 'Apply'),
      choice('Does overlaps return true if polygon A is wholly inside polygon B?', ['Yes', 'No'], 1, 'Within/contains express containment; overlaps requires partial overlap without full containment.', 'Intersects is broader than overlaps.', 'Diagnose')
    ],
    tasks: [task('Read the fingerprint', 'For 212101212, explain the first, fifth and ninth cells.', 'IA∩IB is area (2), BA∩BB is points (0), EA∩EB is area (2). State the row/column order.'), task('Boundary-case test suite', 'Create a polygon and points inside, on an edge, on a vertex, outside and inside a hole. Predict contains, covers and intersects.', 'Interior: all true. Edge/vertex: contains false, covers/intersects true. Outside/hole interior: all false. Test before trusting a spatial join.')]
  },
  {
    id: 'algorithms', title: 'Geometry algorithms you can see', short: 'Geometry algorithms', group: '02 · Analyse', time: 35, level: 'Build skills',
    summary: 'Turn cross products, shoelace sums and ray casting into visual intuition.',
    analogy: 'The orientation test asks “left or right of this arrow?” Ray casting asks “how many fences do I cross on the way out?” Shoelace adds signed strips around a boundary.',
    goals: ['Use orientation, signed area and ray casting on simple examples.', 'Understand buffering, simplification tolerances and centroid pitfalls.'],
    sections: [
      ['Which side of the arrow?', '<code>orient(a,b,c) = (bx−ax)(cy−ay) − (by−ay)(cx−ax)</code>. Positive means left, negative right, zero collinear in an ordinary Cartesian y-up system. Segment tests also need collinear bounding-box handling. Checking all non-adjacent edge pairs for a ring takes O(n²); production libraries use more robust strategies.'],
      ['Area and inside tests', 'Shoelace signed area is half the sum of xᵢyᵢ₊₁ − xᵢ₊₁yᵢ. Counter-clockwise rings give positive area in y-up coordinates. Ray casting flips inside/outside at each crossing; odd is inside. A simple implementation may classify boundary points inconsistently—prefer tested predicates for production. A centroid can fall outside a concave polygon, so labels often use representative_point or a pole of inaccessibility.'],
      ['Buffers and simplification', 'A buffer grows a geometry by a distance in its CRS units; simplify removes detail within a tolerance in those same units. <code>buffer(100)</code> in 4326 is 100 degrees, not 100 m. A 64-vertex inscribed point buffer has about 99.839% of the true circle area. More vertices improve approximation at a processing cost. Sutherland–Hodgman clips a polygon against each edge of a convex clipper; it is an educational route to buffer intersection area.']
    ],
    lab: ['A circle made from straight edges', 'Increase the number of vertices. Before changing 8 to 64, predict whether the polygon area grows or shrinks.', 'Regular inscribed polygon; area is computed analytically in a local metre-based plane.'],
    code: 'def signed_area(ring):\n    pairs = zip(ring, ring[1:] + ring[:1])\n    return sum(x1*y2 - x2*y1\n               for (x1,y1),(x2,y2) in pairs) / 2\n\nprint(signed_area([(0,0),(4,0),(4,3),(0,3)]))  # 12',
    trap: 'Shoelace does not validate geometry. Signed cancellation in a bow-tie is not its physical occupied area.', reference: '4.4.1–4.4.6, 4.7.2, Exercise 3', links: [['Shapely constructive operations', 'https://shapely.readthedocs.io/en/stable/constructive.html']],
    exercises: [
      numeric('orient((0,0),(4,0),(1,3)) equals…', 12, .0001, 'cross-product units', '(4−0)(3−0) − (0−0)(1−0) = 12: the point is left.', 'Insert values in the cross-product formula.'),
      numeric('Area of rectangle (0,0),(4,0),(4,3),(0,3)?', 12, .0001, 'square units', 'Width × height = 4 × 3 = 12; shoelace agrees.', 'A rectangle provides an independent check.'),
      choice('Reverse a simple ring’s vertex order. Its signed area…', ['Changes sign', 'Doubles', 'Always becomes zero'], 0, 'Orientation changes; absolute area stays the same.', 'Signed strips reverse direction.'),
      choice('A ray crosses the ring 3 times. For a non-boundary point, it is…', ['Inside', 'Outside'], 0, 'An odd number of crossings means inside.', 'Toggle state at each crossing.'),
      choice('Must a polygon centroid be inside the polygon?', ['Yes', 'No'], 1, 'The U-shape in the source has its centroid in the empty notch.', 'A centre of mass can lie in empty space.'),
      numeric('simplify(0.001) in a metre-based CRS uses what tolerance in millimetres?', 1, .0001, 'mm', '0.001 m = 1 mm.', 'Convert metres to millimetres.'),
      choice('Why is a 64-vertex point buffer slightly smaller than πr²?', ['It is inscribed with straight chords', 'Its CRS is missing by definition', 'All buffers are squares'], 0, 'Chords cut inside the true circular arcs.', 'Look at the gap between polygon and circle.'),
      choice('For an interior label anchor, which method gives the right guarantee?', ['centroid', 'representative_point', 'First exterior vertex'], 1, 'representative_point is on the surface/interior for an ordinary valid polygon; the centroid need not be.', 'Choose an interior-point operation.', 'Apply')
    ],
    tasks: [task('Implement, then cross-check', 'Write orientation, shoelace, point-in-ring and ring-is-simple helpers without a geometry library. Then compare with Shapely.', 'Use square, reversed square, bow-tie and boundary points. Explicitly document unsupported cases and boundary behaviour.'), task('Clip two station buffers', 'Implement convex Sutherland–Hodgman clipping for 64-gons with 15,000 m radius at Rotterdam and Den Haag.', 'Only this station pair overlaps. Expect about 154,326,526 m² (±5,000 m² with rounded coordinates). Compare with the larger circle lens area ~154,930,533 m².')]
  },
  {
    id: 'vector-raster', title: 'Vector objects, raster fields', short: 'Raster vs. vector', group: '03 · Represent', time: 20, level: 'Foundation',
    summary: 'Choose the representation that matches the question, not just the file extension.',
    analogy: 'Vector is a drawing with editable paths. Raster is graph paper with a value in every square. Both can describe the same place, but they answer different questions easily.',
    goals: ['Choose objects versus grids for real datasets.', 'Predict the cost of changing cell size.'],
    sections: [
      ['Objects with attributes', 'Vector stores points, lines and polygons plus fields: a road has a name and speed limit, a parcel has an owner. Storage grows with feature count and coordinate complexity. GeoPackage, GeoJSON, FlatGeobuf and PostGIS are common vector choices. Coordinate detail does not itself imply accurate source measurements.'],
      ['A value at every sampled place', 'Raster stores rows and columns of cells, with one value per band: elevation, temperature, imagery or land-cover classes. Cell size is the ground width of a pixel. <b>Higher resolution means smaller cells.</b> Extent is the grid’s bounding region; NoData means no valid measurement, not zero. GeoTIFF/COG, NetCDF and Zarr are common raster formats.'],
      ['The cost of finer detail', 'For a fixed area, halve cell width and you double rows and columns: four times the cells. Memory is rows × columns × bands × bytes/value. Converting vector to raster samples boundaries onto a grid; converting back does not recover the lost detail. Raster is not only for continuous data: categorical land cover is also a raster.']
    ],
    lab: ['Same feature, different grids', 'Try finer and coarser cells. Which narrow parts survive? Imagine converting the coarse grid back to a smooth outline.', 'Schematic circle rasterised by a cell-centre rule; visual grid units are arbitrary.'],
    code: '# Raster memory, before compression and metadata:\nrows, cols, bands, bytes_per_value = 1000, 1000, 3, 4\nsize_bytes = rows * cols * bands * bytes_per_value\nprint(size_bytes)  # 12000000\n# NumPy arrays use array[row, col], not array[x, y].',
    trap: 'NoData and zero are not interchangeable. Zero rainfall is a measurement; a missing sensor reading is not.', reference: '2.5, 4.5.3', links: [['GDAL raster data model', 'https://gdal.org/en/stable/user/raster_data_model.html']],
    exercises: [
      choice('Named road segments with speed limits are naturally…', ['Vector', 'Only raster'], 0, 'Road objects and attributes fit vector lines.', 'Does the feature have an identity and outline?'),
      choice('A sampled temperature surface is naturally…', ['Raster', 'Only Point geometries'], 0, 'A regular grid supports values across a surface.', 'Ask for a value at every sampled place.'),
      choice('Which has higher spatial resolution?', ['2 m cells', '30 m cells'], 0, 'Smaller cells distinguish finer spatial variation.', 'Higher resolution means a smaller cell-size number.'),
      numeric('Halve raster cell width over the same area. Cell count multiplies by…', 4, 0, '×', '2× rows and 2× columns = 4× cells.', 'Think in two dimensions.'),
      numeric('100 × 200 cells, 1 band, 4 bytes per value: raw bytes?', 80000, 0, 'bytes', '100 × 200 × 1 × 4 = 80,000.', 'Multiply all dimensions and bytes/value.'),
      choice('NoData should mean…', ['Unknown / absent measurement', 'Always zero', 'The smallest valid number'], 0, 'Choose a sentinel that cannot be confused with valid data.', 'Missing and measured zero answer different questions.'),
      choice('Can a raster store categories such as water/forest/urban?', ['Yes', 'No, rasters must be continuous'], 0, 'Land-cover grids are categorical rasters.', 'The grid structure does not dictate measurement type.'),
      choice('After coarse rasterisation then vectorisation, is the original boundary restored?', ['Exactly', 'No, sampling lost detail'], 1, 'Vectorisation traces the sampled cells, not the original unsampled boundary.', 'A conversion cannot invent trustworthy lost detail.', 'Diagnose')
    ],
    tasks: [task('Representation decisions', 'Choose raster or vector for parcel ownership, satellite imagery, a river network, elevation and land cover. Explain each.', 'Parcels and river network: vector. Imagery/elevation: raster. Land cover: either, depending on source and question; categorical raster is valid.'), task('Budget a raster', 'Compute raw float32 memory for 3600 × 3600 cells, then for twice the resolution in each direction.', '51,840,000 bytes ≈49.4 MiB per band; doubling each dimension gives 207,360,000 bytes ≈197.8 MiB, excluding overhead/compression.')]
  },
  {
    id: 'geotransform', title: 'Put the pixel in the right place', short: 'Raster geotransforms', group: '03 · Represent', time: 25, level: 'Build skills',
    summary: 'Connect array rows and columns to real-world coordinates—without half-pixel bugs.',
    analogy: 'A raster is a seating plan. The geotransform tells you where the first seat starts, how far to the next column, and how far down the next row.',
    goals: ['Convert corner and centre coordinates correctly.', 'Explain negative row height and array index order.'],
    sections: [
      ['Six numbers place a grid', '<code>X = GT0 + col·GT1 + row·GT2</code><br><code>Y = GT3 + col·GT4 + row·GT5</code><br>GT0/GT3 locate the upper-left corner. GT1/GT5 describe pixel steps. GT2/GT4 allow rotation or shear. For north-up data, rotation terms are zero, pixel width is positive and pixel height is negative because rows count downward while northing increases upward.'],
      ['Corner versus centre', 'Integer col/row in the affine formula means a <b>cell corner</b>. Add 0.5 to each for the centre. The source grid starts at (570000, 5820000), with 2000 m steps. Cell (0,0) has centre (571000, 5819000). For containing-cell lookup, invert the transform and floor the fractional indices; negative out-of-extent results must be rejected.'],
      ['Two conventions to keep separate', 'Coordinates are (x,y), but array indexing is <code>array[row,col]</code>. GeoTIFF pixel-is-area versus pixel-is-point describes whether values represent cells or sampled nodes. Check producer metadata; GDAL handles GeoTIFF georeferencing conventions, so do not blindly add another half-pixel shift to an already normalised transform.']
    ],
    lab: ['Pick a cell; find its centre', 'Click a cell or use Tab and Enter. Compare the centre with its upper-left corner and predict the next row’s northing.', 'A 6 × 4 window of the source grid in EPSG:32631, with 2,000 m cells. Indices are zero-based.'],
    code: 'GT = (570000, 2000, 0, 5820000, 0, -2000)\ncol, row = 29, 7\nx = GT[0] + (col + 0.5) * GT[1]\ny = GT[3] + (row + 0.5) * GT[5]\nprint(x, y)  # 629000, 5805000\n# Value lookup: population[row, col]',
    trap: 'A half-cell shift here is 1 km. The pixel can look almost right while your zonal totals are wrong.', reference: '4.5.1, Exercise 4', links: [['GDAL geotransform tutorial', 'https://gdal.org/en/stable/tutorials/geotransforms_tut.html']],
    exercises: [
      numeric('With origin x=570000 and width=2000, centre x of col 0?', 571000, .001, 'm', '570000 + (0 + 0.5) × 2000 = 571000.', 'Add half a cell before applying the step.'),
      numeric('With origin y=5820000 and height=−2000, centre y of row 0?', 5819000, .001, 'm', '5820000 + 0.5 × (−2000) = 5819000.', 'Rows go downward: subtract.'),
      choice('Why is GT5 usually negative in a north-up raster?', ['Rows increase southward', 'All valid heights are negative', 'Longitude decreases eastward'], 0, 'Array row numbers increase downward while northing increases upward.', 'Compare screen/array direction with map northing.'),
      choice('To read row 7, column 29 from a NumPy grid, use…', ['grid[29,7]', 'grid[7,29]'], 1, 'Array indexing is row, column.', 'y first in arrays; x first in coordinate pairs.'),
      numeric('Cell width is 2000 m. Corner-to-centre x offset?', 1000, .001, 'm', 'Half of 2000 is 1000.', 'The centre is halfway along each edge.'),
      numeric('Origin x=570000, width=2000. x=629345.7 lies in which column?', 29, 0, 'column', '(629345.7−570000)/2000 = 29.67285; floor gives 29.', 'Find fractional index, then floor.'),
      choice('For a north-up unrotated raster, GT2 and GT4 are…', ['0', 'Always 1', 'The CRS EPSG code'], 0, 'These terms handle rotation/shear; they are zero here.', 'North-up grids do not mix row into x or col into y.'),
      choice('Fractional column is −0.2. Is int() truncation to 0 a safe containing-cell lookup?', ['Yes', 'No: floor gives −1, outside the grid'], 1, 'Truncating negative indices can incorrectly pull outside coordinates into cell 0.', 'Floor and truncation differ for negatives.', 'Diagnose')
    ],
    tasks: [task('Round-trip cells', 'Write cell_to_xy and xy_to_cell. Test (0,0), (29,7), a corner and a point just outside the raster.', 'Centre of (29,7) is (629000,5805000). Reject indices outside width/height. The simplified inverse only works without rotation/shear.'), task('Find the half-pixel bug', 'A colleague maps cell (0,0) to (570000,5820000) and uses it as a centre. Explain and fix the error.', 'They used the corner. Add (0.5,0.5) before applying the affine transform. Do not apply this twice if a library already returns centres.')]
  },
  {
    id: 'resampling', title: 'Resampling without inventing data', short: 'Resampling & NoData', group: '03 · Represent', time: 25, level: 'Build skills',
    summary: 'Changing a raster grid means choosing how its values change, too.',
    analogy: 'Blending paint colours makes sense. Blending identification numbers does not: the average of “forest = 2” and “urban = 3” is not a new land-cover type 2.5.',
    goals: ['Match resampling to categorical or continuous data.', 'Compute a bilinear interpolation and recognise overshoot.'],
    sections: [
      ['Categories need categories', '<b>Nearest neighbour</b> copies an existing value; use it for categorical reprojection. <b>Mode</b> takes the most common category, useful for categorical aggregation. Averaging category IDs invents meaningless codes. Ties in mode require a documented rule.'],
      ['Continuous surfaces can be blended', '<b>Bilinear</b> combines four neighbouring cell centres with nonnegative weights that sum to one. <b>Cubic</b> and larger kernels can look smoother but may overshoot source values. <b>Average</b> is useful for downsampling continuous data. For counts such as population, preserving totals may require sum or an explicitly area-aware redistribution—not an unexamined average.'],
      ['Every warp is another sampling decision', 'Reprojecting a raster resamples it. Avoid repeated round-trips; keep a master in its original CRS. Handle NoData explicitly so missing measurements do not pollute a mean. COG overviews are resampled grids too, so match their method to the data.']
    ],
    lab: ['Bilinear, one weight at a time', 'Move u right and v down between cell-centre values 10, 20, 30 and 40. Predict the result at the exact middle.', 'Continuous example: u and v range from 0 to 1 between four cell centres, not pixel corners.'],
    code: '# Continuous elevation:\n# gdalwarp -t_srs EPSG:32631 -r bilinear dem.tif dem_utm.tif\n# Categorical land cover:\n# gdalwarp -t_srs EPSG:32631 -r near land.tif land_utm.tif\n\nz = (1-u)*(1-v)*10 + u*(1-v)*20 + (1-u)*v*30 + u*v*40',
    trap: 'A smoother-looking map is not necessarily a more truthful map. Upsampling adds pixels, not new observations.', reference: '4.5.2–4.5.3', links: [['GDAL warp', 'https://gdal.org/en/stable/programs/gdalwarp.html']],
    exercises: [
      choice('Reproject categorical land cover using…', ['Bilinear', 'Nearest neighbour', 'Cubic only'], 1, 'Nearest preserves existing category codes.', 'Do not average identifiers.'),
      choice('Downsample categorical data using the most common class with…', ['Mode', 'Average', 'Sum'], 0, 'Mode selects the most frequent category.', 'Which statistic answers “most common”?'),
      numeric('Bilinear result for [[10,20],[30,40]], u=.25, v=.5?', 22.5, .001, 'value', '.375×10 + .125×20 + .375×30 + .125×40 = 22.5.', 'Weights are (1−u)(1−v), u(1−v), (1−u)v, uv.'),
      numeric('Average continuous elevations 10,12,11,13?', 11.5, .001, 'm', '46 / 4 = 11.5 m.', 'Add and divide by four.'),
      choice('What is wrong with land-cover code 2.5 after averaging forest=2 and urban=3?', ['It invents an undefined category', 'It is always more accurate', 'Nothing'], 0, 'The code is an identifier, not a continuous quantity.', 'Can you look up category 2.5?', 'Diagnose'),
      choice('Can cubic interpolation exceed the input value range?', ['Yes', 'No'], 0, 'Some interpolation kernels overshoot.', 'Smoothness and range preservation differ.'),
      numeric('At u=.5, v=.5, how much does each of four bilinear neighbours weigh?', .25, .0001, 'weight', 'Each weight is .5 × .5 = .25.', 'All four neighbours are equally far in this parameter space.'),
      choice('Upsampling 30 m observations to 1 m pixels creates…', ['New independent 1 m observations', 'A finer grid of interpolated/replicated values'], 1, 'Grid resolution changes; underlying source accuracy and observations do not improve.', 'More pixels are not more measurements.', 'Diagnose')
    ],
    tasks: [task('Try the wrong method deliberately', 'Aggregate the source’s 4 × 4 land-cover grid to 2 × 2 with mean and mode. Explain the output.', 'Mean [[1,2.5],[3,2.5]] invents category 2.5. Mode [[1,2],[3,2]] preserves classes.'), task('NoData policy', 'A 2 × 2 elevation block contains 10, 12, 14 and NoData. Propose an averaging policy and test it.', 'A valid-only mean gives 12 from three observations. Treating missing as zero gives 9 and biases the result. State minimum coverage rules.')]
  },
  {
    id: 'precision', title: 'Accuracy is not more decimals', short: 'Accuracy & precision', group: '03 · Represent', time: 30, level: 'Foundation',
    summary: 'Separate what your data stores from what your measurements actually know.',
    analogy: 'A ruler printed with tiny tick marks can still be bent. The ticks are representation precision; being close to the true length is accuracy.',
    goals: ['Distinguish scale, resolution, precision, accuracy and uncertainty.', 'Calculate decimal steps and float32 coordinate limitations.'],
    sections: [
      ['Five different concepts', '<b>Scale</b>: map-to-ground ratio, e.g. 1:25,000. <b>Resolution</b>: the smallest data-model step, such as a 10 m cell. <b>Representation precision</b>: digits stored/reported. <b>Accuracy</b>: closeness to truth. <b>Uncertainty</b>: quantified doubt, e.g. a 95% radius. In measurement science, precision can also describe repeatability; that usage is shown by the cluster spread in the visual below.'],
      ['Meaningful digits, honest claims', 'At Amsterdam, 6 decimal places in latitude is a step of about 0.111 m; longitude is about 0.068 m. A phone fix with several metres of error does not become centimetre-accurate by storing more digits. Retain a lossless master where appropriate and round display/exchange values deliberately. Six decimals is a common GeoJSON choice, not a universal maximum or accuracy guarantee.'],
      ['The numerical floor', 'float64 has about 15–16 significant digits. float32 has about 7. Near easting 629345.7 m, float32 spacing is 0.0625 m; near northing 5804903.4 m it is 0.5 m. Maximum round-to-nearest error is half the spacing. Keep processing coordinates in float64; renderers can subtract a local origin before float32 conversion. A tolerance should fit units and source accuracy, not an arbitrary equality test.'],
      ['Scale does not create detail', 'At 1:25,000, 1 cm represents 250 m; 0.25 mm represents 6.25 m. Zooming to 1:500 does not improve a coarse source. Simplify, merge or omit features for smaller-scale maps. For independent, comparable error measures a root-sum-square budget can be useful; systematic datum offsets need separate investigation.']
    ],
    lab: ['A tight cluster can still miss the truth', 'Change systematic offset and observation spread independently. The centre cross is truth. Then connect this to reporting coordinate digits.', 'Schematic measurements. Spread illustrates repeatability precision; the note’s stored-digit precision is a separate representation choice.'],
    code: 'import math\nprint(math.isclose(629345.7001, 629345.7,\n                   rel_tol=0, abs_tol=0.001))  # 1 mm tolerance\n# Choose tolerances from units, use case and source accuracy.\n# Keep coordinates float64 during processing.',
    trap: 'A coordinate with 10 decimals may be precisely represented but metres away from truth.', reference: '2.6, 4.6, Exercise 1', links: [['GeoJSON precision guidance', 'https://www.rfc-editor.org/rfc/rfc7946#section-11.2']],
    exercises: [
      choice('A phone coordinate has 12 decimals. Its positional accuracy is…', ['Automatically sub-millimetre', 'Determined by the measurement process, not digit count'], 1, 'Digits cannot create accuracy that the sensor did not provide.', 'A bent ruler can have fine tick marks.'),
      numeric('At 1:25000, 1 cm on paper is how many metres?', 250, .001, 'm', '1 × 25000 cm = 25000 cm = 250 m.', 'Convert ground centimetres to metres.'),
      numeric('0.25 mm on a 1:25000 map is how many ground metres?', 6.25, .001, 'm', '.25 × 25000 mm = 6250 mm = 6.25 m.', 'Multiply by scale, then divide by 1000.'),
      numeric('A 6th latitude decimal at Amsterdam: 111274.5 × 10⁻⁶?', .1112745, .002, 'm', 'About 11.1 cm, which is representation step size—not source accuracy.', 'Move the decimal six places.'),
      numeric('float32 northing spacing is .5 m. Maximum round-to-nearest error?', .25, .0001, 'm', 'Half the spacing is .25 m.', 'Nearest rounding is at most halfway between representable values.'),
      numeric('float32 spacing at easting 629345.7 is .0625 m. Maximum rounding error?', .03125, .00001, 'm', '.0625 / 2 = .03125 m, or 3.125 cm.', 'Again, halve the spacing.'),
      choice('A raster has 10 m cells. Is its positional accuracy necessarily 10 m?', ['Yes', 'No'], 1, 'Resolution is not an accuracy claim; georeferencing and source errors may be larger or smaller.', 'Different concepts, different metadata.', 'Diagnose'),
      choice('Best default for processing large projected coordinates?', ['float32 everywhere', 'float64; local-origin conversion for float32 rendering when needed'], 1, 'Large float32 values cannot retain fine coordinate steps.', 'Magnitude affects floating-point spacing.', 'Apply')
    ],
    tasks: [task('Write an honest data label', 'A phone fix is stored at 8 decimals and has about 5 m uncertainty. Write a user-facing coordinate/accuracy label.', 'Report a sensible coordinate rounding, units and source uncertainty separately. Do not imply the final decimal is true. Clarify confidence level if known.'), task('Build an error budget', 'For independent comparable errors of 5 m, 1 m and 6.25 m, estimate combined uncertainty.', 'sqrt(25 + 1 + 39.0625) ≈ 8.07 m. Explain assumptions; a systematic frame offset is not automatically an independent random error.')]
  },
  {
    id: 'cartography', title: 'Make a map that tells the truth', short: 'Cartography & classification', group: '04 · Communicate', time: 35, level: 'Build skills',
    summary: 'Colours, class breaks and labels are analytical choices—not decoration.',
    analogy: 'A map legend is a visual API contract. It tells readers what each colour or symbol means; changing class breaks silently changes the contract.',
    goals: ['Choose visual encodings and classification methods.', 'Use honest choropleths, accessible palettes and interior labels.'],
    sections: [
      ['Match the visual variable', 'Use hue or shape for <b>categories</b>, lightness or size for <b>order/magnitude</b>. Sequential ramps go low-to-high; diverging ramps need a meaningful midpoint such as zero; qualitative palettes separate categories. Avoid rainbow magnitude ramps: perceived lightness is not monotonic. Use contrast and consider colour-vision deficiency.'],
      ['Classes change the story', '<b>Equal interval</b> uses equal-width numeric bins; skew can leave empty classes. <b>Quantile</b> targets equal feature counts but can merge very different values and struggles with ties. <b>Natural breaks</b> minimises within-class variance but changes with the dataset. <b>Standard deviation</b> shows distance from the mean. Fixed domain thresholds enable comparisons across dates. GVF = 1 − within-class SSD / overall SSD compares fit for the same data, not truth or overall map quality.'],
      ['Areas, symbols and labels', 'Choropleths should usually show rates/densities, not raw counts. Counts fit proportional symbols. Put polygon labels at an interior point; a centroid can lie outside. Point labels often start upper-right; line labels follow the curve. Avoid collisions and set priorities. A map needs visual hierarchy: muted basemap, clear theme, readable legend, scale bar, source and projection note. Add north indication when orientation is not obvious.']
    ],
    lab: ['Same data, three stories', 'Switch classifications for 12 synthetic population-density values. Count occupied classes, then compare the breaks and GVF.', 'Schematic equal-size districts; numbers are people/km². Bins use upper-inclusive breaks. Colours are the 4-class ColorBrewer YlGnBu ramp.'],
    code: 'import numpy as np\nv = np.array([120,135,150,160,180,210,250,900,1100,1250,4000,5200])\nequal = np.linspace(v.min(), v.max(), 5)\nquantile = np.quantile(v, np.linspace(0, 1, 5))\n# Natural breaks: Fisher-Jenks; compare source §4.7.1.\n# Keep domain thresholds fixed when comparing multiple dates.',
    trap: 'The highest GVF does not automatically make the best map. The purpose and cross-map comparability matter.', reference: '2.7, 4.7', links: [['ColorBrewer palettes', 'https://colorbrewer2.org/']],
    exercises: [
      choice('Best choropleth variable for population comparison?', ['Raw population count', 'People per km²'], 1, 'A density normalises by area; counts are better encoded as proportional symbols.', 'Large polygons already have greater visual weight.'),
      choice('Land-cover categories need a…', ['Qualitative palette', 'Zero-centred diverging ramp', 'Single sequential ranking always'], 0, 'Distinct category hues avoid implying an arbitrary numeric order.', 'Water is not “less than” forest.'),
      choice('Temperature anomaly around 0 suits a…', ['Diverging ramp', 'Random colour per value', 'Rainbow ramp'], 0, 'Zero is a meaningful centre with opposite directions.', 'Negative and positive have different meanings.'),
      numeric('Equal intervals for min=10, max=90, four classes: class width?', 20, .001, 'units', '(90−10)/4 = 20.', 'Divide range by class count.'),
      choice('Which method targets equal feature counts per class?', ['Quantile', 'Equal interval', 'Natural breaks by definition'], 0, 'Quantiles split by rank, subject to ties and interpolation rules.', 'Think equal counts, not equal numeric widths.'),
      choice('Best for comparing regulated pollution levels across years?', ['Independently recomputed natural breaks', 'Fixed legal/domain thresholds'], 1, 'Fixed breaks preserve the same colour meaning over time.', 'Keep the visual contract stable.', 'Apply'),
      numeric('Within-class SSD=20, overall SSD=100. GVF?', .8, .0001, 'GVF', '1 − 20/100 = .8.', 'Subtract the variance fraction from one.'),
      choice('A U-shaped polygon’s centroid is outside. Best label fix?', ['Use an interior representative point / polylabel', 'Place label outside without checking', 'Delete the polygon'], 0, 'Representative points or pole-of-inaccessibility anchors keep labels inside.', 'Centre of mass is not necessarily a safe label anchor.', 'Diagnose')
    ],
    tasks: [task('Explain three legends', 'Use the lab to compare class counts and explain one misleading impression each classification might create.', 'Equal interval piles 10/12 in the first class. Quantile can merge 250,900,1100. Natural breaks makes outliers separate classes but is dataset-specific.'), task('Map critique', 'Sketch a map with raw-count choropleth, rainbow colours and overlapping labels. Redesign it.', 'Normalise or use proportional symbols, choose a suitable accessible ramp, fix label placement, add legend, scale, source and CRS note. Explain the message.')]
  },
  {
    id: 'formats', title: 'Formats, files & spatial databases', short: 'Formats & PostGIS', group: '04 · Communicate', time: 25, level: 'Build skills',
    summary: 'Choose containers that keep the meaning of your coordinates attached to the data.',
    analogy: 'WKT is a loose ingredient. GeoPackage is a labelled lunchbox. PostGIS is a shared pantry with rules and an index so everyone can find what they need.',
    goals: ['Choose GeoJSON, GeoPackage, COG or a database appropriately.', 'Distinguish PostGIS geometry and geography and preserve metadata.'],
    sections: [
      ['What travels with the coordinates?', '<b>GeoJSON</b> is readable vector text using WGS 84 longitude/latitude; RFC 7946 has no custom crs member. <b>GeoPackage</b> is a SQLite container with layer and CRS metadata. <b>Shapefile</b> is a multi-file format with short field names, sidecar CRS and other limitations; avoid it for new work unless required. <b>FlatGeobuf</b> is a binary vector format supporting indexed streaming/range reads.'],
      ['Raster data on the web', '<b>GeoTIFF</b> embeds georeferencing; <b>COG</b> arranges tiles and reduced-resolution overviews so clients can read relevant bytes with HTTP range requests. Clients do not need to download a huge raster just to draw a small view. Overviews still need the right resampling method.'],
      ['Database semantics matter', 'PostGIS <b>geometry</b> uses planar operations in CRS units; <b>geography</b> supports spheroidal measurements in metres. Enforce a consistent SRID/type with <code>geometry(Point,4326)</code>. Plain WKT/WKB does not embed an SRID; EWKT can prefix it. Spatial indexes accelerate candidate lookup, usually followed by an exact predicate.']
    ],
    lab: ['Keep the CRS with the feature', 'Switch containers and identify where the coordinate meaning is stored. Which formats depend on surrounding metadata?', 'Simplified schemas and snippets for teaching, not complete encoding specifications.'],
    code: 'CREATE TABLE station (name text, geom geometry(Point,4326));\nINSERT INTO station VALUES (\n  \'Amsterdam\', ST_SetSRID(ST_MakePoint(4.9003,52.3791),4326)\n);\n-- Metre-based ellipsoidal distance between geographic points:\n-- ST_Distance(a.geom::geography, b.geom::geography)\nCREATE INDEX station_geom_idx ON station USING gist(geom);',
    trap: 'ST_SetSRID is a label, not a transformation. Casting geometry to geography is not a repair for wrongly labelled coordinates.', reference: '3.5, 4.8, 6.2', links: [['GeoPackage standard', 'https://www.geopackage.org/'], ['PostGIS manual', 'https://postgis.net/docs/'], ['GDAL COG driver', 'https://gdal.org/en/stable/drivers/raster/cog.html']],
    exercises: [
      choice('Recommended general single-file GIS exchange format here?', ['GeoPackage', 'Bare .shp without sidecars', 'PNG screenshot'], 0, 'GeoPackage carries metadata and layers in SQLite.', 'Choose the labelled lunchbox.'),
      choice('RFC 7946 GeoJSON allows arbitrary projected coordinates with a crs member?', ['Yes', 'No'], 1, 'The current standard uses WGS 84 lon/lat and removed the old crs member.', 'Do not confuse older GeoJSON extensions with RFC 7946.'),
      choice('PostGIS geometry distance is normally in…', ['CRS units', 'Always metres', 'Always kilometres'], 0, 'A geographic geometry yields angular planar values, not automatic metre distances.', 'geometry is planar.'),
      choice('PostGIS geography distance is reported in…', ['Metres', 'Pixels', 'Degrees'], 0, 'Geography supports geodetic measurement with metre results.', 'Think ellipsoid, not coordinate-plane units.'),
      choice('Plain WKT POINT(4.9 52.3) contains a complete CRS definition?', ['Yes', 'No'], 1, 'Plain geometry WKT contains coordinates and type, not a complete CRS. CRS WKT is a separate use of WKT.', 'What metadata is missing?'),
      choice('Which Shapefile sidecar usually stores CRS WKT?', ['.prj', '.png', '.css'], 0, 'A missing .prj is a classic metadata-loss problem.', 'Projection information belongs in .prj.'),
      choice('What makes a COG efficient for a small web viewport?', ['Tiling, overviews and HTTP range reads', 'It converts every cell to GeoJSON', 'It removes georeferencing'], 0, 'Read relevant blocks and appropriate-resolution overviews instead of the whole file.', 'Ask which bytes the client actually needs.'),
      choice('Why enforce geometry(Point,4326) on a column?', ['To constrain geometry type and SRID', 'To remove coordinate uncertainty', 'To make all projections equal-area'], 0, 'Schema constraints catch incompatible geometries/SRIDs but do not prove values are correctly labelled.', 'Validation has several layers.', 'Apply')
    ],
    tasks: [task('Design a tiny spatial schema', 'Create a station table with Point/4326 constraint and spatial index. Insert the four stations and compute one geography distance.', 'Use ST_MakePoint(lon,lat), ST_SetSRID and GiST. Amsterdam–Utrecht geography distance ≈35283.9 m.'), task('Pick a delivery format', 'Choose delivery formats for a browser API, a colleague editing offline, and a 20 GB elevation raster on cloud storage.', 'GeoJSON or an appropriate streamed/tiled vector API; GeoPackage for offline editing/exchange; COG for tiled/range-based raster reads. Explain constraints.')]
  },
  {
    id: 'qgis', title: 'QGIS as your visual debugger', short: 'QGIS hands-on', group: '04 · Communicate', time: 60, level: 'Field lab',
    summary: 'See the operations first, then connect each click to the code you will write.',
    analogy: 'QGIS is a debugger for spatial assumptions. The map canvas is your watch window; layer properties expose the values and metadata beneath it.',
    goals: ['Import stations correctly and inspect layer versus project CRS.', 'Reproject, buffer, style and export with reproducible settings.'],
    sections: [
      ['Orient before clicking', 'Install QGIS from the official site. Find Browser, Layers, canvas, Processing Toolbox and Python Console. Import the downloadable stations.csv as delimited text: X=lon, Y=lat, geometry CRS=4326. Add an OpenStreetMap XYZ basemap if available; respect its attribution. Inspect a known point before proceeding.'],
      ['Project CRS is display context', 'Change project CRS between 4326, 3857 and 32631. QGIS transforms layers on the fly for display; it does not rewrite stored coordinates. Export Save Features As… with target 32631 to persist a transformed copy. In the field calculator, inspect $x and $y. Set a measurement ellipsoid deliberately: ellipsoidal measurement can stay near 35.3 km even in a 3857 project.'],
      ['Process, style, explain', 'On the projected station layer, Buffer 15000 m with <b>16 segments per quarter circle</b> to match a 64-gon. Try Check validity, Fix geometries, Dissolve, Clip and Intersection. Warp a raster with a data-appropriate resampling method. For vector values use Graduated styling; for rasters use Singleband pseudocolor (or polygonise cells for vector Graduated styling). Build a layout with legend, scale, source and projection note. UI labels vary by QGIS version.']
    ],
    lab: ['From a GUI action to code', 'Select the action you intend to perform. Say whether stored coordinates change before revealing its code equivalent.', 'Workflow illustrations, not live screenshots. The external QGIS lab must be completed in QGIS; the website does not execute desktop tools.'],
    code: 'from qgis.core import (QgsCoordinateReferenceSystem,\n    QgsCoordinateTransform, QgsPointXY, QgsProject)\nt = QgsCoordinateTransform(QgsCoordinateReferenceSystem("EPSG:4326"),\n    QgsCoordinateReferenceSystem("EPSG:32631"), QgsProject.instance())\np = t.transform(QgsPointXY(4.9003, 52.3791))\nprint(p.x(), p.y())  # about 629345.7, 5804903.4',
    trap: 'The bottom-right CRS indicator describes the project, not necessarily the active layer’s stored coordinates.', reference: '4.9, Exercises 1–4', links: [['QGIS download', 'https://qgis.org/download/'], ['QGIS training manual', 'https://docs.qgis.org/latest/en/docs/training_manual/']],
    exercises: [
      choice('stations.csv has lat and lon columns. Set X to…', ['lat', 'lon'], 1, 'X is longitude; Y is latitude.', 'East/west is horizontal.'),
      choice('Changing project CRS rewrites layer coordinate values?', ['Yes', 'No'], 1, 'On-the-fly reprojection changes display, not the original values.', 'Project and layer are different contexts.'),
      choice('To permanently create a UTM layer, use…', ['Export / Reproject layer with target CRS', 'Only the project CRS selector', 'Only a new label colour'], 0, 'Export/reproject creates transformed data.', 'Persist a copy, not just a different view.'),
      numeric('Buffer radius for the station challenge?', 15000, 0, 'm', 'The service areas use a 15 km straight-line radius.', 'Convert kilometres to metres.'),
      numeric('Segments per quarter circle to produce a 64-vertex buffer?', 16, 0, 'segments', '4 × 16 = 64.', 'QGIS counts segments per quadrant.'),
      choice('Ellipsoidal measure in a 3857 project can still return the correct ~35.3 km?', ['Yes, with the ellipsoid/measurement settings', 'No, every GUI measurement must be planar'], 0, 'QGIS can measure ellipsoidally despite the display CRS.', 'Check the measurement configuration.', 'Diagnose'),
      choice('Where should you inspect a layer’s actual CRS?', ['Layer properties / source information', 'Only the project status indicator', 'Only the north arrow'], 0, 'The layer metadata is distinct from the project display CRS.', 'Inspect the data, not only the view.'),
      choice('Which renderer is appropriate for a numeric raster?', ['Singleband pseudocolor', 'Vector-only Graduated renderer directly on any raster', 'No styling is possible'], 0, 'Raster and vector style interfaces differ. Graduated is for vector attributes.', 'The data model determines the renderer.', 'Apply')
    ],
    tasks: [task('Complete the visual import lab', 'Download stations.csv. Import correctly, re-import swapped, switch project CRS, then export a UTM GeoPackage. Save three captioned screenshots.', 'Correct points in the Netherlands; swapped points in the Indian Ocean. Project switch keeps source values. Export gives Amsterdam ~629345.7,5804903.4 m.'), task('Build a print layout', 'Buffer stations, style the areas, label stations, and create a printable layout. Record processing settings.', 'Use metre-based projected data, 15000 m radius and 16 quadrant segments. Include title, legend, scale, source and CRS. Explain straight-line versus travel-time coverage.')]
  },
  {
    id: 'debugging', title: '“Why is my data over there?”', short: 'Debugging spatial data', group: '05 · Integrate', time: 30, level: 'Field lab',
    summary: 'A repeatable investigation for missing CRS, swapped axes, shifts and bad units.',
    analogy: 'Do not keep turning knobs until the map looks right. Treat it like a bug report: inspect inputs, test one hypothesis, compare with a control point.',
    goals: ['Diagnose placement errors in a consistent order.', 'Build ingest checks and choose performance tools without changing semantics.'],
    sections: [
      ['A practical decision tree', 'Start with source documentation: is CRS declared and credible? Do magnitudes fit degrees versus projected units? Does the point land in the expected area? Test axis swaps without silently accepting ambiguous cases. For a consistent small offset, inspect datum operations, grids and epoch. Finally check feet/metres, mixed CRSs, filters and display transforms. Magnitudes are clues—not proof of a CRS.'],
      ['Validate before analysis', 'Check finite coordinates (not NaN or infinity), valid global ranges, expected AOI, geometry types, validity, empty geometry and attribute plausibility. Preserve originals and log failures. Test holes, shared boundaries, multipart features, duplicate vertices, Z/M, slivers, poles and ±180°. Cut/handle antimeridian crossings deliberately to avoid world-spanning stripes.'],
      ['Make correct workflows fast', 'Use spatial indexes to find bounding-box candidates before exact predicates. Reuse transformers and vectorise operations. For rasters read windows/blocks; for display use simplified copies, tiles and COG overviews, not your analysis master. A faster wrong predicate is still wrong. A GUI that looks right does not prove exported coordinates are right.']
    ],
    lab: ['Pick a symptom; test a hypothesis', 'Choose a bug report. Predict the first evidence to inspect, then compare with the recommended investigation.', 'Diagnostic scenarios; each suggestion is a hypothesis to verify, not a guaranteed root cause.'],
    code: 'import math\ndef valid_lonlat(lon, lat):\n    return (math.isfinite(lon) and math.isfinite(lat)\n            and -180 <= lon <= 180 and -90 <= lat <= 90)\n\n# Then test an expected area, CRS metadata and known control points.\n# Passing a global range check does NOT prove axis order.',
    trap: 'Metadata is evidence, not truth. Conversely, coordinate magnitudes alone do not uniquely identify a CRS.', reference: '3.3, 5, 6.1–6.3', links: [['PROJ FAQ', 'https://proj.org/en/stable/faq.html']],
    exercises: [
      choice('Points intended for Amsterdam land at 52° E, 5° N. First hypothesis?', ['Swapped latitude/longitude', 'Only a colour issue', 'Too many polygon vertices'], 0, 'The values are plausible in both ranges but fit the Dutch AOI only when swapped.', 'Look at where the familiar 52 and 5 went.', 'Diagnose'),
      choice('A phone coordinate buffer(100) covers an enormous region. Likely cause?', ['Degrees used as metres', 'A 100 m buffer is always huge', 'The legend is missing'], 0, 'Planar buffer uses CRS units; geographic degree units are not metres.', 'Inspect units before the algorithm.', 'Diagnose'),
      choice('A raster is shifted by exactly half a cell. Inspect…', ['Corner versus centre convention and georeferencing', 'Only classification colour', 'Only station names'], 0, 'A missing or duplicated half-cell offset is a classic cause.', 'Does the transform already locate corners?', 'Diagnose'),
      choice('A bounding-box index hit proves exact polygon intersection?', ['Yes', 'No, exact predicate may still be needed'], 1, 'Bounding boxes are candidate filters; shapes inside boxes may not meet.', 'A rectangle envelope is not the geometry.', 'Apply'),
      choice('Some rows are degrees and others UTM in one geometry column. Best fix?', ['Enforce consistent CRS and normalise from verified sources', 'Apply one guessed transform to every row', 'Hide bad rows with opacity'], 0, 'Mixed CRSs need source-aware correction, not a single blind operation.', 'One label cannot describe two different systems.', 'Diagnose'),
      choice('A polygon crosses ±180° and renders as a huge stripe. Inspect…', ['Antimeridian handling', 'Only field-name length', 'Only NoData sentinel'], 0, 'Longitude wrapping changes how planar edges are interpreted.', 'The date line is a coordinate discontinuity.', 'Diagnose'),
      choice('Which input should fail finite-coordinate validation?', ['(4.9, 52.3)', '(Infinity, 52.3)', '(0, 0)'], 1, 'Infinity and NaN are not usable finite coordinates. (0,0) is globally valid but may fail your AOI.', 'Global validity and expected region are separate checks.'),
      choice('A global dataset is slow. For display, prefer…', ['Tiles/simplified derived data and spatial filtering', 'Deleting CRS metadata', 'Loading every vertex for every viewport'], 0, 'Reduce transferred/displayed detail while retaining the analysis master.', 'Optimise the view, not the truth.', 'Apply')
    ],
    tasks: [task('Write an ingest checklist', 'List checks for a public API receiving parcel polygons and document what you reject, quarantine or repair.', 'Include declared/plausible CRS, axes, finite/range/AOI, geometry type, validity/emptiness, attributes and boundary edge cases. Preserve originals and log decisions.'), task('Run a failure clinic', 'Create one example each of swapped axes, wrong CRS label, degree buffer and half-pixel shift. Explain the minimal fix.', 'Reorder using evidence; assign verified CRS; transform before buffering or use geography; correctly handle centres/corners. Do not use arbitrary offsets to conceal causes.')]
  },
  {
    id: 'coverage', title: 'The station coverage challenge', short: 'Service-coverage capstone', group: '05 · Integrate', time: 90, level: 'Field lab',
    summary: 'Bring coordinates, geometry, rasters and cartography into one reproducible audit.',
    analogy: 'Four torches illuminate a population grid. Counting each torch’s light separately double-counts people where the beams overlap; the union counts each cell once.',
    goals: ['Calculate per-station, union and overlapping population.', 'Reproduce the four progressive source exercises and explain limitations.'],
    sections: [
      ['The study dataset', 'Use the four Dutch stations in EPSG:32631. The synthetic raster has 45 columns × 40 rows, 2 km cells, origin (570000,5820000). At each cell centre compute <code>round(20 + Σ amp·exp(−d²/(2·8000²)))</code>. Station amplitudes are Amsterdam 900, Utrecht 600, Rotterdam 800 and Den Haag 700. This is invented teaching data, not real Dutch population.'],
      ['A precise counting rule', 'Build 64-vertex buffers of radius 15000 m. Include a cell if its centre is inside the polygon. Sum each zone, then combine masks with logical OR for the union. Sum of zone totals minus the union is excess counting; with these radii only Rotterdam and Den Haag overlap. Other boundary policies, polygon vertex counts or rounded coordinates can alter edge results.'],
      ['Reference checkpoints', '<div class="table-wrap"><table><tr><th>Station</th><th>Cells</th><th>People</th></tr><tr><td>Amsterdam</td><td>179</td><td>79,031</td></tr><tr><td>Utrecht</td><td>178</td><td>53,908</td></tr><tr><td>Rotterdam</td><td>175</td><td>82,813</td></tr><tr><td>Den Haag</td><td>179</td><td>77,700</td></tr><tr><td>Union</td><td>674</td><td>270,955</td></tr></table></div>Whole-raster total: 329481; min/max: 20/919. Covered values span 125–919. Compare equal interval, quantile and natural breaks, then justify a legend. A straight-line buffer is not a road/rail travel-time service area.']
    ],
    lab: ['Explore coverage, not just the answer', 'At 15 km, compare per-station sum with the union. Then vary the radius. What changes first near a cell boundary?', 'Computed synthetic 45 × 40 grid in EPSG:32631, 64-vertex buffers and cell-centre inclusion. The fixed colour ramp is for exploration; source checkpoint values apply at 15 km.'],
    code: '# Given pop and one boolean mask per station:\nstack = np.array(list(masks.values()))\nunion = stack.any(axis=0)\ncount = stack.sum(axis=0)\nunion_people = pop[union].sum()\nzone_sum = sum(pop[m].sum() for m in masks.values())\nexcess = zone_sum - union_people\nassert union_people + excess == zone_sum',
    trap: 'Per-station totals cannot simply be added to report unique people covered. Also, a 15 km Euclidean buffer is not a transport travel-time catchment.', reference: 'Exercises 1–4, Solutions 1–4, Appendix A', links: [['Rasterio writing', 'https://rasterio.readthedocs.io/en/stable/topics/writing.html'], ['QGIS training manual', 'https://docs.qgis.org/latest/en/docs/training_manual/']],
    exercises: [
      numeric('45 columns × 40 rows: total cells?', 1800, 0, 'cells', '45 × 40 = 1800.', 'Multiply grid dimensions.'),
      numeric('Per-station population sum=293452, union=270955. Excess count?', 22497, 0, 'people', '293452 − 270955 = 22497.', 'Subtract the unique total.'),
      numeric('1126 uncovered cells out of 1800. How many covered?', 674, 0, 'cells', '1800 − 1126 = 674.', 'Union and uncovered partition the grid.'),
      choice('Which station pair overlaps with 15 km radius buffers?', ['Amsterdam–Utrecht', 'Rotterdam–Den Haag', 'All six pairs'], 1, 'Only Rotterdam–Den Haag has centre distance less than 30 km.', 'A pair of radius-r circles can meet when d ≤ 2r.'),
      numeric('637 cells covered once and 37 twice. Total mask memberships?', 711, 0, 'memberships', '637 + 2 × 37 = 711; union is 674.', 'Count the double-covered cells twice.'),
      choice('Changing radius from 15 km changes synthetic raster values?', ['Yes, the population field must change', 'No, only coverage masks and totals change'], 1, 'The population field is generated from fixed stations/amplitudes, independent of buffer radius.', 'Separate the population model from the inclusion rule.', 'Apply'),
      choice('Does this analysis establish actual rail accessibility?', ['Yes, straight-line radius is the same as journey time', 'No, network/travel-time analysis is needed'], 1, 'Straight-line service areas ignore network layout, timetables and barriers.', 'Distance and accessibility are different questions.', 'Diagnose'),
      numeric('2000 m × 2000 m cell has what area in km²?', 4, .0001, 'km²', '2 km × 2 km = 4 km².', 'Convert each edge before multiplying.')
    ],
    tasks: [task('Progressive project: exercises 1–3', 'Download the station CSVs. Create crs_notes.md, reproject_stations.py, stations_utm.csv, geometry_toolkit.py and geometry_notes.md. Use the source’s full task descriptions.', 'CRS/axes table correct; resolver rejects ambiguity; Amsterdam UTM within 0.1 m of rounded reference; geodesic Ams–Utr within 0.5 m; valid 64-gons area ~705723410.4 m² and only Rotterdam–Den Haag overlap.'), task('Progressive project: exercise 4', 'Produce service_coverage.py, population.tif, coverage_map.png, coverage.qgz and a one-page coverage_report.md. Reproduce zonal sums and classification in QGIS.', 'Check raster total 329481, union 674 cells / 270955 people, excess 22497. Natural-break edges 125,247,366,502,662,919, GVF ~.956. Include legend, CRS, scale, sources; explain boundary differences and three caveats. QGIS differences above ~5% deserve investigation.')]
  }
];
