/* Rebuild the original, offline study diagrams: node scripts/build-study-figures.cjs */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const Geo = vm.runInNewContext(fs.readFileSync(path.join(root, 'geo.js'), 'utf8') + '\nGeo;');
const ink = '#213e45', green = '#23745d', blue = '#246eab', orange = '#ae521f';
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (x,y,value,size=20,fill=ink,anchor='start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
const line = (x1,y1,x2,y2,colour=ink,dash='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const rect = (x,y,w,h,fill,stroke='none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const dot = (x,y,colour=orange,r=6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" stroke="white" stroke-width="2"/>`;
const panel = (x,y,w,h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#f4f7f8" stroke="#d7e2e5"/>`;
const arrow = (x1,y1,x2,y2,colour=ink) => `${line(x1,y1,x2,y2,colour)}<path d="M-9 -5L0 0L-9 5" transform="translate(${x2} ${y2}) rotate(${Math.atan2(y2-y1,x2-x1)*180/Math.PI})" fill="none" stroke="${colour}" stroke-width="2"/>`;
function save(name,title,description,body,footer,height=560) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc>
<rect width="960" height="${height}" fill="white"/>
<g font-family="Arial, Helvetica, sans-serif">${text(32,32,'FIELDNOTES / VISUAL EXPLANATION',14,green)}${text(32,72,title,28)}${body}${line(32,height-54,928,height-54,'#d7e2e5')}${text(32,height-25,footer,16)}</g></svg>\n`;
  fs.writeFileSync(path.join(root,'assets/figures',`study-${name}.svg`),svg);
}

// Height arrows share one vertical scale at the marked point; surface shapes are schematic.
save('heights','Three surfaces, two kinds of height',
  'A terrain point is 50 metres above the ellipsoid and 30 metres above the geoid. Geoid undulation is positive 20 metres: h = H + N.',
  panel(32,100,896,380)+
  '<path d="M60 215L155 190L230 220L320 160L400 180L500 145L620 205L750 175L890 215" fill="none" stroke="#23745d" stroke-width="4"/>'+
  '<path d="M60 340Q260 280 400 300T890 325" fill="none" stroke="#246eab" stroke-width="4"/>'+
  line(60,380,890,380,orange,'8 5')+dot(400,180,green)+
  line(400,180,400,380,ink,'4 4')+arrow(440,380,440,180,orange)+arrow(550,300,550,180,green)+arrow(660,380,660,300,blue)+
  line(400,180,550,180,'#aebfc4','4 4')+line(400,300,660,300,'#aebfc4','4 4')+
  text(65,140,'Physical terrain',20,green)+text(65,285,'Geoid',20,blue)+text(65,414,'Reference ellipsoid',20,orange)+
  text(451,255,'h = 50 m',19,orange)+text(563,240,'H = 30 m',19,green)+text(677,347,'N = +20 m',19,blue)+
  text(390,452,'h = H + N     →     50 = 30 + 20',23),
  'Local schematic; vertical separation exaggerated. h ≈ H + N; distinct vertical directions simplified.');

let axes = panel(32,100,896,380);
const px = lon => 100+lon*7, py = lat => 420-lat*4.8;
for(let v=0;v<=60;v+=10) axes+=line(px(v),py(0),px(v),py(60),'#d3dfe3')+line(px(0),py(v),px(60),py(v),'#d3dfe3')+text(px(v),447,`${v}°`,16,ink,'middle')+text(85,py(v)+5,`${v}°`,16,ink,'end');
axes+=text(225,474,'Longitude (x) →',18)+text(58,122,'Latitude (y)',18)+
  dot(px(4.9003),py(52.3791),green,8)+dot(px(52.3791),py(4.9003),orange,8)+
  text(590,165,'CORRECT / Amsterdam',21,green)+text(590,198,'x = 4.9003° E',21)+text(590,228,'y = 52.3791° N',21)+
  text(590,304,'SWAPPED / Indian Ocean',21,orange)+text(590,337,'x = 52.3791° E',21)+text(590,367,'y = 4.9003° N',21)+text(590,433,'Both pass global range checks.',18);
save('axis-order','A coordinate swap changes the location','Two exact coordinate pairs on a longitude/latitude graticule: Amsterdam and its swapped position in the Indian Ocean.',axes,'Angular coordinate plot, not a distance-preserving map. GeoJSON order is [longitude, latitude].');

let mercator='';
for(const [i,lat] of [0,30,60].entries()) {
  const x=32+i*304,k=Geo.mercatorScale(lat),side=64*k;
  mercator+=panel(x,110,288,365)+text(x+24,150,`${lat}° latitude`,23)+rect(x+144-side/2,280-side/2,side,side,'#d5e8f6',blue)+
    text(x+144,384,`Length × ${k.toFixed(3)}`,21,ink,'middle')+text(x+144,418,`Area × ${(k*k).toFixed(3)}`,21,ink,'middle');
}
save('mercator','Mercator enlarges equal ground patches',
  'Equal infinitesimal ground squares shown at a common map scale. At 60 degrees latitude both sides double and area quadruples.',
  mercator,'Local spherical approximation: k = sec(latitude); area factor = k². Squares share one drawing scale.');

const utm=Geo.utm(52.3791,4.9003);
save('transform','Assign a CRS label or transform the coordinates?',
  'Assigning verified WGS 84 metadata keeps the coordinate numbers. Transforming Amsterdam to UTM zone 31N changes numbers and units while keeping the place.',
  panel(32,110,896,365)+text(60,153,'Verified source: Amsterdam, WGS 84, conventional x/y order',22)+
  rect(60,185,295,82,'#e1eee8')+text(80,220,'4.9003, 52.3791',25)+text(80,250,'longitude, latitude / degrees',17)+
  arrow(375,225,490,225)+text(386,207,'assign',18)+text(520,215,'4.9003, 52.3791',25)+text(520,249,'EPSG:4326 label added; values stay',18)+
  arrow(205,285,205,350)+text(225,325,'transform',18)+rect(60,365,800,77,'#e0edf6')+
  text(80,398,`${utm[0].toFixed(1)} m E, ${utm[1].toFixed(1)} m N`,25,blue)+text(80,427,'EPSG:32631 / UTM 31N / same physical place',19),
  'Computed with WGS 84 sixth-order Krüger UTM. Relabelling degree values as metres is not reprojection.');

let degrees=panel(32,110,896,365)+text(60,145,'Latitude',19)+text(210,145,'One degree: local ground length (km)',19);
for(const [i,lat] of [0,30,60].entries()) {
  const y=185+i*94,d=Geo.degreeLengths(lat);
  degrees+=text(65,y+25,`${lat}°`,24)+rect(210,y,d.lat/1000*4,22,'#23745d')+rect(210,y+30,d.lon/1000*4,22,'#246eab')+
    text(680,y+18,`${(d.lat/1000).toFixed(2)} km latitude`,18,green)+text(680,y+48,`${(d.lon/1000).toFixed(2)} km longitude`,18,blue);
}
save('degree-lengths','One degree is not a fixed ground distance','WGS 84 latitude-degree lengths remain near 111 km. Longitude-degree lengths fall from 111.32 km at the equator to 55.80 km at 60 degrees.',degrees,'WGS 84 local curvature × π/180; differential lengths, not finite one-degree endpoint geodesics.');

let grid=panel(32,110,896,365);
for(let r=0;r<3;r++) for(let c=0;c<4;c++) grid+=rect(80+c*72,170+r*72,72,72,r===0&&c===0?'#d5e8f6':'#fff','#b4c8d0');
grid+=arrow(80,145,368,145)+text(175,133,'column →',18)+arrow(52,170,52,386)+text(65,421,'row increases down; northing decreases',17)+
  dot(80,170,orange)+dot(116,206,blue)+line(80,170,116,206,blue)+
  text(420,158,'Origin = upper-left cell corner',22,orange)+text(420,190,'(570000, 5820000) m',23)+
  text(420,244,'Cell (col 0, row 0) centre',22,blue)+text(420,276,'(571000, 5819000) m',23)+
  text(420,330,'Pixel width = +2000 m',20)+text(420,362,'Pixel height = −2000 m',20)+text(420,423,'Centre uses (col + ½, row + ½).',22);
save('cell-centres','Raster index → corner → centre','A north-up raster with two-kilometre cells: the first centre lies one kilometre east and one kilometre south of the upper-left corner.',grid,'Exact north-up example from the note. Array access is [row, col]; map coordinates are (x, y).');

const u=.25,v=.5,weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],values=[10,20,30,40];
let interp=panel(32,110,896,365)+rect(100,185,240,200,'#e3eef5',blue)+line(160,185,160,385,orange,'5 5')+line(100,285,340,285,orange,'5 5');
[[100,185],[340,185],[100,385],[340,385]].forEach(([x,y],i)=>{interp+=dot(x,y,blue)+text(x,y+(i<2?-16:30),values[i],22,blue,'middle');});
interp+=dot(160,285,orange,8)+text(175,274,'22.5',23,orange)+text(100,152,'u = 0.25 →',20)+text(80,450,'v = 0.50 downward',20)+text(435,155,'Weights sum to 1',24);
weights.forEach((w,i)=>{interp+=text(435,205+i*44,`${w.toFixed(3)} × ${values[i]} = ${(w*values[i]).toFixed(2)}`,22);});
interp+=text(435,426,`Weighted sum = ${Geo.bilinear(u,v).toFixed(1)}`,26,orange);
save('bilinear','Bilinear interpolation blends four samples','Four source cell centres have values 10, 20, 30, 40. At u=0.25 and v=0.5 the weights are 0.375, 0.125, 0.375, 0.125 and output is 22.5.',interp,'Corners here are source cell CENTRES. Interpolate continuous values; category IDs are not magnitudes.');

let precision='';
const cloud=[[-1,-.5],[1,.5],[-.5,1],[.5,-1],[-.8,.7],[.8,-.7]];
for(const [i,[bias,spread,label]] of [[0,9,'Small bias / tight repeats'],[42,9,'Large bias / tight repeats'],[0,42,'Small bias / wide spread'],[42,42,'Large bias / wide spread']].entries()) {
  const x=32+(i%2)*456,y=108+Math.floor(i/2)*208,cx=x+114,cy=y+96;
  precision+=panel(x,y,440,194);
  for(const r of [24,48,72]) precision+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#bdcdd2"/>`;
  precision+=line(cx-9,cy,cx+9,cy)+line(cx,cy-9,cx,cy+9);
  for(const [a,b] of cloud) precision+=dot(cx+bias+a*spread,cy+b*spread,orange,4);
  precision+=text(x+220,y+66,i<2?'HIGH PRECISION':'LOW PRECISION',18,green)+text(x+220,y+102,bias?'Biased away':'Centred on truth',19)+text(x+220,y+128,bias?'from truth':'on average',19)+text(x+20,y+181,label,17);
}
save('accuracy','Repeatability does not guarantee accuracy','Four targets independently vary systematic bias and observation spread. Crosses mark the truth. A tightly grouped biased sample is precise but inaccurate.',precision,'Synthetic observations; identical target scales. Cross = truth, dots = repeats. Accuracy also depends on spread.',600);

let classes='';
const density=[120,135,150,160,180,210,250,900,1100,1250,4000,5200],colours=['#edf8fb','#b2e2e2','#66c2a4','#238b45'];
for(const [i,[method,label]] of [['equal','Equal interval'],['quantile','Quantile'],['jenks','Natural breaks / Jenks']].entries()) {
  const y=112+i*128,edges=Geo.breaks(density,4,method);
  classes+=text(32,y+23,label,21);
  density.forEach((value,j)=>{const c=Geo.classify(value,edges),x=320+j*49;classes+=rect(x,y,47,45,colours[c])+text(x+23.5,y+28,value,13,c===3?'white':ink,'middle');});
  classes+=text(320,y+76,`Breaks: ${edges.join(' / ')}`,16);
}
save('classification','Same values, different classification stories','Twelve fixed synthetic density values coloured with equal interval, quantile and Fisher-Jenks breaks. Positions and values stay fixed between rows.',classes,'Four ordered colour classes, light → dark. Values are people/km²; cells represent synthetic districts.');

let predicates='';
const relations=[['Disjoint',125,0,60,60,'intersects = false'],['Touching',90,0,60,60,'touches = true'],['Overlapping',60,25,60,60,'overlaps = true'],['A within B',-10,-10,110,100,'within = true']];
relations.forEach(([label,bx,by,bw,bh,result],i)=>{
  const x=32+(i%2)*456,y=110+Math.floor(i/2)*192;
  predicates+=panel(x,y,440,178)+text(x+20,y+30,label,22)+
    rect(x+55+bx,y+65+by,bw,bh,'#a5cee080',blue)+rect(x+55,y+65,i===3?60:90,60,'#b4d8bf90',green)+
    text(x+63,y+99,'A',19,green)+text(x+55+bx+bw-21,y+65+by+bh-9,'B',19,blue)+text(x+230,y+160,result,18);
});
save('predicates','Spatial predicates describe different relationships','Two polygons are disjoint, share only an edge, overlap in area, or one is strictly inside the other. Touching and within also imply intersects.',predicates,'Synthetic planar polygons. Touch, overlap and within all intersect; within does not imply overlaps.');

let coverage=panel(32,110,896,365);
const a=new Set([0,1,2,5,6,7,10,11,12]),b=new Set([7,8,9,12,13,14,17,18,19]);
for(let r=0;r<4;r++)for(let c=0;c<5;c++) {
  const index=r*5+c,hitA=a.has(index),hitB=b.has(index),fill=hitA&&hitB?'#ead2b4':hitA?'#d6e9de':hitB?'#d9e9f5':'#f4f7f8';
  coverage+=rect(65+c*61,170+r*61,59,59,fill,'#b4c8d0')+text(94+c*61,208+r*61,hitA&&hitB?'AB':hitA?'A':hitB?'B':'–',19,ink,'middle');
}
coverage+=text(65,149,'Each selected cell contains 10 people',17)+text(425,161,'A: 9 cells = 90 people',23,green)+text(425,205,'B: 9 cells = 90 people',23,blue)+
  text(425,249,'In both: 2 cells = 20 people',23,orange)+text(425,315,'Union = A + B − overlap',25)+text(425,357,'90 + 90 − 20 = 160 people',25)+text(425,423,'Count each selected cell once.',20);
save('coverage-union','Overlapping service areas must not double-count','Two illustrative cell masks select nine cells each with two cells shared. Ten people per cell gives 160 people in the union, rather than 180.',coverage,'Synthetic cell-selection masks, not real shelter catchments. Overlap cells are labelled AB.');

let raster='';
for(const [i,n] of [0,6,12].entries()) {
  const x=32+i*304;
  raster+=panel(x,110,288,365)+text(x+144,151,n?`${n} × ${n} raster`:'Vector boundary',22,ink,'middle');
  if(!n) raster+=`<circle cx="${x+144}" cy="285" r="96" fill="#d6e9de" stroke="${green}" stroke-width="2"/>`;
  else {
    const size=240/n;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++) {
      const inside=(c+.5-n/2)**2+(r+.5-n/2)**2<(n*.4)**2;
      raster+=rect(x+24+c*size,165+r*size,size,size,inside?'#b4d8bf':'#fff','#d7e2e5');
    }
    raster+=`<circle cx="${x+144}" cy="285" r="96" fill="none" stroke="${green}" stroke-width="2" stroke-dasharray="5 4"/>`;
  }
  raster+=text(x+144,449,n?'Select cell centre inside circle':'Idealised continuous circle',17,ink,'middle');
}
save('vector-raster','One shape, two sampled raster resolutions','An idealised vector circle and 6 by 6 and 12 by 12 rasterisations at the same extent. Cells are selected by whether their centres are inside the circle.',raster,'All panels share an extent. Dashed line = original outline. Finer resampling alone cannot recover lost detail.');

console.log('Built 12 study SVGs from explicit geometry and the course reference calculations.');
