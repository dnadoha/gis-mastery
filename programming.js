/* One runnable challenge per chapter, with equivalent Python and Go contracts. */
const Programming = {
  languages: {python:{label:'Python',extension:'py',command:'python3'},go:{label:'Go',extension:'go',command:'go run'}},
  lessons: {
    geometry: {
      title:'Find the neighbourhood’s bounding box',level:'Start',
      prompt:'A bounding box is the smallest axis-aligned rectangle containing all your points. Write bounds(points), returning [minimum x, minimum y, maximum x, maximum y]. Coordinates are local metres. Return None in Python or nil in Go for an empty input. Do not change the input points.',
      criteria:['Handle a single point, negative coordinates and an empty list.','Use all points, not just the first and last.'],
      hint:'Start the four limits at the first point. Walk through the remaining points, updating each minimum and maximum.',
      explanation:'Extrema along each axis define the enclosing rectangle. Initialising at zero would give a wrong box for points entirely on one side of the origin.',
      python:{signature:'def bounds(points):',body:`    if not points:
        return None
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return [min(xs), min(ys), max(xs), max(ys)]`,tests:`check(bounds([[200, 200], [400, 200], [260, 280]]), [200, 200, 400, 280])
check(bounds([[5, 7]]), [5, 7, 5, 7])
check(bounds([[-5, -2], [-1, -8], [-3, -4]]), [-5, -8, -1, -2])
check(bounds([]), None)
points = [[4, 8], [1, 3]]
bounds(points)
check(points, [[4, 8], [1, 3]])`},
      go:{signature:'func bounds(points [][]float64) []float64',body:`	if len(points) == 0 { return nil }
	box := []float64{points[0][0], points[0][1], points[0][0], points[0][1]}
	for _, p := range points {
		box[0] = math.Min(box[0], p[0]); box[1] = math.Min(box[1], p[1])
		box[2] = math.Max(box[2], p[0]); box[3] = math.Max(box[3], p[1])
	}
	return box`,tests:`check(bounds([][]float64{{200,200},{400,200},{260,280}}), []float64{200,200,400,280})
check(bounds([][]float64{{5,7}}), []float64{5,7,5,7})
check(bounds([][]float64{{-5,-2},{-1,-8},{-3,-4}}), []float64{-5,-8,-1,-2})
check(bounds(nil), []float64(nil))
points := [][]float64{{4,8},{1,3}}
bounds(points)
check(points, [][]float64{{4,8},{1,3}})`}
    },
    axes: {
      title:'Resolve swapped coordinate fields',level:'Debug',
      prompt:'An area of interest (AOI) is the region where a point is expected. Given first, second and an AOI [west, south, east, north], test both possible longitude/latitude orders. Return [longitude, latitude] only when exactly one interpretation lies inside the inclusive AOI. Return None/nil when both or neither fit. Inputs are finite numbers and the AOI does not cross the antimeridian.',
      criteria:['Recover both ordinary and swapped Amsterdam coordinates.','Refuse ambiguous inputs, including identical fields; do not guess.'],
      hint:'Build two candidates. Filter each using west ≤ longitude ≤ east and south ≤ latitude ≤ north. Count how many survive.',
      explanation:'Global coordinate ranges miss the Amsterdam swap. Regional evidence can distinguish it, but cannot always select an order.',
      python:{signature:'def resolve_axes(first, second, aoi):',body:`    west, south, east, north = aoi
    candidates = [[first, second], [second, first]]
    valid = [p for p in candidates if west <= p[0] <= east and south <= p[1] <= north]
    return valid[0] if len(valid) == 1 else None`,tests:`aoi = [3, 50, 8, 54]
check(resolve_axes(4.9003, 52.3791, aoi), [4.9003, 52.3791])
check(resolve_axes(52.3791, 4.9003, aoi), [4.9003, 52.3791])
check(resolve_axes(10, 20, [0, 0, 60, 60]), None)
check(resolve_axes(100, 100, aoi), None)
check(resolve_axes(5, 5, [0, 0, 10, 10]), None)
check(resolve_axes(3, 50, aoi), [3, 50])`},
      go:{signature:'func resolveAxes(first, second float64, aoi []float64) []float64',body:`	var valid [][]float64
	for _, p := range [][]float64{{first,second},{second,first}} {
		if aoi[0] <= p[0] && p[0] <= aoi[2] && aoi[1] <= p[1] && p[1] <= aoi[3] { valid = append(valid,p) }
	}
	if len(valid) == 1 { return valid[0] }
	return nil`,tests:`aoi := []float64{3,50,8,54}
check(resolveAxes(4.9003,52.3791,aoi), []float64{4.9003,52.3791})
check(resolveAxes(52.3791,4.9003,aoi), []float64{4.9003,52.3791})
check(resolveAxes(10,20,[]float64{0,0,60,60}), []float64(nil))
check(resolveAxes(100,100,aoi), []float64(nil))
check(resolveAxes(5,5,[]float64{0,0,10,10}), []float64(nil))
check(resolveAxes(3,50,aoi), []float64{3,50})`}
    },
    earth: {
      title:'Convert GPS height to geoid-referenced height',level:'Start',
      prompt:'GPS gives ellipsoidal height h. Geoid undulation N is the signed height of the geoid above the ellipsoid. Implement orthometric_height(h, n) using H = h − N. All values are metres. Use a supplied N; this exercise does not estimate a geoid model.',
      criteria:['Handle positive and negative geoid undulation.','Keep fractional metres and allow negative resulting heights.'],
      hint:'Subtract the signed undulation; subtracting a negative value adds its magnitude.',
      explanation:'h = H + N, so H = h − N. A negative N places the geoid below the ellipsoid; GPS height alone is not height above mean sea level.',
      python:{signature:'def orthometric_height(h, n):',body:'    return h - n',tests:`check(orthometric_height(50, 20), 30)
check(orthometric_height(50, -20), 70)
check(orthometric_height(7.25, 0.5), 6.75)
check(orthometric_height(10, 30), -20)
check(orthometric_height(0, 0), 0)`},
      go:{signature:'func orthometricHeight(h, n float64) float64',body:'\treturn h - n',tests:`check(orthometricHeight(50,20), 30.0)
check(orthometricHeight(50,-20), 70.0)
check(orthometricHeight(7.25,0.5), 6.75)
check(orthometricHeight(10,30), -20.0)
check(orthometricHeight(0,0), 0.0)`}
    },
    crs: {
      title:'Guard a metre-based analysis function',level:'Start',
      prompt:'Before measuring school access, your application has three verified metadata fields: kind, unit and suitable. Write measurement_ready to return true only when kind is "projected", unit is "metre", and suitable is true. The suitability flag means someone has checked this CRS’s region and distortion for the task. Unknown strings must fail this deliberately small API contract.',
      criteria:['Reject geographic degrees, missing metadata and unsuitable projected systems.','Do not accept Web Mercator just because its unit is metre.'],
      hint:'All three conditions must hold together; use and in Python or && in Go.',
      explanation:'A unit label alone cannot establish suitability. This guard consumes an explicit suitability decision; it does not infer one from an EPSG number.',
      python:{signature:'def measurement_ready(kind, unit, suitable):',body:'    return kind == "projected" and unit == "metre" and suitable',tests:`check(measurement_ready("projected", "metre", True), True)
check(measurement_ready("geographic", "degree", True), False)
check(measurement_ready("projected", "metre", False), False)
check(measurement_ready("projected", "foot", True), False)
check(measurement_ready("", "", True), False)`},
      go:{signature:'func measurementReady(kind, unit string, suitable bool) bool',body:'\treturn kind == "projected" && unit == "metre" && suitable',tests:`check(measurementReady("projected","metre",true), true)
check(measurementReady("geographic","degree",true), false)
check(measurementReady("projected","metre",false), false)
check(measurementReady("projected","foot",true), false)
check(measurementReady("","",true), false)`}
    },
    projections: {
      title:'Choose a UTM zone, including the exceptions',level:'Build',
      prompt:'Return the WGS 84 UTM zone number for finite longitude/latitude values. Use floor((lon + 180) / 6) + 1, with +180° assigned to zone 60. Accept −180 ≤ lon ≤ 180 and −80 ≤ lat < 84; return 0 outside this contract. Norway: 56 ≤ lat < 64 and 3 ≤ lon < 12 uses zone 32. Svalbard: 72 ≤ lat < 84 uses zones 31, 33, 35, 37 for longitude intervals [0,9), [9,21), [21,33), [33,42), respectively.',
      criteria:['Dhaka gives 46 and Amsterdam gives 31.','Handle special zones, exact boundaries and the +180° endpoint.'],
      hint:'Reject out-of-range values first. Check the two special regions before applying the normal formula.',
      explanation:'The ordinary six-degree formula is not sufficient in Norway or Svalbard. Half-open intervals make adjacent boundaries unambiguous.',
      python:{signature:'def utm_zone(lon, lat):',body:`    if not (-180 <= lon <= 180 and -80 <= lat < 84):
        return 0
    if 56 <= lat < 64 and 3 <= lon < 12:
        return 32
    if 72 <= lat < 84 and 0 <= lon < 42:
        for east, zone in [(9, 31), (21, 33), (33, 35), (42, 37)]:
            if lon < east:
                return zone
    return min(60, math.floor((lon + 180) / 6) + 1)`,tests:`check(utm_zone(90.4125, 23.8103), 46)
check(utm_zone(4.9003, 52.3791), 31)
check(utm_zone(180, 0), 60)
check(utm_zone(-180, 0), 1)
check(utm_zone(3, 56), 32)
check(utm_zone(3, 64), 31)
for lon, zone in [(0,31), (9,33), (21,35), (33,37), (42,38)]:
    check(utm_zone(lon, 75), zone)
check(utm_zone(0, 84), 0)
check(utm_zone(181, 0), 0)
check(utm_zone(0, -80), 31)`},
      go:{signature:'func utmZone(lon, lat float64) int',body:`	if !(lon >= -180 && lon <= 180 && lat >= -80 && lat < 84) { return 0 }
	if lat >= 56 && lat < 64 && lon >= 3 && lon < 12 { return 32 }
	if lat >= 72 && lat < 84 && lon >= 0 && lon < 42 {
		for i, east := range []float64{9,21,33,42} { if lon < east { return 31 + 2*i } }
	}
	return int(math.Min(60, math.Floor((lon+180)/6)+1))`,tests:`check(utmZone(90.4125,23.8103), 46)
check(utmZone(4.9003,52.3791), 31)
check(utmZone(180,0), 60)
check(utmZone(-180,0), 1)
check(utmZone(3,56), 32)
check(utmZone(3,64), 31)
for i, lon := range []float64{0,9,21,33,42} { check(utmZone(lon,75), []int{31,33,35,37,38}[i]) }
check(utmZone(0,84), 0)
check(utmZone(181,0), 0)
check(utmZone(0,-80), 31)`}
    },
    transformations: {
      title:'Transform a local drawing’s coordinates',level:'Build',
      prompt:'Implement a two-dimensional similarity transform: rotate a point anticlockwise by angle_deg, multiply both axes by scale, then add dx and dy. Return the new [x, y]. Use x′ = scale × (x cos θ − y sin θ) + dx and y′ = scale × (x sin θ + y cos θ) + dy. This is a local drawing exercise, not a geodetic datum transformation. Inputs are finite.',
      criteria:['Rotate about the origin before applying the translation.','Convert degrees to radians and leave the input point unchanged.'],
      hint:'Save the original x and y before calculating either new component. Python and Go trigonometry functions take radians.',
      explanation:'A transformation calculates new numbers. A metadata reassignment would leave the numbers alone. Translation and rotation order matters.',
      python:{signature:'def transform_point(point, angle_deg, scale, dx, dy):',body:`    x, y = point
    theta = math.radians(angle_deg)
    c, s = math.cos(theta), math.sin(theta)
    return [scale * (x*c - y*s) + dx, scale * (x*s + y*c) + dy]`,tests:`check(transform_point([200,200], 0, 1, 0, 0), [200,200])
check(transform_point([1,0], 90, 1, 0, 0), [0,1])
check(transform_point([1,2], 90, 2, 100, 200), [96,202])
check(transform_point([0,1], -90, 1, 0, 0), [1,0])
p = [1,2]
transform_point(p, 45, 3, 10, 20)
check(p, [1,2])`},
      go:{signature:'func transformPoint(point []float64, angleDeg, scale, dx, dy float64) []float64',body:`	x, y := point[0], point[1]
	theta := angleDeg * math.Pi / 180
	c, s := math.Cos(theta), math.Sin(theta)
	return []float64{scale*(x*c-y*s)+dx, scale*(x*s+y*c)+dy}`,tests:`check(transformPoint([]float64{200,200},0,1,0,0), []float64{200,200})
check(transformPoint([]float64{1,0},90,1,0,0), []float64{0,1})
check(transformPoint([]float64{1,2},90,2,100,200), []float64{96,202})
check(transformPoint([]float64{0,1},-90,1,0,0), []float64{1,0})
p := []float64{1,2}
transformPoint(p,45,3,10,20)
check(p, []float64{1,2})`}
    },
    distances: {
      title:'Measure home-to-school distance',level:'Start',
      prompt:'Write distance(a, b) for two [x, y] points in our local metre grid. Return their straight-line distance using sqrt((bx−ax)² + (by−ay)²). This measures a straight line, not a route along roads. Assume finite coordinates; do not pass longitude/latitude to this function.',
      criteria:['Return zero for identical points and the same result in either direction.','Keep fractional distances instead of rounding inside the function.'],
      hint:'math.hypot in Python and math.Hypot in Go combine the two coordinate differences.',
      explanation:'Home 1 is 60 m east and 80 m north of School A: its straight-line distance is 100 m. The local metre grid makes the units of the result explicit.',
      python:{signature:'def distance(a, b):',body:'    return math.hypot(b[0] - a[0], b[1] - a[1])',tests:`check(distance([260,280], [200,200]), 100)
check(distance([200,200], [260,280]), 100)
check(distance([0,0], [3000,4000]), 5000)
check(distance([-1,-1], [-1,-1]), 0)
check(distance([0,0], [1,1]), math.sqrt(2))`},
      go:{signature:'func distance(a, b []float64) float64',body:'\treturn math.Hypot(b[0]-a[0], b[1]-a[1])',tests:`check(distance([]float64{260,280},[]float64{200,200}), 100.0)
check(distance([]float64{200,200},[]float64{260,280}), 100.0)
check(distance([]float64{0,0},[]float64{3000,4000}), 5000.0)
check(distance([]float64{-1,-1},[]float64{-1,-1}), 0.0)
check(distance([]float64{0,0},[]float64{1,1}), math.Sqrt(2))`}
    },
    precision: {
      title:'Compare positions using a distance tolerance',level:'Debug',
      prompt:'Implement within_tolerance(a, b, tolerance) for local metre coordinates. Return true when the Euclidean separation is at most tolerance. Return false for a negative tolerance. Assume finite inputs. The tolerance is a rule for comparison, not a claim about the survey’s accuracy.',
      criteria:['Use a circular distance limit, not separate x and y limits.','Accept an exact-boundary case and reject a point just beyond it.'],
      hint:'Calculate the two-dimensional distance first. Two offsets of 0.8 m each do not fit inside a 1 m radius.',
      explanation:'Independent per-axis checks form a square, accepting some points farther away than the intended radius. A distance check gives the specified circular tolerance.',
      python:{signature:'def within_tolerance(a, b, tolerance):',body:'    return tolerance >= 0 and math.hypot(a[0]-b[0], a[1]-b[1]) <= tolerance',tests:`check(within_tolerance([0,0], [0.6,0.8], 1), True)
check(within_tolerance([0,0], [0.8,0.8], 1), False)
check(within_tolerance([0,0], [1.001,0], 1), False)
check(within_tolerance([200,200], [200,200], 0), True)
check(within_tolerance([0,0], [0,0], -1), False)`},
      go:{signature:'func withinTolerance(a, b []float64, tolerance float64) bool',body:'\treturn tolerance >= 0 && math.Hypot(a[0]-b[0],a[1]-b[1]) <= tolerance',tests:`check(withinTolerance([]float64{0,0},[]float64{0.6,0.8},1), true)
check(withinTolerance([]float64{0,0},[]float64{0.8,0.8},1), false)
check(withinTolerance([]float64{0,0},[]float64{1.001,0},1), false)
check(withinTolerance([]float64{200,200},[]float64{200,200},0), true)
check(withinTolerance([]float64{0,0},[]float64{0,0},-1), false)`}
    },
    'vector-raster': {
      title:'Budget raster memory before allocating it',level:'Start',
      prompt:'Write raster_bytes(width, height, bands, bytes_per_sample) to calculate uncompressed pixel storage. Dimensions are nonnegative integers; bands and bytes_per_sample must be positive integers. Return −1 for invalid inputs. A zero width or height is an empty raster and uses zero pixel bytes. Ignore headers, compression, masks and overview images. Go inputs and products fit into int64.',
      criteria:['Multiply all four factors and return bytes, not bits or megabytes.','Doubling width and height must quadruple the pixel-storage estimate.'],
      hint:'One band is one value per cell. Multiply cells by bands by bytes in each value.',
      explanation:'A 1000 × 1000 raster with three 16-bit bands has 6,000,000 pixel bytes. Total file size may differ because file formats add metadata and may compress data.',
      python:{signature:'def raster_bytes(width, height, bands, bytes_per_sample):',body:`    if width < 0 or height < 0 or bands <= 0 or bytes_per_sample <= 0:
        return -1
    return width * height * bands * bytes_per_sample`,tests:`check(raster_bytes(1000,1000,3,2), 6000000)
check(raster_bytes(2000,2000,3,2), 24000000)
check(raster_bytes(6,4,1,4), 96)
check(raster_bytes(0,4,1,4), 0)
check(raster_bytes(-1,4,1,4), -1)
check(raster_bytes(4,4,0,4), -1)
check(raster_bytes(4,4,1,0), -1)`},
      go:{signature:'func rasterBytes(width, height, bands, bytesPerSample int64) int64',body:`	if width < 0 || height < 0 || bands <= 0 || bytesPerSample <= 0 { return -1 }
	return width * height * bands * bytesPerSample`,tests:`check(rasterBytes(1000,1000,3,2), int64(6000000))
check(rasterBytes(2000,2000,3,2), int64(24000000))
check(rasterBytes(6,4,1,4), int64(96))
check(rasterBytes(0,4,1,4), int64(0))
check(rasterBytes(-1,4,1,4), int64(-1))
check(rasterBytes(4,4,0,4), int64(-1))
check(rasterBytes(4,4,1,0), int64(-1))`}
    },
    geotransform: {
      title:'Locate a raster cell’s centre',level:'Build',
      prompt:'Given zero-based col and row plus six GDAL geotransform values gt, return the cell centre [x,y]. Use x = gt[0] + (col+0.5)gt[1] + (row+0.5)gt[2] and y = gt[3] + (col+0.5)gt[4] + (row+0.5)gt[5]. The transform describes cell corners; the half-cell offsets reach the centre. Assume nonnegative indices and exactly six coefficients.',
      criteria:['Handle a north-up grid with negative y pixel size.','Keep both rotation/skew terms; do not assume they are zero.'],
      hint:'Calculate c = col + 0.5 and r = row + 0.5 once, then use both in each equation.',
      explanation:'Our 100 m grid begins at (0,400). Its top-left centre is (50,350), while its bottom-right centre is (550,50). Omitting the half-cell offset locates corners instead.',
      python:{signature:'def cell_centre(col, row, gt):',body:`    c, r = col + 0.5, row + 0.5
    return [gt[0] + c*gt[1] + r*gt[2], gt[3] + c*gt[4] + r*gt[5]]`,tests:`gt = [0,100,0,400,0,-100]
check(cell_centre(0,0,gt), [50,350])
check(cell_centre(5,3,gt), [550,50])
check(cell_centre(0,0,[10,2,1,20,0.5,-2]), [11.5,19.25])
check(cell_centre(2,1,[10,2,1,20,0.5,-2]), [16.5,18.25])`},
      go:{signature:'func cellCentre(col, row int, gt []float64) []float64',body:`	c, r := float64(col)+0.5, float64(row)+0.5
	return []float64{gt[0]+c*gt[1]+r*gt[2], gt[3]+c*gt[4]+r*gt[5]}`,tests:`gt := []float64{0,100,0,400,0,-100}
check(cellCentre(0,0,gt), []float64{50,350})
check(cellCentre(5,3,gt), []float64{550,50})
check(cellCentre(0,0,[]float64{10,2,1,20,0.5,-2}), []float64{11.5,19.25})
check(cellCentre(2,1,[]float64{10,2,1,20,0.5,-2}), []float64{16.5,18.25})`}
    },
    resampling: {
      title:'Coarsen population cells without losing people',level:'Build',
      prompt:'Write block_sum(grid) to combine each non-overlapping 2 × 2 block into one coarse cell. Values are people per cell, so sum the four values. Input is a nonempty rectangular grid with positive even dimensions and no missing values. Return a new grid with half as many rows and columns; preserve the original.',
      criteria:['Use a sum, not an average, for these population counts.','The sum of the output must equal the sum of the input.'],
      hint:'Advance row and column by two. Each output reads grid[row][col], its right neighbour, and the two values below.',
      explanation:'A coarse cell covers four original cells. Population counts add; averaging would lose three quarters of the population. Density values would need a different rule.',
      python:{signature:'def block_sum(grid):',body:`    return [[sum(grid[r+dr][c+dc] for dr in range(2) for dc in range(2))
             for c in range(0, len(grid[0]), 2)]
            for r in range(0, len(grid), 2)]`,tests:`check(block_sum([[1,2],[3,4]]), [[10]])
grid = [[10]*6 for _ in range(4)]
check(block_sum(grid), [[40,40,40],[40,40,40]])
check(sum(map(sum, block_sum(grid))), 240)
check(grid, [[10]*6 for _ in range(4)])
check(block_sum([[0,2,4,6],[1,3,5,7]]), [[6,22]])`},
      go:{signature:'func blockSum(grid [][]float64) [][]float64',body:`	result := make([][]float64,len(grid)/2)
	for r := 0; r < len(grid); r += 2 {
		row := make([]float64,len(grid[0])/2)
		for c := 0; c < len(grid[0]); c += 2 { row[c/2] = grid[r][c]+grid[r][c+1]+grid[r+1][c]+grid[r+1][c+1] }
		result[r/2] = row
	}
	return result`,tests:`check(blockSum([][]float64{{1,2},{3,4}}), [][]float64{{10}})
grid := [][]float64{{10,10,10,10,10,10},{10,10,10,10,10,10},{10,10,10,10,10,10},{10,10,10,10,10,10}}
check(blockSum(grid), [][]float64{{40,40,40},{40,40,40}})
total := 0.0
for _, row := range blockSum(grid) { for _, value := range row { total += value } }
check(total, 240.0)
check(grid[0], []float64{10,10,10,10,10,10})
check(blockSum([][]float64{{0,2,4,6},{1,3,5,7}}), [][]float64{{6,22}})`}
    },
    topology: {
      title:'Distinguish a park’s interior, edge and exterior',level:'Build',
      prompt:'Write box_relation(point, box) for an axis-aligned rectangle [minX,minY,maxX,maxY]. Return "inside", "boundary" or "outside". Corners are on the boundary. Assume a positive-width, positive-height box and finite values. Use exact comparisons for these exact teaching coordinates; this does not implement arbitrary polygon predicates.',
      criteria:['Classify all four edges and corners correctly.','A point aligned with an edge but beyond its endpoints is outside.'],
      hint:'Reject points outside the rectangle first. Only then check whether x or y equals a box limit.',
      explanation:'Boundary is distinct from interior. This is why contains and covers can give different answers for a point on a polygon edge.',
      python:{signature:'def box_relation(point, box):',body:`    x, y = point
    left, bottom, right, top = box
    if x < left or x > right or y < bottom or y > top:
        return "outside"
    if x in (left, right) or y in (bottom, top):
        return "boundary"
    return "inside"`,tests:`box = [0,0,4,3]
check(box_relation([2,1],box), "inside")
for p in [[0,1],[4,1],[2,0],[2,3],[0,0],[4,3]]:
    check(box_relation(p,box), "boundary")
check(box_relation([0,4],box), "outside")
check(box_relation([-0.01,1],box), "outside")`},
      go:{signature:'func boxRelation(point, box []float64) string',body:`	x, y := point[0], point[1]
	if x < box[0] || x > box[2] || y < box[1] || y > box[3] { return "outside" }
	if x == box[0] || x == box[2] || y == box[1] || y == box[3] { return "boundary" }
	return "inside"`,tests:`box := []float64{0,0,4,3}
check(boxRelation([]float64{2,1},box), "inside")
for _, p := range [][]float64{{0,1},{4,1},{2,0},{2,3},{0,0},{4,3}} { check(boxRelation(p,box), "boundary") }
check(boxRelation([]float64{0,4},box), "outside")
check(boxRelation([]float64{-0.01,1},box), "outside")`}
    },
    algorithms: {
      title:'Implement signed polygon area',level:'Build',
      prompt:'Implement signed_area(ring) with the shoelace formula: half the sum of xᵢyᵢ₊₁ − xᵢ₊₁yᵢ, including the last-to-first edge. Return zero for fewer than three points. A repeated closing point is allowed. Counterclockwise rings have positive area. Coordinates are local metres. This calculates algebraic area; it does not validate self-crossing rings.',
      criteria:['A 4 × 3 rectangle has area +12, or −12 when reversed.','Subtract the first vertex from all coordinates during calculation to reduce cancellation at large offsets.'],
      hint:'Use (i+1) modulo the number of vertices for the next point. Shift both points by the same origin before multiplying.',
      explanation:'Signed edge contributions accumulate the enclosed area. A bow-tie can cancel to zero, demonstrating why an area number is not a validity test.',
      python:{signature:'def signed_area(ring):',body:`    if len(ring) < 3:
        return 0.0
    ox, oy = ring[0]
    total = 0.0
    for i, (x, y) in enumerate(ring):
        nx, ny = ring[(i+1) % len(ring)]
        total += (x-ox)*(ny-oy) - (nx-ox)*(y-oy)
    return total / 2`,tests:`ring = [[0,0],[4,0],[4,3],[0,3]]
check(signed_area(ring), 12)
check(signed_area(ring[::-1]), -12)
check(signed_area(ring+[ring[0]]), 12)
check(signed_area([[x+1e9,y+1e9] for x,y in ring]), 12)
check(signed_area([]), 0)
check(signed_area([[0,0],[1,1]]), 0)
check(signed_area([[0,0],[2,2],[2,0],[0,2]]), 0)`},
      go:{signature:'func signedArea(ring [][]float64) float64',body:`	if len(ring) < 3 { return 0 }
	ox, oy := ring[0][0], ring[0][1]
	total := 0.0
	for i, p := range ring {
		q := ring[(i+1)%len(ring)]
		total += (p[0]-ox)*(q[1]-oy) - (q[0]-ox)*(p[1]-oy)
	}
	return total / 2`,tests:`ring := [][]float64{{0,0},{4,0},{4,3},{0,3}}
check(signedArea(ring), 12.0)
check(signedArea([][]float64{{0,3},{4,3},{4,0},{0,0}}), -12.0)
check(signedArea(append(ring,ring[0])), 12.0)
shifted := make([][]float64,len(ring))
for i,p := range ring { shifted[i] = []float64{p[0]+1e9,p[1]+1e9} }
check(signedArea(shifted), 12.0)
check(signedArea(nil), 0.0)
check(signedArea([][]float64{{0,0},{1,1}}), 0.0)
check(signedArea([][]float64{{0,0},{2,2},{2,0},{0,2}}), 0.0)`}
    },
    coverage: {
      title:'Count people near either school exactly once',level:'Build',
      prompt:'Each cell is [centreX, centreY, people]. Schools are [x,y] points. Write covered_population(cells, schools, radius) to sum a cell’s people if its centre is within radius metres of at least one school. Include centres exactly on the radius. Inputs use local metres, nonnegative finite populations and a nonnegative finite radius. Empty inputs return zero.',
      criteria:['The shared 6 × 4 grid totals 240 people; radius 200 selects 200.','Overlapping or duplicate schools must not cause double counting.'],
      hint:'Loop over cells first. Once one school includes the cell, add its population and stop checking schools for that cell.',
      explanation:'The logical union means “at least one”. Summing each school’s population independently counts shared cells more than once. Cell-centre selection is a stated modelling rule, not exact within-cell population allocation.',
      python:{signature:'def covered_population(cells, schools, radius):',body:`    return sum(people for x,y,people in cells
               if any(math.hypot(x-sx,y-sy) <= radius for sx,sy in schools))`,tests:`cells = [[c*100+50,350-r*100,10] for r in range(4) for c in range(6)]
schools = [[200,200],[400,200]]
check(covered_population(cells,schools,200), 200)
check(covered_population(cells,schools+schools,200), 200)
check(covered_population(cells,schools,1000), 240)
check(covered_population([[3,4,7]],[[0,0]],5), 7)
check(covered_population([[3,4,7]],[[0,0]],4.99), 0)
check(covered_population(cells,[],200), 0)
check(covered_population([],schools,200), 0)
check(covered_population([[0,0,8]],[[0,0]],0), 8)`},
      go:{signature:'func coveredPopulation(cells, schools [][]float64, radius float64) float64',body:`	total := 0.0
	for _, cell := range cells {
		for _, school := range schools {
			if math.Hypot(cell[0]-school[0],cell[1]-school[1]) <= radius { total += cell[2]; break }
		}
	}
	return total`,tests:`var cells [][]float64
for r := 0; r < 4; r++ { for c := 0; c < 6; c++ { cells = append(cells,[]float64{float64(c*100+50),float64(350-r*100),10}) } }
schools := [][]float64{{200,200},{400,200}}
check(coveredPopulation(cells,schools,200), 200.0)
check(coveredPopulation(cells,append(schools,schools...),200), 200.0)
check(coveredPopulation(cells,schools,1000), 240.0)
check(coveredPopulation([][]float64{{3,4,7}},[][]float64{{0,0}},5), 7.0)
check(coveredPopulation([][]float64{{3,4,7}},[][]float64{{0,0}},4.99), 0.0)
check(coveredPopulation(cells,nil,200), 0.0)
check(coveredPopulation(nil,schools,200), 0.0)
check(coveredPopulation([][]float64{{0,0,8}},[][]float64{{0,0}},0), 8.0)`}
    },
    cartography: {
      title:'Give class boundaries one consistent meaning',level:'Debug',
      prompt:'Write class_index(value, edges) to return a zero-based colour-class index. For edges [0,10,20], class 0 is [0,10] and class 1 is (10,20]. Thus each internal boundary belongs to the lower class. Return −1 for values outside the range or non-finite values. Edges are finite and strictly increasing with at least two entries.',
      criteria:['Assign each boundary exactly once.','Reject NaN and infinity instead of silently colouring them.'],
      hint:'Check finiteness and the total range, then scan upper edges from left to right until value ≤ upper edge.',
      explanation:'Map colours, legends and class statistics must use the same interval convention. Choosing upper-inclusive bins here matches the technical note’s classification checks.',
      python:{signature:'def class_index(value, edges):',body:`    if not math.isfinite(value) or value < edges[0] or value > edges[-1]:
        return -1
    for i, upper in enumerate(edges[1:]):
        if value <= upper:
            return i`,tests:`edges = [0,10,20]
for value, expected in [(0,0),(10,0),(10.001,1),(20,1),(-1,-1),(21,-1)]:
    check(class_index(value,edges), expected)
check(class_index(float("nan"),edges), -1)
check(class_index(float("inf"),edges), -1)`},
      go:{signature:'func classIndex(value float64, edges []float64) int',body:`	if math.IsNaN(value) || math.IsInf(value,0) || value < edges[0] || value > edges[len(edges)-1] { return -1 }
	for i, upper := range edges[1:] { if value <= upper { return i } }
	return -1`,tests:`edges := []float64{0,10,20}
for i, value := range []float64{0,10,10.001,20,-1,21} { check(classIndex(value,edges), []int{0,0,1,1,-1,-1}[i]) }
check(classIndex(math.NaN(),edges), -1)
check(classIndex(math.Inf(1),edges), -1)`}
    },
    formats: {
      title:'Serialize School A as GeoJSON',level:'Build',
      prompt:'Return a JSON string containing a GeoJSON Feature with properties {"name": name} and a Point geometry whose coordinates are [lon, lat]. Inputs are a string and valid finite WGS 84 longitude/latitude. Use the standard JSON encoder so quotes and Unicode names round-trip correctly. Do not add a legacy "crs" member.',
      criteria:['Use longitude first, even though EPSG authority axes differ.','Produce valid JSON for names containing quotes, newlines or Bangla text.'],
      hint:'Build the object first, then call json.dumps in Python or json.Marshal in Go. Do not concatenate JSON strings by hand.',
      explanation:'GeoJSON fixes geographic coordinates to longitude/latitude and relies on JSON escaping for attributes. Tests decode the string so whitespace and object-key ordering do not matter.',
      python:{signature:'def school_geojson(name, lon, lat):',body:`    return json.dumps({"type": "Feature", "properties": {"name": name},
                       "geometry": {"type": "Point", "coordinates": [lon, lat]}})`,tests:`for name in ["School A", 'School "A"', "বিদ্যালয়", "line\\nbreak"]:
    feature = json.loads(school_geojson(name,90.4125,23.8103))
    check(feature, {"type":"Feature","properties":{"name":name},"geometry":{"type":"Point","coordinates":[90.4125,23.8103]}})
check(json.loads(school_geojson("Zero",0,0))["geometry"]["coordinates"], [0,0])`},
      go:{signature:'func schoolGeoJSON(name string, lon, lat float64) string',body:`	feature := map[string]any{"type":"Feature", "properties":map[string]any{"name":name}, "geometry":map[string]any{"type":"Point","coordinates":[]float64{lon,lat}}}
	data, err := json.Marshal(feature)
	if err != nil { panic(err) }
	return string(data)`,tests:`for _, name := range []string{"School A", "School \\"A\\"", "বিদ্যালয়", "line\\nbreak"} {
	feature := decode(schoolGeoJSON(name,90.4125,23.8103)).(map[string]any)
	check(feature["type"], "Feature")
	check(feature["properties"].(map[string]any)["name"], name)
	check(feature["geometry"], decode("{\\"type\\":\\"Point\\",\\"coordinates\\":[90.4125,23.8103]}"))
	check(len(feature), 3)
}
check(decode(schoolGeoJSON("Zero",0,0)).(map[string]any)["geometry"], decode("{\\"type\\":\\"Point\\",\\"coordinates\\":[0,0]}"))`}
    },
    qgis: {
      title:'Prepare density attributes for QGIS',level:'Build',
      prompt:'Prepare a table that can be exported as CSV for QGIS. Each input cell is [x,y,people] in the local metre grid. Return rows [x,y,people,people_per_km2], using one positive cell_area_m2 for all cells. A square kilometre is 1,000,000 m². Do not mutate inputs; empty input returns an empty list. These local drawing coordinates have no EPSG label: use the documented real CRS when exporting real projected data.',
      criteria:['Ten people in a 100 × 100 m cell means 1000 people/km².','Preserve coordinates and counts while adding the density field.'],
      hint:'Convert square metres to square kilometres by dividing by 1,000,000; then divide population by that area.',
      explanation:'Population is a count; density is a count per area. In QGIS, an exported point layer can use Graduated styling on the density field. CSV does not carry its CRS.',
      python:{signature:'def density_rows(cells, cell_area_m2):',body:'    return [[x,y,people,people * 1000000 / cell_area_m2] for x,y,people in cells]',tests:`cells = [[50,350,10],[150,350,0]]
check(density_rows(cells,10000), [[50,350,10,1000],[150,350,0,0]])
check(density_rows([[0,0,10]],40000), [[0,0,10,250]])
check(density_rows([[0,0,3]],2000000), [[0,0,3,1.5]])
check(density_rows([],10000), [])
check(cells, [[50,350,10],[150,350,0]])`},
      go:{signature:'func densityRows(cells [][]float64, cellAreaM2 float64) [][]float64',body:`	rows := make([][]float64,0,len(cells))
	for _, c := range cells { rows = append(rows,[]float64{c[0],c[1],c[2],c[2]*1000000/cellAreaM2}) }
	return rows`,tests:`cells := [][]float64{{50,350,10},{150,350,0}}
check(densityRows(cells,10000), [][]float64{{50,350,10,1000},{150,350,0,0}})
check(densityRows([][]float64{{0,0,10}},40000), [][]float64{{0,0,10,250}})
check(densityRows([][]float64{{0,0,3}},2000000), [][]float64{{0,0,3,1.5}})
check(densityRows(nil,10000), [][]float64{})
check(cells, [][]float64{{50,350,10},{150,350,0}})`}
    },
    debugging: {
      title:'Audit coordinates before they reach the map',level:'Debug',
      prompt:'Write invalid_points(points, aoi) to return the zero-based indices of suspect [lon,lat] points, in input order. Flag non-finite coordinates, longitude outside ±180°, latitude outside ±90°, or coordinates outside the inclusive AOI [west,south,east,north]. Assume pairs have exactly two numbers and the AOI is valid and does not cross the antimeridian. Report problems without silently swapping or repairing data.',
      criteria:['Catch the swapped Amsterdam point even though it passes global ranges.','Catch NaN and infinity; keep valid boundary points and preserve the input.'],
      hint:'Check finiteness before ranges. Enumerate the input so the report can identify each original row.',
      explanation:'An ingest audit combines numeric checks with regional expectations. It reports evidence for investigation rather than guessing a correction.',
      python:{signature:'def invalid_points(points, aoi):',body:`    west, south, east, north = aoi
    return [i for i,(lon,lat) in enumerate(points)
            if not (math.isfinite(lon) and math.isfinite(lat)
                    and -180 <= lon <= 180 and -90 <= lat <= 90
                    and west <= lon <= east and south <= lat <= north)]`,tests:`aoi = [3,50,8,54]
points = [[4.9003,52.3791],[52.3791,4.9003],[181,52],[4,float("nan")],[3,50],[8,54]]
check(invalid_points(points,aoi), [1,2,3])
check(invalid_points([[float("inf"),52],[4,-91]],aoi), [0,1])
check(invalid_points([],aoi), [])
check(invalid_points([[4,52]],aoi), [])
check(points[1], [52.3791,4.9003])`},
      go:{signature:'func invalidPoints(points [][]float64, aoi []float64) []int',body:`	bad := []int{}
	for i,p := range points {
		lon, lat := p[0], p[1]
		valid := !math.IsNaN(lon) && !math.IsNaN(lat) && !math.IsInf(lon,0) && !math.IsInf(lat,0) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90 && lon >= aoi[0] && lon <= aoi[2] && lat >= aoi[1] && lat <= aoi[3]
		if !valid { bad = append(bad,i) }
	}
	return bad`,tests:`aoi := []float64{3,50,8,54}
points := [][]float64{{4.9003,52.3791},{52.3791,4.9003},{181,52},{4,math.NaN()},{3,50},{8,54}}
check(invalidPoints(points,aoi), []int{1,2,3})
check(invalidPoints([][]float64{{math.Inf(1),52},{4,-91}},aoi), []int{0,1})
check(invalidPoints(nil,aoi), []int{})
check(invalidPoints([][]float64{{4,52}},aoi), []int{})
check(points[1], []float64{52.3791,4.9003})`}
    }
  },
  id(topic) { return `${topic}-coding-v1`; },
  filename(topic,language) { return `${topic.replaceAll('-','_')}.${this.languages[language].extension}`; },
  filepath(topic,language) { return language==='go'?`${topic}/${this.filename(topic,language)}`:this.filename(topic,language); },
  implementation(topic,language,solution=false) {
    const code=this.lessons[topic][language];
    return language==='python'?`${code.signature}\n${solution?code.body:'    # TODO: implement the contract above.\n    raise NotImplementedError("Implement this function")'}\n`:
      `${code.signature} {\n${solution?code.body:'\t// TODO: implement the contract above.\n\tpanic("Implement this function")'}\n}\n`;
  },
  file(topic,language,solution=false) {
    const q=this.lessons[topic],code=q[language],implementation=this.implementation(topic,language,solution);
    if(language==='python')return `# ${q.title}\n# ${q.prompt}\n# Run: python3 ${this.filename(topic,language)}\n# Standard library only. Edit the function; keep and extend the checks below.\nimport math\nimport json\n\n${implementation}\n\n# Comparison helper: numerical tolerance, including nested lists.\ndef equivalent(got, want):\n    if isinstance(got, bool) or isinstance(want, bool):\n        return type(got) is type(want) and got == want\n    if isinstance(got, (int, float)) and isinstance(want, (int, float)):\n        return math.isclose(got, want, rel_tol=1e-9, abs_tol=1e-6)\n    if isinstance(got, list) and isinstance(want, list):\n        return len(got) == len(want) and all(equivalent(a,b) for a,b in zip(got,want))\n    return got == want\n\ndef check(got, want):\n    if not equivalent(got, want):\n        raise AssertionError(f"got {got!r}; expected {want!r}")\n\nif __name__ == "__main__":\n${code.tests.split('\n').map(line=>'    '+line).join('\n')}\n    print("All checks passed")\n`;
    return `// ${q.title}\n// ${q.prompt}\n// Run: go run ${this.filename(topic,language)}\n// Standard library only. Edit the function; keep and extend the checks below.\npackage main\n\nimport (\n\t"encoding/json"\n\t"fmt"\n\t"math"\n\t"reflect"\n)\n\n${implementation}\n// Comparison helpers used by the runnable checks.\nfunc equivalent(got, want any) bool {\n\ta, b := reflect.ValueOf(got), reflect.ValueOf(want)\n\tif !a.IsValid() || !b.IsValid() { return !a.IsValid() && !b.IsValid() }\n\tif a.Type() != b.Type() { return false }\n\tif a.Kind() == reflect.Float64 {\n\t\tx, y := a.Float(), b.Float()\n\t\treturn !math.IsNaN(x) && !math.IsInf(x,0) && math.Abs(x-y) <= math.Max(1e-6,1e-9*math.Max(math.Abs(x),math.Abs(y)))\n\t}\n\tif a.Kind() == reflect.Slice {\n\t\tif a.Len() != b.Len() { return false }\n\t\tfor i:=0; i<a.Len(); i++ { if !equivalent(a.Index(i).Interface(), b.Index(i).Interface()) { return false } }\n\t\treturn true\n\t}\n\treturn reflect.DeepEqual(got,want)\n}\nfunc check(got, want any) {\n\tif !equivalent(got,want) { panic(fmt.Sprintf("got %#v; expected %#v",got,want)) }\n}\nfunc decode(text string) any {\n\tvar value any\n\tif err := json.Unmarshal([]byte(text), &value); err != nil { panic(err) }\n\treturn value\n}\n\nfunc main() {\n${code.tests.split('\n').map(line=>'\t'+line).join('\n')}\n\tfmt.Println("All checks passed")\n}\n`;
  }
};
