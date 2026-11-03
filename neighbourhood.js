/* One invented neighbourhood shared by the first readings. Never a real school survey. */
const Neighbourhood = {
  school: { lon:90.4125, lat:23.8103 },
  schools: [[200,200],[400,200]],
  homes: [[260,280],[460,280]],
  radius:200,
  cells() {
    return Array.from({length:24},(_,i)=>{
      const col=i%6,row=Math.floor(i/6),x=col*100+50,y=350-row*100;
      const memberships=this.schools.filter(([sx,sy])=>Math.hypot(x-sx,y-sy)<=this.radius).length;
      return {col,row,x,y,people:10,memberships};
    });
  },
  projected() { return Geo.utm(this.school.lat,this.school.lon,46); },
  text(x,y,value,size=18,colour='#284c40',anchor='start',halo='') {
    const safe=String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${colour}" text-anchor="${anchor}"${halo?` stroke="${halo}" stroke-width="5" stroke-linejoin="round" paint-order="stroke"`:''}>${safe}</text>`;
  },
  rect(x,y,w,h,fill='#edf4e7',stroke='#a8bfaa') { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}"/>`; },
  line(x1,y1,x2,y2,colour='#668779',dash='') { return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${colour}" stroke-width="2" fill="none" stroke-dasharray="${dash}"/>`; },
  dot(x,y,colour='#245c48',r=6) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" stroke="white" stroke-width="2"/>`; },
  map(kind) {
    const T=(...args)=>this.text(...args),R=(...args)=>this.rect(...args),L=(...args)=>this.line(...args);
    const px=x=>70+x*.85,py=y=>430-y*.85;
    let body=R(70,90,510,340,'#f8faf5'),labels='';
    if(['raster','cells','coverage','cartography'].includes(kind)) {
      this.cells().forEach(c=>{
        const fill=kind==='coverage'?(c.memberships===2?'#f2d7ae':c.memberships?'#d4e7d8':'#f2f3ef'):kind==='cartography'?(c.memberships?'#a8d1ba':'#eeefed'):'#edf4e7';
        body+=R(px(c.col*100),py(400-c.row*100),85,85,fill,'#a8bfaa');
        const labelOffset=kind==='cells'&&c.row===0&&c.col===0?30:6;
        labels+=T(px(c.x),py(c.y)+labelOffset,kind==='coverage'?(c.memberships===2?'Both':c.memberships?'One':'—'):'10',18,'#284c40','middle',fill);
      });
    } else {
      body+=R(px(60),py(120),80*.85,60*.85,'#d4e7d8')+T(px(60),py(120)-10,'Park',17);
      body+=L(px(100),py(200),px(500),py(200),'#bc9c6b')+L(px(260),py(200),px(260),py(280),'#bc9c6b')+L(px(460),py(200),px(460),py(280),'#bc9c6b');
      this.homes.forEach(([x,y],i)=>{body+=R(px(x)-6,py(y)-6,12,12,'#d7e6f0')+T(px(x)+13,py(y)-9,`Home ${i+1}`,17);});
    }
    if(['topology','coverage','cartography'].includes(kind)) this.schools.forEach(([x,y],i)=>{
      body+=`<circle cx="${px(x)}" cy="${py(y)}" r="${this.radius*.85}" fill="${kind==='topology'?(i?'#79aec626':'#5e9a7626'):'none'}" stroke="${i?'#3f779b':'#245c48'}" stroke-width="2"/>`;
    });
    body+=labels;
    this.schools.forEach(([x,y],i)=>{body+=this.dot(px(x),py(y),i?'#3f779b':'#245c48')+T(px(x)+9,py(y)-12,`School ${i?'B':'A'}`,18);});
    body+=T(620,120,'Same neighbourhood',21)+T(620,154,'Schools A and B',18);
    if(kind==='geometry') body+=T(620,208,'Dot → school position')+T(620,247,'Line → road path')+T(620,286,'Area → park land')+T(620,359,'Each object can also')+T(620,386,'have a name.');
    if(kind==='raster') body+=T(620,210,'Each square:')+T(620,244,'100 m × 100 m',21)+T(620,292,'10 people',24)+T(620,350,'24 cells × 10 people')+T(620,381,'= 240 people in total');
    if(kind==='cells') {
      body+=this.dot(px(0),py(400),'#b06824',7)+this.dot(px(50),py(350),'#256996',7)+L(px(0),py(400),px(50),py(350),'#256996');
      body+=T(620,210,'First cell: row 0, col 0')+T(620,255,'Orange = top-left corner',17)+T(620,293,'Blue = cell centre',17)+T(620,345,'Move 50 m right,')+T(620,376,'then 50 m down.');
    }
    if(kind==='topology') body+=T(620,215,'Circle edge: 200 m')+T(620,247,'from that school')+T(620,305,'The middle belongs')+T(620,336,'to both circles.')+T(620,390,'This is an overlap.');
    if(kind==='coverage') body+=T(620,207,'A: 12 cells → 120 people')+T(620,245,'B: 12 cells → 120 people')+T(620,283,'Both: 4 cells → 40 people')+T(620,342,'120 + 120 − 40',23)+T(620,380,'= 200 people',26);
    if(kind==='cartography') body+=R(620,205,25,25,'#a8d1ba')+T(657,225,'Selected cell',17)+R(620,252,25,25,'#eeefed')+T(657,272,'Not selected',17)+T(620,330,'A circle shows the')+T(620,361,'200 m distance rule.')+T(620,408,'10 = people in a cell');
    return body;
  },
  diagram(kind) {
    const T=(...args)=>this.text(...args),R=(...args)=>this.rect(...args),L=(...args)=>this.line(...args);
    const [e,n]=this.projected();
    let body='',title='',caption='Invented neighbourhood for learning. Local drawing distances are in metres; not a surveyed map.';
    if(['geometry','raster','cells','topology','coverage','cartography'].includes(kind)) {
      title={geometry:'Our map begins with two schools, roads and a park',raster:'Add population values to the same neighbourhood',cells:'Find the centre of one population cell',topology:'Our two school areas share some space',coverage:'Count the shared cells only once',cartography:'Explain what our map’s colours mean'}[kind];
      body=this.map(kind);
    } else if(['coordinates','latitude','longitude'].includes(kind)) {
      title={coordinates:'Give School A two named location numbers',latitude:'Latitude: begin at the equator',longitude:'Longitude: begin at the prime meridian'}[kind];
      const latitudeColour='#256996',longitudeColour='#a65d27';
      // Orthographic globe centred on 45° E, with north up and both reference lines visible.
      const point=(lon,lat)=>[270+163*Math.cos(lat*Math.PI/180)*Math.sin((lon-45)*Math.PI/180),280-163*Math.sin(lat*Math.PI/180)];
      const curve=(positions,colour,width=1,dash='')=>`<path d="${positions.map(([lon,lat],i)=>`${i?'L':'M'}${point(lon,lat).map(n=>n.toFixed(2)).join(' ')}`).join(' ')}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-dasharray="${dash}"/>`;
      const meridian=lon=>Array.from({length:91},(_,i)=>[lon,-90+i*2]);
      const parallel=lat=>Array.from({length:91},(_,i)=>[-45+i*2,lat]);
      body='<circle cx="270" cy="280" r="163" fill="#edf4e7" stroke="#668779" stroke-width="2"/>';
      [-60,-30,30,60].forEach(lat=>{body+=curve(parallel(lat),'#c5d6c6');});
      [-15,15,45,75,105].forEach(lon=>{body+=curve(meridian(lon),'#c5d6c6');});
      body+=curve(parallel(0),'#668779',2);
      if(kind!=='latitude') body+=curve(meridian(0),longitudeColour,2,'5 4')+curve(meridian(this.school.lon),longitudeColour,3);
      if(kind!=='longitude') body+=curve(parallel(this.school.lat),latitudeColour,3);
      const [x,y]=point(this.school.lon,this.school.lat);
      body+=this.dot(x,y,'#245c48',8)+L(x+8,y-5,420,185)+L(420,185,490,185)+T(399,172,'School A',20);
      body+=T(270,106,'North Pole · 90° N',17,'#284c40','middle')+T(270,470,'South Pole · 90° S',17,'#284c40','middle');
      if(kind!=='latitude') body+=T(32,150,'Prime meridian',17,longitudeColour)+T(32,172,'0° longitude',16,longitudeColour)+L(145,180,...point(0,30),longitudeColour);
      body+=T(32,380,'Equator',17)+T(32,402,'0° latitude',16)+L(108,365,140,280);
      if(kind==='coordinates') {
        body+=R(520,125,395,125,'#fbf1e7','#dec4ae')+T(540,156,'LONGITUDE · EAST / WEST',17,longitudeColour)+T(540,193,`${this.school.lon}° E`,29,longitudeColour)+T(540,229,'East of the prime meridian',18);
        body+=R(520,270,395,125,'#edf5fa','#b8d2e1')+T(540,301,'LATITUDE · NORTH / SOUTH',17,latitudeColour)+T(540,338,`${this.school.lat}° N`,29,latitudeColour)+T(540,374,'North of the equator',18);
        body+=T(520,434,'Two named numbers. One school.',21)+T(520,466,'Longitude first: [90.4125, 23.8103]',18);
      } else if(kind==='latitude') {
        body+=R(520,140,395,135,'#edf5fa','#b8d2e1')+T(540,174,'LATITUDE · NORTH / SOUTH',17,latitudeColour)+T(540,216,`${this.school.lat}° N`,32,latitudeColour)+T(540,250,'School A is north of the equator.',18);
        body+=T(520,320,'Start at 0° on the equator.',21)+T(520,360,'North → towards 90° N',20)+T(520,397,'South → towards 90° S',20)+T(520,453,'Degrees measure an angle, not metres.',18);
      } else {
        body+=R(520,140,395,135,'#fbf1e7','#dec4ae')+T(540,174,'LONGITUDE · EAST / WEST',17,longitudeColour)+T(540,216,`${this.school.lon}° E`,32,longitudeColour)+T(540,250,'School A is east of the prime meridian.',18);
        body+=T(520,320,'Dashed orange: the starting line.',20)+T(520,358,'Solid orange: School A’s meridian.',20)+T(520,414,'The same school also has latitude:',19)+T(520,450,`${this.school.lat}° N`,24,latitudeColour);
      }
      caption='Schematic globe. School A is an invented example near Dhaka, not a surveyed school entrance.';
    } else if(kind==='coordinate-fields') {
      title='Keep each number in its named field';
      body=R(55,125,405,145,'#fbf1e7','#dec4ae')+T(80,163,'longitude',24,'#a65d27')+T(80,207,this.school.lon,32,'#a65d27')+T(80,245,'East / west · degrees',18);
      body+=R(500,125,405,145,'#edf5fa','#b8d2e1')+T(525,163,'latitude',24,'#256996')+T(525,207,this.school.lat,32,'#256996')+T(525,245,'North / south · degrees',18);
      body+=L(258,270,258,322,'#a65d27')+L(250,312,258,322,'#a65d27')+L(266,312,258,322,'#a65d27');
      body+=L(703,270,703,322,'#256996')+L(695,312,703,322,'#256996')+L(711,312,703,322,'#256996');
      body+=R(105,325,750,105)+T(480,356,'WHEN THE TOOL ASKS FOR LONGITUDE FIRST',17,'#284c40','middle');
      body+=T(210,401,'[',32)+T(260,401,'90.4125',32,'#a65d27')+T(476,401,',',32)+T(590,401,'23.8103',32,'#256996')+T(790,401,']',32);
      body+=T(480,474,'Always read the field names: another tool may ask for latitude first.',20,'#284c40','middle');
      caption='Both fields describe the same invented School A. Axis order is the required order of the numbers.';
    } else if(kind==='crs'||kind==='formats'||kind==='qgis'||kind==='debugging') {
      title={coordinates:'Give School A two named location numbers',crs:'Keep the meaning beside School A’s numbers',formats:'Save the school position with its name',qgis:'Tell QGIS which column means what',debugging:'Check the same school before changing anything'}[kind];
      body=R(45,115,415,295)+T(70,155,'School A',25)+T(70,215,'Longitude: 90.4125° E',24)+T(70,263,'Latitude:   23.8103° N',24);
      if(kind==='crs') body+=T(70,326,'Earth reference: WGS 84')+T(70,371,'Units: degrees')+T(500,170,'CRS label: EPSG:4326',25)+T(500,232,'The label identifies the rules.')+T(500,284,'Also record the field order:')+T(500,323,'longitude, latitude',22);
      if(kind==='formats') body+=T(70,326,'Name is an attribute.')+T(500,163,'GeoJSON position:',23)+T(500,211,'[90.4125, 23.8103]',25)+T(500,275,'Its format requires')+T(500,310,'WGS 84 longitude, latitude.')+T(500,370,'Keep source and date too.');
      if(kind==='qgis') body+=T(70,326,'Input: neighbourhood-school.csv',18)+T(500,160,'Import settings',25)+T(500,215,'X field → lon')+T(500,257,'Y field → lat')+T(500,299,'Geometry CRS → EPSG:4326')+T(500,365,'Then: Add → Zoom to Layer');
      if(kind==='debugging') body+=T(70,326,'Known meaning from our file')+T(500,166,'If the fields are swapped:',23)+T(500,222,'Latitude becomes 90.4125°',22,'#a34f26')+T(500,274,'Allowed latitude: −90° to +90°')+T(500,324,'So this interpretation fails.')+T(500,373,'Check fields before moving a pin.');
      caption='School A is invented. Its example geographic position is near Dhaka, not a surveyed school entrance.';
    } else if(kind==='projection'||kind==='transform') {
      title=kind==='projection'?'One school, a globe description and a local map grid':'Label first; convert only after the label is correct';
      body=R(45,140,395,230)+T(70,183,'School A / degrees',24)+T(70,236,'90.4125, 23.8103',26)+T(70,287,'WGS 84 / EPSG:4326',20)+T(70,331,'longitude, latitude',18)+L(452,250,495,250)+L(485,244,495,250)+L(485,256,495,250)+R(510,140,400,230,'#e9f2f7')+T(535,183,'Same school / metres',24)+T(535,236,`${e.toFixed(1)} E`,26)+T(535,280,`${n.toFixed(1)} N`,26)+T(535,331,'UTM 46N / EPSG:32646',20);
      body+=T(65,428,kind==='transform'?'Assign = label existing numbers. Transform = calculate the numbers on the right.':'E means easting; N means northing. Both are positions on the chosen flat grid.',19);
      caption='Computed from the same example point with the course’s WGS 84 UTM implementation.';
    } else if(kind==='distance') {
      title='Home 1 and School A: the same trip, two distances';
      // Equal x/y scale: the east leg is 180 px and the north leg is 240 px.
      body=L(160,370,340,370)+L(340,370,340,130)+L(160,370,340,130,'#245c48','6 5')+this.dot(160,370)+this.dot(340,130)+T(65,411,'School A',21)+T(360,130,'Home 1',21)+T(195,400,'60 m east',20)+T(355,265,'80 m north',20)+T(178,223,'100 m',22)+T(610,195,'Direct: 100 m',25)+T(610,260,'Along these road legs:')+T(610,302,'60 + 80 = 140 m',23);
      caption='Enlarged local grid example. The diagonal is a direct distance; the solid legs represent a route.';
    } else if(kind==='resampling') {
      title='A larger population cell needs the combined count';
      for(let r=0;r<2;r++)for(let c=0;c<2;c++)body+=R(100+c*100,150+r*100,100,100)+T(150+c*100,210+r*100,'10',28,'#284c40','middle');
      body+=R(590,150,200,200)+T(690,266,'40',36,'#284c40','middle')+T(365,258,'→',40)+T(95,400,'Four 100 m × 100 m cells',21)+T(565,400,'One 200 m × 200 m cell',21)+T(345,455,'10 + 10 + 10 + 10 = 40 people',21);
      caption='Both panels cover the same ground area. This aligned aggregation keeps the population total.';
    } else if(kind==='algorithms') {
      title='The same 200 m school area, stored with more corners';
      [4,64].forEach((count,i)=>{const x=245+i*460;body+=`<circle cx="${x}" cy="265" r="125" fill="none" stroke="#8caa97" stroke-width="2" stroke-dasharray="5 5"/><polygon points="${Geo.circle([x,265],125,count).map(p=>p.join(',')).join(' ')}" fill="#d8e8d6" stroke="#245c48" stroke-width="2"/>`+T(x,440,`${count} corners`,24,'#284c40','middle');});
      caption='Common drawing scale. The dashed circle is the ideal boundary; the stored polygon joins straight sides.';
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-labelledby="scene-title scene-desc"><title id="scene-title">${title}</title><desc id="scene-desc">${caption}</desc><rect width="960" height="540" fill="white"/><g font-family="Arial, Helvetica, sans-serif">${T(32,33,'OUR NEIGHBOURHOOD / SAME PROJECT, NEXT STEP',14)}${T(32,75,title,25)}${body}${T(32,514,caption,15)}</g></svg>`;
  }
};
