/* The first reading is one continuous project. IDs stay stable for saved learner work. */
const Beginner = {
  path: ['geometry','axes','earth','crs','projections','transformations','distances','precision','vector-raster','geotransform','resampling','topology','algorithms','coverage','cartography','formats','qgis','debugging'],
  groups: [
    ['01 · Build our map',4], ['02 · Measure carefully',4], ['03 · Add people to the map',3],
    ['04 · Answer our question',4], ['05 · Save, open and check',3]
  ],
  lessons: {
    geometry: {
      title:'Start with a school, a road and a park', short:'Draw our map',
      summary:'We will build one neighbourhood map and use it to answer one question.',
      before:'This is the beginning. You do not need any map-making knowledge.',
      purpose:'Our question is: how many people live near at least one school? We will use the same invented neighbourhood throughout the guide.',
      steps:[
        ['First, decide what belongs on our map',[
          'Imagine a small neighbourhood near Dhaka. It has two schools, some homes, roads and a park. We will call the schools `School A` and `School B`. These are teaching examples, not real school locations.',
          'Start by drawing School A as a dot. The dot answers one question: where is the school? GIS software calls one stored position a `Point`. GIS means Geographic Information System: tools for working with information about places.'
        ]],
        ['Now add a path and an area',[
          'Draw a line along the road. A stored path made by joining positions in order is called a `LineString`. It tells us where the road goes.',
          'Next, draw around the park and include the land inside its edge. That stored area is called a `Polygon`. Together, the point, line and area are examples of `geometry`: the position or shape we store for an object.'
        ]],
        ['Keep the school’s facts beside its dot',[
          'The dot cannot tell us the school’s name. Store “School A” as a fact attached to it. A fact such as a name is called an `attribute`.',
          'Put both schools in one school `layer`. A layer is one collection of map data, such as all our school points. We can keep roads in another layer and show both layers together. We now have things to draw, but we still need numbers that tell the computer where to draw them.'
        ]]
      ],
      figure:['geometry',1,'Follow School A’s dot, the road line and the shaded park. Each drawing answers a different question: where is it, where does it go, or what land does it cover?'],
      takeaway:'A Point stores a position, a LineString stores a path, and a Polygon stores an area. Attributes store facts about them.',
      check:['If we rename School A, must we move its dot?','No. The name is an attribute. Its position can stay the same.'],
      after:'We have chosen what to draw. Next, we will give School A a position using two named numbers.'
    },
    axes: {
      title:'Give our school a position', short:'Name the coordinates',
      summary:'The dot needs an address the computer can read.',
      before:'We drew School A as a Point and attached its name. The computer still needs to know where that Point belongs.',
      purpose:'We will describe the same school with two numbers, and keep their names attached so we cannot mix them up.',
      steps:[
        ['Begin with north and south',[
          'Picture a globe. The `equator` is the imaginary line around its middle, halfway between the North and South Poles. `Latitude` describes a place’s north–south position relative to that line.',
          'Latitude is an angle, written in `degrees`. The symbol `°` means degrees; it does not mean metres. The equator is `0°`, and the North Pole is `90° N`.'
        ]],
        ['Add east and west',[
          '`Longitude` describes east–west position relative to another agreed starting line, called the `prime meridian`. Longitude is also written in degrees.',
          'For our invented School A, use an example position near Dhaka: longitude `90.4125° E`, latitude `23.8103° N`. Here `E` means east and `N` means north. Together these numbers are its `coordinates`: numbers describing a position.'
        ]],
        ['Keep each number in the right field',[
          'Write the names beside the numbers: `longitude = 90.4125` and `latitude = 23.8103`. If a tool asks for longitude first, the pair is `[90.4125, 23.8103]`.',
          'The required number order is called `axis order`. Some tools expect the opposite order, so read the field names. Swapping the numbers does not swap the labels automatically. We also need agreement about the Earth model behind these coordinates; that is our next step.'
        ]]
      ],
      figure:['coordinates',1,'Read the labels first and the numbers second. Both lines describe the same School A from the previous chapter.'],
      takeaway:'Latitude tells north–south position. Longitude tells east–west position. Always keep the names or required order with the numbers.',
      check:['Our input form asks for longitude first. Which School A value goes first?','90.4125 goes first. The full pair is [90.4125, 23.8103].'],
      after:'We have named our school’s coordinates. Next, we will see why everyone must use an agreed reference for Earth.'
    },
    earth: {
      title:'Agree on the Earth we measure from', short:'Agree on a reference',
      summary:'Our school has coordinates. Those coordinates need a shared starting reference.',
      before:'School A now has a longitude and latitude. Those angles describe its position relative to a model of Earth.',
      purpose:'We need our school data and other people’s map data to use compatible references, so their positions line up.',
      steps:[
        ['Use a smooth model for calculations',[
          'Real ground has hills and valleys. GIS calls the actual ground `terrain`. Following every bump would make worldwide position calculations difficult.',
          'Instead, calculations often use a smooth shape like a slightly flattened ball. That shape is called an `ellipsoid`. It is a calculation model, not a claim that the ground is smooth.'
        ]],
        ['Fix that model to the real planet',[
          'A shape alone is not enough. We must also agree where its centre is and how it is positioned relative to Earth. The reference that ties the model to the real planet is called a `datum`.',
          '`WGS 84` is the reference we will use for School A’s longitude and latitude. It is common in data from `GPS`, the satellite system used to find locations. Another collection of location data, called a `dataset`, can use a different reference. Similar-looking coordinates do not prove that its positions will line up with ours.'
        ]],
        ['Apply the same “measured from what?” question to height',[
          'Suppose we also record the height of School A’s roof. A height of `50 m` is incomplete unless we know what surface we measured from.',
          'The `geoid` is a gravity-based reference surface close to average sea level. It differs from the smooth ellipsoid. In the simplified picture, the roof is `50 m` above the ellipsoid and `30 m` above the geoid because the references are `20 m` apart there. The roof has not moved; only the starting surface differs.'
        ]]
      ],
      figure:['heights',2,'Use the marked terrain point as our roof example. Trace each arrow down to its starting surface before comparing 50 m and 30 m. The surface separation is exaggerated.'],
      takeaway:'A reference tells us what our position or height is measured from. Check that reference before comparing datasets.',
      check:['Two reports give our roof different heights. What should we check first?','Check the starting reference and units in each report. Different reference surfaces can explain different numbers without the roof moving.'],
      after:'We now have coordinate names, units and an Earth reference. Next, we will keep those rules together under one label.'
    },
    crs: {
      title:'Keep our coordinate rules together', short:'Label the coordinates',
      summary:'Give School A’s numbers an instruction sheet.',
      before:'We chose longitude and latitude in degrees, using the WGS 84 reference. Those decisions give the numbers their meaning.',
      purpose:'We need a way to keep that meaning attached when we save or share the school data.',
      steps:[
        ['Give the instruction sheet its name',[
          'A `coordinate reference system`, shortened to `CRS`, collects the rules for describing positions. It includes the Earth reference, the coordinate directions and the units.',
          'Think of it as the instruction sheet for the numbers. Without it, another person may not know how to read School A’s position.'
        ]],
        ['Use a catalogue code for the full definition',[
          'Instead of copying the whole definition into every conversation, we can refer to a catalogue code. An `EPSG code` identifies one entry in a widely used catalogue of coordinate reference systems.',
          '`EPSG:4326` identifies WGS 84 geographic coordinates in degrees. We will attach that label to our school data. This is a lookup code, not a formula you must calculate.'
        ]],
        ['Record the file’s field order too',[
          'The CRS and the file or tool’s input rules work together. The EPSG:4326 definition lists latitude first, while some common file formats write longitude first.',
          'For our table, we avoid uncertainty with named columns: `lon` means longitude and `lat` means latitude. Our documentation says `EPSG:4326`. We can now explain every part of the school’s stored position.'
        ]]
      ],
      figure:['crs',1,'Read the numbers, the WGS 84 reference and the degree units. EPSG:4326 identifies that coordinate system; the named fields still tell us which number is which.'],
      takeaway:'Keep the CRS label and field order with the coordinates. They explain how to read the numbers.',
      check:['Does EPSG:4326 mean our school’s coordinates are measured in metres?','No. Its geographic coordinates use degrees. We will choose a suitable metre-based system before local distance calculations.'],
      after:'Our school is correctly described on Earth. Next, we will see how to put that curved-Earth description onto a flat map.'
    },
    projections: {
      title:'Put the neighbourhood on a flat map', short:'Choose a flat map',
      summary:'We need a flat map that also suits our local measurements.',
      before:'We can locate School A using WGS 84 longitude and latitude. These are angles on a curved Earth model.',
      purpose:'Our eventual question involves “near a school”, so we need a useful way to measure local distances.',
      steps:[
        ['Understand why flattening needs a rule',[
          'A globe is curved, but our screen is flat. A `map projection` is the calculation that places locations from the curved surface onto a flat map.',
          'Flattening changes some shapes, sizes or distances. Those changes are called `distortion`. No flat world map preserves all of them everywhere.'
        ]],
        ['Choose for this neighbourhood',[
          'A CRS that uses a flat map projection is called a `projected CRS`. For our small area near Dhaka, we can use one from the `UTM` family. UTM divides much of Earth into numbered regions called zones, so each grid can suit a limited area.',
          'Our example location lies in `zone 46`, in the Northern Hemisphere, meaning north of the equator. `EPSG:32646` identifies WGS 84 / UTM 46N. Its horizontal coordinate is called `easting`; its vertical coordinate is called `northing`. Both use metres.'
        ]],
        ['Keep the choice tied to the job',[
          'The familiar web-map system `EPSG:3857` is often convenient for display, but it stretches ground distances. Having metre units does not remove that stretching.',
          'For this small teaching project, we will use EPSG:32646 for measurements. That choice belongs to this location and task; it is not a rule for every map. Now we need to calculate School A’s numbers in that system.'
        ]]
      ],
      figure:['projection',1,'Both boxes describe School A. The left uses degrees; the right uses the chosen local metre grid. E and N mean easting and northing.'],
      takeaway:'Choose a projected CRS that suits the region and measurement. A map’s metre units alone do not guarantee ground accuracy.',
      check:['Which system did we choose for local measurements around our example school?','WGS 84 / UTM 46N, identified by EPSG:32646.'],
      after:'We have chosen a metre grid. Next, we will convert the school coordinates into it without moving the school.'
    },
    transformations: {
      title:'Convert the numbers without moving the school', short:'Convert the coordinates',
      summary:'Labelling the input and calculating new coordinates are two separate actions.',
      before:'School A is stored in EPSG:4326 degrees. We chose EPSG:32646 metres for the local analysis.',
      purpose:'We need a metre-coordinate copy that still points to exactly the same school.',
      steps:[
        ['First, make sure the input is labelled correctly',[
          'Suppose our table has the known longitude and latitude but no CRS label. Its documentation confirms WGS 84. We can now `assign` EPSG:4326: attach the correct label without changing the values.',
          'After assignment, the pair is still `[90.4125, 23.8103]`. We have explained the numbers, not converted them.'
        ]],
        ['Then calculate the new description',[
          'To `transform` coordinates means to calculate their values in another coordinate system. Transform our correctly labelled point to EPSG:32646.',
          'School A becomes approximately easting `236377.4 m`, northing `2635628.6 m`. Those numbers are very different from the degree values, but they describe the same physical position.'
        ]],
        ['Notice the mistake we avoided',[
          'If we merely changed the label to EPSG:32646, the numbers would remain 90.4125 and 23.8103. Software would read them as metres, which would put the point somewhere else.',
          'The safe sequence is: verify what the original numbers mean, attach their correct label, then calculate the conversion. We now have positions that we can use for our neighbourhood measurements.'
        ]]
      ],
      figure:['transform',1,'Follow the same school from left to right. Assignment leaves the left-hand numbers alone; transformation calculates the right-hand numbers.'],
      takeaway:'Assign means label existing values. Transform means calculate new values for the same place.',
      check:['Does writing “metres” beside a number measured in degrees convert it?','No. A label cannot perform the coordinate calculation.'],
      after:'Our positions now use a suitable metre grid. Next, we will decide what distance from home to school actually means.'
    },
    distances: {
      title:'Measure from Home 1 to School A', short:'Measure the journey',
      summary:'One pair of places can have a direct distance and a different road distance.',
      before:'We converted our school location to a local metre grid. We can now compare positions using metre differences.',
      purpose:'Before counting “nearby” people, we must say which kind of distance we mean.',
      steps:[
        ['Follow the same home and school',[
          'In our invented neighbourhood, Home 1 lies `60 m` east and `80 m` north of School A. The road in the picture follows those two legs.',
          'Along that drawn road, the distance is `60 + 80 = 140 m`. We added the lengths actually travelled.'
        ]],
        ['Compare it with the direct line',[
          'The straight diagonal between these same positions is `100 m`. It is shorter because it cuts across rather than following the two road legs.',
          'This is a `planar distance`: a ruler-like calculation on flat map coordinates. For larger Earth-surface measurements, a `geodesic distance` follows a chosen Earth model instead. Neither calculation automatically follows roads.'
        ]],
        ['Choose an explicit rule for our project',[
          'For our first analysis, we will call a location near a school when its direct local-grid distance is at most `200 m`. We choose that simple rule so we can learn the counting process.',
          'That result will mean “inside our 200 m distance rule”, not “a 200 m walk”. Answering a walking question would require a connected road dataset and information about usable paths. We now know what our result will and will not measure.'
        ]]
      ],
      figure:['distance',1,'Compare the solid road legs with the dashed direct line. The endpoints stay the same; the path changes.'],
      takeaway:'Our project uses a stated 200 m direct-distance rule. Road distance answers a different question.',
      check:['Is Home 1 inside our 200 m direct-distance rule?','Yes. Its direct distance is 100 m, which is less than 200 m.'],
      after:'We have a distance rule. Next, we will check how much confidence to place in the positions we measure from.'
    },
    precision: {
      title:'Ask how trustworthy our positions are', short:'Check location quality',
      summary:'A very detailed-looking number can still describe the wrong position.',
      before:'We decided to count positions within 200 m of a school. A position error could affect a home close to that edge.',
      purpose:'We need to separate the quality of the measurement from the number of digits displayed.',
      steps:[
        ['Compare readings with a known position',[
          'Imagine standing at School A’s entrance and recording its phone position several times. We also have a trusted position for the entrance, so we can compare the readings with it.',
          '`Accuracy` means closeness to that true or accepted position. A reading far from the entrance has a large position error even if it contains many decimal places.'
        ]],
        ['Ask whether repeated readings agree',[
          '`Precision` means how closely repeated readings agree with one another. A tight group is precise. If the whole group sits away from the entrance, it is precise but inaccurate.',
          'A consistent shift is called `bias`. In the picture, each cross stands for the known entrance and the dots stand for repeated readings. Compare the location of the group as well as its spread.'
        ]],
        ['Carry that uncertainty into our result',[
          'Suppose a home position has an estimated error of about `5 m`. A measured distance near `200 m` needs more care than one clearly far inside the boundary.',
          'Storing extra digits does not reduce the original measurement error. Keep the source and its uncertainty with the data. With that limitation understood, we can now add population information to our map.'
        ]]
      ],
      figure:['accuracy',1,'Imagine the same school entrance at the centre of each target. Across a row, the group shifts; down a column, the readings spread out.'],
      takeaway:'Accuracy is closeness to the accepted position. Precision is agreement between repeats. Extra decimal places prove neither.',
      check:['Our phone readings form a tight group away from the known entrance. What does that tell us?','They are precise because they agree, but inaccurate relative to the known entrance.'],
      after:'We know how to locate and measure the schools. Next, we will add the people our question asks us to count.'
    },
    'vector-raster': {
      title:'Add people to the same neighbourhood', short:'Add a population grid',
      summary:'Our school dots tell us where the schools are, but not where people live.',
      before:'We have school positions and a 200 m distance rule. We have also considered position uncertainty.',
      purpose:'We need population data before we can count the people living near a school.',
      steps:[
        ['Name the kind of data we already have',[
          'Our school Points, road LineStrings and park Polygon represent individual objects. This way of storing map data is called `vector` data.',
          'Now suppose the population supplier gives us a grid rather than one record for every person. A grid of stored values is called a `raster`. It can describe the same neighbourhood as our vector layers.'
        ]],
        ['Read what one cell means',[
          'A `cell`, also called a pixel, is one element of that grid. In our teaching dataset, every cell covers `100 m × 100 m` and stores `10 people`. The number is a population count for that whole cell.',
          'There are `6 columns` and `4 rows`: `24 cells` altogether. Therefore the entire neighbourhood grid represents `24 × 10 = 240 people`. The values are invented so we can check every result ourselves.'
        ]],
        ['Keep the two layers together',[
          'The school layer supplies locations. The population raster supplies counts across the surrounding land. We will combine them by deciding which population cells satisfy our distance rule.',
          'First we need to locate those cells precisely. A cell has both an edge and a middle; confusing them can change which cells get selected.'
        ]]
      ],
      figure:['raster',1,'The schools have stayed in the same places. The new squares add population counts; they are not new school or house locations.'],
      takeaway:'Vector stores individual objects. Raster stores a grid of values. Our raster contains 240 people in total.',
      check:['What does the 10 in one of our raster cells mean?','It means 10 people in the whole 100 m by 100 m cell, not 10 people at every position inside it.'],
      after:'We have the population counts. Next, we will find the map position of each cell’s centre.'
    },
    geotransform: {
      title:'Find the middle of each population cell', short:'Locate each cell',
      summary:'A grid position needs a starting corner and a cell size to become a map position.',
      before:'Our population grid has 100 m cells, with 10 people in each cell. We must locate the cells before selecting any.',
      purpose:'For this teaching calculation, we will include a cell when its centre lies within 200 m of a school.',
      steps:[
        ['Start counting from the upper-left cell',[
          'A `row` runs across the grid. A `column` runs down it. Our software numbers both from zero, so the first cell is `row 0, column 0`.',
          'Those numbers tell us which cell we want, but not where it is on the map. We also need the map position of the grid’s starting corner, the cell size and the directions the grid runs.'
        ]],
        ['Move from the corner to the centre',[
          'Our grid has north at the top. From the first cell’s upper-left corner, move half a cell right and half a cell down. Half of `100 m` is `50 m`, so its centre is `50 m` east and `50 m` south of that corner.',
          'The rule that converts grid positions into map positions is called a `geotransform`. In this simple grid it combines the starting corner, cell spacing and directions. Rotated grids need extra terms.'
        ]],
        ['Apply one selection rule consistently',[
          'The next column’s centre is another `100 m` east. The next row’s centre is another `100 m` south. We can repeat that process for all 24 cells.',
          'We will test these centres against our school-distance rule. This treats all 10 people in a selected cell as included; it does not tell us where each person lives inside the cell. That is a limitation of this counting method.'
        ]]
      ],
      figure:['cells',1,'Find the orange corner and blue centre of the top-left cell. The short line moves 50 m east and 50 m south.'],
      takeaway:'The cell centre is not its corner. Our selection uses centres and whole-cell population counts.',
      check:['How far is the first cell centre south of its upper-left corner?','50 m, because our cell is 100 m high.'],
      after:'We can locate every cell. Next, we will see what must happen to population values if someone changes the grid size.'
    },
    resampling: {
      title:'Change the grid without losing people', short:'Handle a new grid size',
      summary:'Changing cell size also requires a rule for the values.',
      before:'We know where our 100 m population cells are and what their values mean: counts of people per whole cell.',
      purpose:'Before combining grids from different sources, we must understand how a change of grid can affect our counts.',
      steps:[
        ['Keep the same land and change only the grid',[
          'Take a block of four neighbouring cells from our population raster. Each cell is `100 m × 100 m` and contains `10 people`. Together they contain `40 people`.',
          'Suppose we replace that block with one `200 m × 200 m` cell covering exactly the same land. No people have moved; we changed only how their data is grouped.'
        ]],
        ['Choose a value that preserves the meaning',[
          'Because our values are whole-cell population counts, add them: `10 + 10 + 10 + 10 = 40 people`. The new larger cell must store 40 in this aligned example.',
          'Copying one old value would store only 10 and lose 30 people from the total. Averaging the four counts would also give 10, which answers a different question.'
        ]],
        ['Understand the wider term, then keep our original grid',[
          'Choosing or estimating values on a new grid is called `resampling`. Combining whole aligned cells by a summary such as a sum is called `aggregation`.',
          'The right method depends on what the values mean. Counts need different treatment from measurements such as temperature. For our school calculation, we will keep the original 100 m grid, so its 240-person total and cell centres stay the same.'
        ]]
      ],
      figure:['resampling',1,'Both panels cover the same land. The left has four values of 10; the right has their combined value of 40.'],
      takeaway:'A grid change must respect the meaning of its values. For aligned whole-cell population totals, sum the counts.',
      check:['What would be wrong with putting 10 in the new larger cell?','It would represent only 10 of the original 40 people. The grid change would incorrectly reduce the population total.'],
      after:'Our population grid is ready. Next, we will draw the two school areas and look at where they meet.'
    },
    topology: {
      title:'See where the school areas meet', short:'Compare the school areas',
      summary:'Some land can be near both schools at once.',
      before:'We kept our original population grid. We will select a cell when its centre is within 200 m of either school.',
      purpose:'We need to recognise the shared part before counting people, or we may count the same cells twice.',
      steps:[
        ['Draw the distance rule as an area',[
          'Draw a circle around School A with a distance of `200 m` from the school to the circle’s edge. That distance is its `radius`. Every position inside or on the edge of the circle satisfies our direct-distance rule.',
          'An area containing positions within a chosen distance of a map object is called a `buffer`. Draw the same 200 m buffer around School B.'
        ]],
        ['Look at the part inside both circles',[
          'Our schools are `200 m` apart on the local grid. Their 200 m buffers therefore share some area. That shared part is an `overlap`.',
          'A population-cell centre in that overlap will pass the distance test for both schools. It is still one cell containing the same 10 people, not two different populations.'
        ]],
        ['Give the relationship its meaning',[
          'GIS uses named tests for relationships between shapes. `Intersects` asks whether two shapes have any point in common. Our school buffers intersect because they share interior area.',
          'These connection and overlap rules are part of `topology`. We do not need a relationship matrix to understand today’s result: the middle belongs to both school areas, so the final count must handle it once.'
        ]]
      ],
      figure:['topology',1,'Follow each school’s circle. The lens-shaped middle is inside both. The schools and neighbourhood have not changed.'],
      takeaway:'The school buffers overlap. A cell in that shared area can be selected by both schools.',
      check:['Does a cell selected by both schools contain twice as many people?','No. It is the same cell and the same people. We must count it once when asking about at least one school.'],
      after:'We can see the overlap. Next, we will briefly check how the computer stores the circular areas we are using.'
    },
    algorithms: {
      title:'Turn our distance rule into computer steps', short:'Check the calculation',
      summary:'A computer follows stored positions and instructions rather than a hand-drawn circle.',
      before:'We drew 200 m buffers around our two schools. Their overlap matters for counting population cells.',
      purpose:'We need to know whether the stored shape matches the distance rule closely enough for the calculation.',
      steps:[
        ['Start with the instruction we actually want',[
          'For every cell centre, measure its direct distance to a school. If that distance is `200 m` or less, select the cell. Repeating these instructions is an `algorithm`: a step-by-step method for solving a problem.',
          'Our teaching count uses this direct distance test. It does not rely on how smooth the circle looks on screen.'
        ]],
        ['Understand a stored buffer outline',[
          'Many GIS tools store a circular buffer as a Polygon made from short straight sides. A stored corner is called a `vertex`; the plural is vertices.',
          'Four corners make a poor circle. More corners follow it more closely. The picture compares 4 and 64 corners for the same 200 m area. A rough outline can affect whether a point near the edge is included.'
        ]],
        ['Check with answers we already know',[
          'Home 1 is 100 m from School A, so our 200 m test must include it. A position 300 m away must fail. These easy examples help us check the instructions.',
          'Our park is `80 m` by `60 m`, so a polygon-area calculation should give `4800 m²`. The symbol m² means square metres, a measure of area. Simple known answers help catch mistakes before a bigger analysis.'
        ]]
      ],
      figure:['algorithms',1,'Both panels represent the same school radius at the same drawing scale. Only the number of stored corners changes.'],
      takeaway:'Check the algorithm and its inputs with known answers. A smooth-looking drawing alone does not prove a correct calculation.',
      check:['Should a cell centre 100 m from a school pass our 200 m rule?','Yes. It is inside the allowed distance.'],
      after:'Our distance test is defined and checked. Next, we can finally count the people selected by at least one school.'
    },
    coverage: {
      title:'Count the people near at least one school', short:'Count people once',
      summary:'Now we can answer the question that started our map.',
      before:'We have two school positions, a checked 200 m distance rule, and 24 population cells containing 10 people each.',
      purpose:'We will count selected cells once, including cells that are near both schools.',
      steps:[
        ['Count each school separately first',[
          'Testing the cell centres selects `12 cells` around School A and `12 cells` around School B. At 10 people per cell, each school’s separate total is `120 people`.',
          'Adding those totals gives 240, but we already know the circles overlap. Before accepting that answer, inspect the shared cells.'
        ]],
        ['Remove one copy of the shared count',[
          '`4 cells` are selected by both schools. Those cells represent `40 people`. They have appeared once in A’s total and once in B’s total.',
          'Subtract one copy: `120 + 120 − 40 = 200 people`. The combined area belonging to either school is called the `union`. Counting that union selects `20 distinct cells`.'
        ]],
        ['State exactly what we found',[
          'Our whole grid contains 240 people, and our rule selected 200. The remaining `40 people` are in the four cells whose centres fail both distance tests.',
          'Our result is: “200 people in population cells whose centres are within 200 m of at least one school.” It is a teaching estimate, not a verified walking-access count. This wording keeps the distance rule and cell-selection assumption visible.'
        ]]
      ],
      figure:['coverage',1,'The cells labelled Both form the duplicate count. There are four of them; removing one copy keeps their people in the final total exactly once.'],
      takeaway:'For our two schools, 120 + 120 − 40 = 200 people near at least one school under the stated rule.',
      check:['Why is the separate-school sum of 240 too large?','It includes the same 40 people in the shared cells twice. The unique selected total is 200.'],
      after:'We have our answer. Next, we will make a map that explains it clearly to someone who has not followed our calculations.'
    },
    cartography: {
      title:'Make the answer easy to read', short:'Explain the map',
      summary:'Our map should show what “selected” means, not just look attractive.',
      before:'Our calculation selected 20 cells, representing 200 people, under the 200 m direct-distance rule.',
      purpose:'We need the reader to understand the result without guessing what the colours or circles mean.',
      steps:[
        ['Give each visual choice one job',[
          'Keep a clear marker for each school. Draw the two 200 m outlines. Colour selected cells green and unselected cells grey. The green is now a category: it means “selected by our rule”.',
          'Add a `legend`, which is the explanation of the map’s symbols and colours. Include the date and data source when working with real data. Designing maps so people can read them is called `cartography`.'
        ]],
        ['Do not let colour change the question',[
          'Our green cells do not contain more people than the grey cells: every cell still contains 10. They are green because their centres pass the distance test.',
          'If we later colour areas by population concentration, we need `density`: people per unit area. That answers a different question from our current selected/not-selected map. State the variable before choosing colours.'
        ]],
        ['Write a title that carries the main assumption',[
          'A useful title is “Population cells within 200 m of a school”. Add “Direct distance; cell-centre selection” nearby so readers know how we counted.',
          'Now the map and the sentence “200 people selected” support each other. The next step is to package the data so another person can reproduce what the map shows.'
        ]]
      ],
      figure:['cartography',0,'Read the legend before the colours. Green means selected; the number 10 still means the population of a cell.'],
      takeaway:'Use labels and a legend to explain the measured variable, distance rule and selection method.',
      check:['Does a green cell necessarily contain more people than a grey cell here?','No. Both contain 10 people. Green only means the cell centre satisfies our school-distance rule.'],
      after:'Our map communicates the result. Next, we will save its data with enough information for someone else to use it.'
    },
    formats: {
      title:'Save our map without losing its meaning', short:'Package the data',
      summary:'The recipient needs the coordinates, facts and rules behind the map.',
      before:'We have a labelled map and a result: 200 people selected by our stated school-distance rule.',
      purpose:'We want another person to open the school data in the correct place and understand what it represents.',
      steps:[
        ['Keep data and its explanation together',[
          'Our school data needs positions and names. It also needs the CRS, field order, source and date. Information describing the data is called `metadata`.',
          'The method belongs with the result too: 200 m direct distance, cell-centre selection, and 10 people per original population cell. A picture alone does not preserve these calculation rules.'
        ]],
        ['Choose a container for the next person’s task',[
          'A `file format` is a way of packaging data. `GeoPackage` is a convenient single-file container for GIS layers, their attributes and CRS information.',
          '`GeoJSON` is a text format often used to share vector data with websites. Its geographic position rule is fixed: WGS 84 longitude first, latitude second. School A’s position is therefore `[90.4125, 23.8103]` in that format.'
        ]],
        ['Start with the smallest file we can inspect',[
          'For the next chapter, we will use `neighbourhood-school.csv`. A CSV is a simple text table. Our file has one row for School A and columns named `name`, `lon` and `lat`.',
          'This CSV does not contain a full CRS definition. Its accompanying instructions specify EPSG:4326. We will give those instructions to QGIS when opening the file, then save a GIS copy with the coordinate information attached.'
        ]]
      ],
      figure:['formats',1,'This is still our original School A. The coordinate order is a file-format rule, not a new location.'],
      takeaway:'Keep geometry, attributes and metadata together. Choose the file format for the receiving tool and task.',
      check:['Our CSV has lon and lat columns. Does the file extension alone prove its CRS?','No. Use the accompanying source information. This teaching file is explicitly documented as EPSG:4326.'],
      after:'We have prepared a small school file. Next, we will open that exact file in QGIS and check the result.'
    },
    qgis: {
      title:'Open our school in QGIS', short:'Open the same data',
      summary:'Use the same point and column names we have followed throughout the guide.',
      before:'We saved School A in a CSV with name, lon and lat columns. Its documented CRS is EPSG:4326.',
      purpose:'We will turn that table into a visible point layer and check it before doing more work.',
      steps:[
        ['Load the file we just prepared',[
          '`QGIS` is a free desktop program for viewing and analysing map data. Download our neighbourhood-school.csv from the link below, then open QGIS.',
          'Use its `Delimited Text` import tool and choose the CSV. “Delimited” means that a separator, here a comma, divides the table’s fields. Menu locations can differ between QGIS versions.'
        ]],
        ['Tell QGIS what the fields mean',[
          'For this geographic point import, choose `lon` for the `X` field and `lat` for the `Y` field. Set the geometry CRS to `EPSG:4326`, as documented for our file.',
          'Add the layer and use `Zoom to Layer`. Inspect the school’s name and stored coordinates. The point should be at our example location near Dhaka. The import has used our existing coordinates; it has not made a new survey.'
        ]],
        ['Separate the display from the stored data',[
          'The `layer CRS` describes the stored school coordinates. The `project CRS` controls the map view. Changing the view does not rewrite the source CSV.',
          'To make our metre-based analysis copy, export the layer with target CRS EPSG:32646, for example into a GeoPackage. Check School A against the conversion we already calculated: about 236377.4 m east and 2635628.6 m north.'
        ]]
      ],
      figure:['qgis',1,'The left box shows our file’s known values. The right box shows the import settings that give those values their intended meaning.'],
      takeaway:'Import named fields with the verified source CRS. Exporting to another CRS converts coordinates; changing the project view does not.',
      check:['Which CSV field goes into X for this import?','lon goes into X. lat goes into Y. The geometry CRS is EPSG:4326.'],
      after:'We have opened the school and checked its position. Finally, we will use the same chain of ideas to investigate a map that looks wrong.'
    },
    debugging: {
      title:'Check the whole chain when something looks wrong', short:'Check our finished work',
      summary:'Every earlier chapter gives us one thing to inspect.',
      before:'We created shapes, located them, chose a CRS, measured distances, counted raster cells and opened the data in QGIS.',
      purpose:'We will use that sequence to find a mistake rather than moving the drawing until it looks convincing.',
      steps:[
        ['Return to one known map object',[
          'Start with School A because we know its name, longitude, latitude and CRS. `Debugging` means finding and explaining the cause of an unexpected result.',
          'If the point appears in the wrong place, compare the file fields with our source record. If latitude has become 90.4125°, the fields were likely swapped: allowed latitude runs only from −90° to +90°. Confirm the column mapping before making a correction.'
        ]],
        ['Follow the order of our earlier decisions',[
          'If the fields are correct, check the CRS label. If a distance area is far too large, check whether the tool interpreted 200 as degrees rather than metres. If raster selection is shifted, check whether corners were used instead of centres.',
          'If the map looks right but the total is 240, inspect whether the four shared cells were counted twice. Each symptom leads back to a specific choice we made, rather than to an arbitrary visual adjustment.'
        ]],
        ['Explain the finished result from start to end',[
          'Our school points supply positions. Our chosen CRS makes local measurement possible. Our 200 m direct-distance rule selects cell centres. Our original cells each hold 10 people. Counting selected cells once gives 200 people.',
          'That is the full connection. We can now explain what we did, why each step was needed, and what the answer means. Keep the original data and record any corrections so another person can follow the same reasoning.'
        ]]
      ],
      figure:['debugging',0,'Compare the suspected error against the same School A record. There is no need to invent a new example or drag the point by eye.'],
      takeaway:'Check the chain in order: map object → coordinates → CRS → distance rule → cell selection → unique count → clear explanation.',
      check:['Our separate school totals sum to 240. What earlier fact explains why the unique result is 200?','The schools share four selected cells, or 40 people. Those people appeared in both separate totals, so one copy must be removed.'],
      after:'You have completed the connected first reading. Revisit any chapter where the explanation still feels unclear, or use the optional reference material to deepen one idea at a time.'
    }
  },
  escape(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  inline(value) { return this.escape(value).replace(/`([^`\n]+)`/g,'<code>$1</code>'); },
  group(id) {
    let index=this.path.indexOf(id);
    for(const [label,count] of this.groups) { if(index<count)return label; index-=count; }
  },
  figureInfo(topic) {
    const [key,,read]=this.lessons[topic.id].figure;
    const source=key==='heights'||key==='accuracy'?Teaching.figures[key]:null;
    return {file:source?.file||`journey-${key}.svg`,title:source?.title||this.lessons[topic.id].title,alt:source?.alt||read,read};
  },
  figureHTML(topic) {
    const f=this.figureInfo(topic),url=`assets/figures/${f.file}`;
    return `<figure class="journey-figure"><a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Open diagram at full size"><img src="${url}" alt="${this.escape(f.alt)}" loading="lazy" decoding="async"></a><figcaption><strong>Follow the picture.</strong> ${this.inline(f.read)} <a href="${url}" target="_blank" rel="noopener noreferrer">Enlarge ↗</a> <a href="assets/figures/CREDITS.md#connected-neighbourhood-story" target="_blank" rel="noopener noreferrer">Illustration notes ↗</a></figcaption></figure>`;
  },
  lessonHTML(topic) {
    const b=this.lessons[topic.id],e=value=>this.inline(value),index=this.path.indexOf(topic.id),previous=this.path[index-1];
    return `<article id="section-understand" class="lesson-block beginner-guide sequential-reading" tabindex="-1"><div class="reading-context"><span class="eyebrow">CHAPTER ${index+1} OF ${this.path.length} / OUR NEIGHBOURHOOD</span><p><strong>${previous?'Where we left off':'Our starting point'}.</strong> ${e(b.before)}</p>${previous?`<a href="#lesson/${previous}">Revisit: ${this.escape(this.lessons[previous].short)} ←</a>`:''}</div><p class="reading-purpose">${e(b.purpose)}</p>${b.steps.map(([heading,paragraphs],i)=>`<section class="reading-step" id="section-read-${i}" tabindex="-1"><div class="eyebrow">STEP ${i+1} OF ${b.steps.length}</div><h2>${e(heading)}</h2>${paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}${i===b.figure[1]?this.figureHTML(topic):''}</section>`).join('')}${topic.id==='qgis'?'<p><a class="button light" href="data/neighbourhood-school.csv" download>Download our School A CSV ↓</a></p>':''}<div class="beginner-takeaway"><strong>What we can now say</strong><p>${e(b.takeaway)}</p></div><details class="beginner-check"><summary>Pause here: ${e(b.check[0])}</summary><p>${e(b.check[1])}</p></details></article>`;
  },
  transitionHTML(topic) {
    const index=this.path.indexOf(topic.id),next=this.path[index+1],previous=this.path[index-1];
    return `<section class="lesson-block chapter-transition"><div class="eyebrow">${next?'WHY WE CONTINUE':'THE COMPLETE PICTURE'}</div><p>${this.inline(this.lessons[topic.id].after)}</p><nav class="lesson-pagination" aria-label="Previous and next chapters">${previous?`<a class="button light" href="#lesson/${previous}">← ${this.escape(this.lessons[previous].short)}</a>`:'<a class="button light" href="#home">← Start of the guide</a>'}${next?`<a class="button primary" href="#lesson/${next}">Next: ${this.escape(this.lessons[next].short)} →</a>`:'<a class="button primary" href="#home">Review the whole path →</a>'}</nav></section>`;
  },
  labHTML(topic) {
    return `<p class="reference-lab-intro">This is an extra reference experiment for this topic. It can use different locations or numbers from our neighbourhood story. ${this.escape(topic.lab[1])}</p>`;
  },
  init() {
    TOPICS.sort((a,b)=>this.path.indexOf(a.id)-this.path.indexOf(b.id));
    TOPICS.forEach(topic=>{topic.referenceTitle=topic.title;topic.title=this.lessons[topic.id].title;topic.summary=this.lessons[topic.id].summary;topic.short=this.lessons[topic.id].short;});
  }
};

Beginner.init();
