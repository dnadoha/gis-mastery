const Visuals = {
  svg(body, label, viewBox = '0 0 600 280') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">${body}</svg>`;
  },
  hero() {
    let contours = '';
    for (let i = 0; i < 9; i++) {
      const scale = 1-i*.075;
      contours += `<path d="M70 175 Q92 105 170 115 Q194 38 260 88 Q341 51 359 113 Q445 117 422 173 Q428 226 339 223 Q285 278 232 229 Q144 270 130 214 Q78 221 70 175Z" transform="translate(${260*(1-scale)} ${170*(1-scale)}) scale(${scale})" fill="none" stroke="${i > 4 ? '#73925e' : '#a6b88e'}" stroke-width="1.2"/>`;
    }
    return this.svg(`<defs><pattern id="heroGrid" width="28" height="20" patternUnits="userSpaceOnUse"><path d="M28 0H0V20" fill="none" stroke="#b6c4a0" stroke-width=".5"/></pattern></defs><g transform="translate(25 -5)"><path d="m45 186 215-103 220 103-220 112Z" fill="#c0ce9c"/><path d="m45 175 215-103 220 103-220 112Z" fill="#e8efd5" stroke="#adbf91"/><path d="m45 175 215-103 220 103-220 112Z" fill="url(#heroGrid)"/><g transform="translate(0 -30)">${contours}</g><path d="M113 193Q191 167 235 191T351 181" fill="none" stroke="#8fa9a4" stroke-width="9"/><path d="M113 191Q191 165 235 189T351 179" fill="none" stroke="#c0d2c3" stroke-width="5"/><path d="M260 99v79" stroke="#627c4f" stroke-width="1.5" stroke-dasharray="3 3"/><ellipse cx="260" cy="178" rx="12" ry="6" fill="#a7b987"/><path d="M260 63c-14 0-24 10-24 23 0 18 24 39 24 39s24-21 24-39c0-13-10-23-24-23Z" fill="#285b43"/><circle cx="260" cy="86" r="8" fill="#e5edcf"/><g fill="#556e48" font-family="monospace" font-size="9"><text x="298" y="79">52.3791° N</text><text x="298" y="94">4.9003° E</text><text x="375" y="234">N ↑</text></g><path d="M328 91h-38" stroke="#9db184"/><path d="m106 239 30 14 30-14" fill="none" stroke="#657e52"/><circle cx="106" cy="239" r="3" fill="#657e52"/><circle cx="166" cy="239" r="3" fill="#657e52"/></g>`, 'Layered topographic map with contours, a river and a coordinate pin', '0 0 550 330');
  },
  thumbnail(id, index) {
    const green = '#62836a', pale = '#c5d6b7', blue = '#7ea5af';
    const grid = '<path d="M0 35H600M0 70H600M0 105H600M0 140H600M0 175H600M0 210H600M0 245H600M50 0V280M100 0V280M150 0V280M200 0V280M250 0V280M300 0V280M350 0V280M400 0V280M450 0V280M500 0V280M550 0V280" stroke="#a7b899" stroke-width=".5" opacity=".25"/>';
    let body;
    if (['earth','crs','projections','distances','axes'].includes(id)) {
      body = `<circle cx="300" cy="145" r="91" fill="#dce6ce" stroke="${green}" stroke-width="2"/><ellipse cx="300" cy="145" rx="45" ry="91" fill="none" stroke="${green}"/><ellipse cx="300" cy="145" rx="91" ry="31" fill="none" stroke="${green}"/><path d="M209 145h182M300 54v182" stroke="${green}"/>`;
      if (id === 'axes') body += `<path d="m300 145 58-48M300 145l-46 52" stroke="#bb784f" stroke-width="4"/><circle cx="358" cy="97" r="8" fill="${green}"/><circle cx="254" cy="197" r="8" fill="#bb784f"/>`;
      if (id === 'crs') body += '<rect x="360" y="174" width="117" height="39" rx="6" fill="#fff" stroke="#b0c1a4"/><text x="375" y="199" fill="#426749" font-size="18" font-family="monospace">EPSG:4326</text>';
      if (id === 'distances') body += `<path d="M230 173Q299 55 371 165" stroke="${blue}" stroke-width="5" fill="none" stroke-dasharray="7 5"/>`;
      if (id === 'projections') body += `<path d="M110 115h70m-13-10 13 10-13 10M420 145h60" fill="none" stroke="${green}" stroke-width="2"/><rect x="460" y="75" width="75" height="140" rx="3" fill="${pale}" stroke="${green}"/>`;
    } else if (['geometry','topology','algorithms','transformations'].includes(id)) {
      body = `<path d="M150 191 199 77 286 106 278 198Z" fill="${pale}" stroke="${green}" stroke-width="2"/><path d="M278 170 326 70 422 133 397 205Z" fill="#b8d1cf90" stroke="${blue}" stroke-width="2"/>`;
      if (id === 'geometry') body = `<circle cx="155" cy="145" r="9" fill="${green}"/><path d="m225 179 36-69 35 40 37-65" fill="none" stroke="${blue}" stroke-width="4"/><path d="m390 95 85 30-15 78-84-17Z" fill="${pale}" stroke="${green}" stroke-width="2"/>`;
      if (id === 'algorithms') body = `<circle cx="300" cy="150" r="94" fill="none" stroke="#9caf8e" stroke-dasharray="5 5"/><path d="M394 150 329 239 224 205 224 95 329 61Z" fill="${pale}" stroke="${green}" stroke-width="2"/>`;
      if (id === 'transformations') body = `<rect x="125" y="86" width="140" height="118" rx="7" fill="#fff" stroke="#9caf8e"/><rect x="345" y="86" width="140" height="118" rx="7" fill="${pale}" stroke="#9caf8e"/><path d="M280 144h47m-12-10 12 10-12 10" fill="none" stroke="${green}" stroke-width="3"/><text x="145" y="151" font-size="20" fill="${green}">lon, lat</text><text x="365" y="151" font-size="20" fill="${green}">E, N</text>`;
    } else if (['vector-raster','geotransform','resampling','coverage','cartography'].includes(id)) {
      body = '';
      for (let r=0;r<5;r++) for (let c=0;c<8;c++) {
        const value = Math.sin((r+c+index)*1.2);
        const fill = ['#e1e9c5','#c7d89b','#95b27a','#668d69','#3f6b57'][Math.floor((value+1)*2.4)];
        body += `<rect x="${166+c*33}" y="${66+r*33}" width="31" height="31" rx="2" fill="${fill}"/>`;
      }
      if (id === 'coverage') body += '<circle cx="285" cy="118" r="58" fill="none" stroke="#fff" stroke-width="3"/><circle cx="343" cy="172" r="57" fill="none" stroke="#fff" stroke-width="3"/>';
      if (id === 'geotransform') body += '<path d="M160 61h280M160 61v174" stroke="#39654a" stroke-width="2"/><circle cx="248" cy="148" r="7" fill="#b46c42"/>';
      if (id === 'resampling') body += '<path d="m300 110 33 33-33 33-33-33Z" fill="none" stroke="#fff" stroke-width="3"/>';
    } else if (id === 'precision') {
      body = [85,60,35].map(r=>`<circle cx="300" cy="145" r="${r}" fill="none" stroke="${green}" stroke-width="1.5"/>`).join('') + '<path d="M290 145h20M300 135v20" stroke="#496b4e"/>';
      body += [[322,133],[331,146],[324,151],[340,135],[332,124]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="#b47b50"/>`).join('');
    } else {
      body = `<rect x="145" y="65" width="310" height="163" rx="8" fill="#fff" stroke="#a2b59a"/><path d="M145 93h310M225 93v135" stroke="#c9d5bf"/><path d="m255 183 37-65 72 9 48 58Z" fill="${pale}" stroke="${green}"/><path d="M160 112h48m-48 15h38m-38 15h43" stroke="#a4b798" stroke-width="4"/>`;
      if (id === 'debugging') body += '<circle cx="360" cy="125" r="32" fill="#f3e6ce" stroke="#a87d4d" stroke-width="2"/><path d="m384 150 23 23" stroke="#a87d4d" stroke-width="8"/>';
    }
    return this.svg(grid + body, `${TOPICS.find(t=>t.id===id)?.short || id} illustration`);
  },
  mount(topic, root) {
    const stage = root.querySelector('.lab-stage'), controls = root.querySelector('.lab-controls'), output = root.querySelector('.lab-output');
    const select = (label, options) => `<label>${label} <select>${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
    const range = (label, min, max, value, step = 1, name = 'value') => `<label>${label} <input aria-label="${label}" name="${name}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`;
    const draw = (body, label) => { stage.innerHTML = this.svg(body, label); };
    const format = (n, digits=1) => n.toLocaleString('en', {maximumFractionDigits:digits});
    let update;
    switch (topic.id) {
      case 'earth':
        controls.innerHTML = range('Years of motion', 0, 80, 40);
        update = () => {
          const years = Number(controls.querySelector('input').value), shift = years*.025;
          draw(`<path d="M60 110Q120 45 190 93T340 77T540 90" fill="none" stroke="#8b9d64" stroke-width="3"/><path d="M60 140Q180 111 290 144T540 135" fill="none" stroke="#83a8af" stroke-width="3"/><path d="M60 180Q300 145 540 180" fill="none" stroke="#b59b74" stroke-width="3" stroke-dasharray="6 4"/><text x="65" y="58">Terrain</text><text x="430" y="117">Geoid</text><text x="430" y="208">Ellipsoid</text><path d="M260 65v135" stroke="#8c9d80" stroke-dasharray="3 4"/><circle cx="260" cy="104" r="8" fill="#345d43"/><circle cx="${260+shift*55}" cy="104" r="8" fill="#be7b47"/><path d="M260 230h${shift*55}" stroke="#be7b47" stroke-width="2"/><text x="170" y="263">Same reference start → accumulated frame difference</text>`, 'Terrain, geoid and ellipsoid with exaggerated accumulated frame motion');
          output.textContent = `${years} years × 2.5 cm/year = ${shift.toFixed(2)} m. A coordinate epoch can matter.`;
        }; break;
      case 'crs':
        controls.innerHTML = select('Representation', [['4326','EPSG:4326 · geographic'],['32631','EPSG:32631 · local projected'],['3857','EPSG:3857 · web display']]);
        update = () => {
          const code = controls.querySelector('select').value;
          const values = {'4326':['4.9003','52.3791','degrees · conventional x/y order'], '32631':['629,345.7','5,804,903.4','metres · easting / northing'], '3857':['545,498.9','6,868,964.0','metres · distorted display coordinates']}[code];
          draw(`<circle cx="140" cy="140" r="74" fill="#dce7ce" stroke="#77946a"/><ellipse cx="140" cy="140" rx="34" ry="74" fill="none" stroke="#77946a"/><path d="M66 140h148" stroke="#77946a"/><circle cx="165" cy="97" r="7" fill="#bc7846"/><path d="M238 140h58m-12-10 12 10-12 10" fill="none" stroke="#718b60" stroke-width="2"/><text x="326" y="93">Amsterdam · EPSG:${code}</text><text class="large" x="326" y="136">x: ${values[0]}</text><text class="large" x="326" y="175">y: ${values[1]}</text><text class="small" x="326" y="205">${values[2].split(' · ')[0]}</text>`, 'Amsterdam in the selected coordinate reference system');
          output.textContent = `${values[2]}. The place is unchanged.${code==='4326' ? ' EPSG authority order is lat, lon; this display is explicitly x/y.' : ''}`;
        }; break;
      case 'axes':
        controls.innerHTML = select('Interpretation', [['correct','Correct: x=4.9003, y=52.3791'],['swapped','Swapped: x=52.3791, y=4.9003']]);
        update = () => {
          const swapped = controls.querySelector('select').value === 'swapped';
          const lon=swapped?52.3791:4.9003, lat=swapped?4.9003:52.3791;
          const x=100+lon/60*440,y=235-lat/60*200;
          draw(`<path d="M100 35v200h440" fill="none" stroke="#7e9274"/><path d="M100 85h440M100 135h440M100 185h440M170 35v200M310 35v200M450 35v200" stroke="#d6dfcc"/><text x="100" y="258">0°</text><text x="440" y="258">60° longitude →</text><text x="12" y="45">60° N</text><text x="28" y="233">0°</text><rect x="122" y="56" width="32" height="11" rx="2" fill="#b2c68e"/><text class="small" x="163" y="65">Netherlands AOI</text><ellipse cx="484" cy="219" rx="54" ry="23" fill="#c3d9dd"/><text class="small" x="397" y="187">Indian Ocean</text><circle cx="${x}" cy="${y}" r="8" fill="${swapped?'#b97645':'#315d43'}"/><text x="230" y="115">${swapped?'52.3791° E, 4.9003° N':'4.9003° E, 52.3791° N'}</text><text x="230" y="141">${swapped?'Wrong area, valid global ranges':'Expected area: Amsterdam'}</text>`, swapped?'Swapped coordinates in the Indian Ocean':'Correct coordinates in the Netherlands');
          output.textContent = swapped ? 'Both numbers pass global range checks. The Netherlands AOI catches the swap.' : 'Normalised GeoJSON / app boundary: [longitude, latitude] = [4.9003, 52.3791].';
        }; break;
      case 'projections':
        controls.innerHTML = range('Latitude °N',0,80,52,1);
        update = () => {
          const lat = Number(controls.querySelector('input').value), k=Geo.mercatorScale(lat), side=32*k;
          draw(`<rect x="108" y="122" width="32" height="32" fill="#b7cc9c" stroke="#53754a"/><text x="76" y="204">Ground patch</text><path d="M190 138h75m-12-10 12 10-12 10" fill="none" stroke="#879d78" stroke-width="2"/><rect x="${420-side/2}" y="${138-side/2}" width="${side}" height="${side}" fill="#8aaeb2" stroke="#507d83"/><text x="365" y="253">Mercator patch</text><text class="small" x="60" y="31">Both drawings share a scale. Watch the length and area ratios.</text>`, 'Ground patch and expanding Mercator patch at selected latitude');
          output.textContent = `${lat}° N · length factor ${k.toFixed(3)}× · area factor ${(k*k).toFixed(2)}×. Local spherical approximation.`;
        }; break;
      case 'transformations':
        controls.innerHTML = select('Operation', [['transform','Correct: transform 4326 → 32631'],['assign','Wrong: assign 32631 to degree values'],['metadata','Correct: assign missing 4326 metadata']]);
        update = () => {
          const action=controls.querySelector('select').value;
          const lines = action==='transform'?['629345.7, 5804903.4','EPSG:32631 · same location','Values change; Amsterdam stays.']: action==='assign'?['4.9003, 52.3791','Wrongly labelled EPSG:32631','No conversion: not Amsterdam in UTM.']:['4.9003, 52.3791','EPSG:4326 · verified source','Only missing metadata is repaired.'];
          draw(`<rect x="25" y="70" width="220" height="130" rx="9" fill="#fff" stroke="#bdcbb1"/><text x="45" y="105">Input · longitude, latitude</text><text class="large" x="45" y="146">4.9003, 52.3791</text><text class="small" x="45" y="177">Verified WGS 84 coordinates</text><path d="M260 137h45m-12-10 12 10-12 10" stroke="#759063" fill="none" stroke-width="2"/><rect x="320" y="70" width="260" height="130" rx="9" fill="${action==='assign'?'#f3e3d4':'#dce7ce'}"/><text class="large" x="335" y="120">${lines[0]}</text><text x="335" y="160">${lines[1]}</text>`, 'Assignment and transformation comparison');
          output.textContent = lines[2];
        }; break;
      case 'distances':
        controls.innerHTML = range('Latitude °N',0,80,52.4,.1);
        update = () => {
          const lat=Number(controls.querySelector('input').value), lengths=Geo.degreeLengths(lat);
          draw(`<text x="50" y="60">1° latitude</text><rect x="50" y="80" width="${lengths.lat/260}" height="37" rx="4" fill="#94b17c"/><text x="50" y="163">1° longitude at ${lat}° N</text><rect x="50" y="183" width="${lengths.lon/260}" height="37" rx="4" fill="#82a7af"/><text class="small" x="50" y="258">Same angular step · different ground lengths · bars share a scale</text>`, 'Local length of one degree of latitude and longitude');
          output.textContent=`${lat}° N · 1° latitude ≈ ${format(lengths.lat/1000,3)} km · 1° longitude ≈ ${format(lengths.lon/1000,3)} km.`;
        }; break;
      case 'geometry':
        controls.innerHTML=select('Geometry', [['point','Point'],['line','Open LineString'],['hole','Polygon with hole'],['bow','Invalid bow-tie'],['outside','Invalid outside hole']]);
        update=()=>{
          const kind=controls.querySelector('select').value;
          const pictures={point:'<circle cx="300" cy="135" r="9" fill="#386448"/>',line:'<path d="M110 180 210 80 330 180 460 90" fill="none" stroke="#5e8a94" stroke-width="4"/><circle cx="110" cy="180" r="6" fill="#bd7948"/><circle cx="460" cy="90" r="6" fill="#bd7948"/>',hole:'<path d="M150 45H450V230H150ZM240 100H360V175H240Z" fill="#c0d4a5" stroke="#53794d" stroke-width="3" fill-rule="evenodd"/>',bow:'<path d="M170 45 430 230 430 45 170 230Z" fill="#dfb892" stroke="#ac703d" stroke-width="3"/><circle cx="300" cy="137.5" r="9" fill="#ab583b"/>',outside:'<rect x="100" y="55" width="240" height="170" fill="#c0d4a5" stroke="#53794d" stroke-width="3"/><rect x="395" y="95" width="95" height="90" fill="none" stroke="#af6e41" stroke-width="3"/><text x="398" y="206">“hole” outside</text>'};
          draw(pictures[kind], `Simple Features example: ${kind}`);
          output.textContent={point:'Dimension 0. Interior: point itself. Boundary: empty.',line:'Dimension 1. Orange endpoints are the boundary; the rest is interior.',hole:'Valid polygon. Shell and hole rings are the boundary; the hole interior is polygon exterior.',bow:'Invalid: self-intersection. Signed area may cancel; validate before measuring.',outside:'Invalid: an interior ring must lie inside its shell.'}[kind];
        }; break;
      case 'topology':
        controls.innerHTML=select('Relationship', [['disjoint','Disjoint'],['touch','Touch along edge'],['overlap','Partial overlap'],['within','A within B']]);
        update=()=>{
          const relation=controls.querySelector('select').value;
          const defs={disjoint:[40,80,100,100,200,80,100,100,'FF2FF1212','No common points. intersects=false.'],touch:[40,80,100,100,140,80,100,100,'FF2F11212','Shared edge only. touches=true, intersects=true, overlaps=false.'],overlap:[40,70,120,120,100,110,120,120,'212101212','Shared interior area. overlaps=true and intersects=true.'],within:[110,110,60,60,60,60,160,160,'2FF1FF212','A is inside B. A.within(B)=true; A.overlaps(B)=false.']};
          const [ax,ay,aw,ah,bx,by,bw,bh,matrix,message]=defs[relation];
          stage.innerHTML=`<div class="lab-dual">${this.svg(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#85b3bc80" stroke="#538593" stroke-width="2"/><rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="#a6c38690" stroke="#557b48" stroke-width="2"/><text x="${ax+10}" y="${ay+25}">A</text><text x="${bx+bw-22}" y="${by+bh-12}">B</text>`,'Two squares with selected relationship','0 0 340 280')}<div><p class="matrix-key">Rows: A I / B / E<br>Columns: B I / B / E</p><div class="matrix">${[...matrix].map(v=>`<span>${v}</span>`).join('')}</div></div></div>`;
          output.textContent=`${matrix} · ${message}`;
        }; break;
      case 'algorithms':
        controls.innerHTML=range('Polygon vertices',4,128,64,4);
        update=()=>{
          const n=Number(controls.querySelector('input').value), ring=Geo.circle([300,135],100,n), ratio=n*Math.sin(2*Math.PI/n)/(2*Math.PI);
          draw(`<circle cx="300" cy="135" r="100" fill="none" stroke="#a9b995" stroke-dasharray="4 4" stroke-width="2"/><polygon points="${ring.map(p=>p.join(',')).join(' ')}" fill="#d0dfb9" stroke="#63874f" stroke-width="2"/><path d="M300 135h100" stroke="#ab7946"/><text x="315" y="126">radius</text>`,`${n}-vertex inscribed regular polygon compared with circle`);
          output.textContent=`${n} vertices · polygon/circle area = ${ratio.toFixed(6)} (${(ratio*100).toFixed(3)}%). Missing area: ${((1-ratio)*100).toFixed(3)}%.`;
        }; break;
      case 'vector-raster':
        controls.innerHTML=select('Grid size',[['6','6 × 6 · coarse'],['12','12 × 12'],['24','24 × 24 · fine']]);
        update=()=>{
          const n=Number(controls.querySelector('select').value), size=200/n;
          let pixels='';
          for(let r=0;r<n;r++)for(let c=0;c<n;c++){const hit=(c+.5-n/2)**2+(r+.5-n/2)**2<(n*.4)**2;pixels+=`<rect x="${340+c*size}" y="${35+r*size}" width="${size}" height="${size}" fill="${hit?'#a6bf88':'#e6eddb'}" stroke="#fff" stroke-width=".5"/>`;}
          draw(`<circle cx="150" cy="135" r="80" fill="#a6bf88" stroke="#55784a" stroke-width="2"/><text x="96" y="265">Vector outline</text>${pixels}<text x="378" y="265">Raster · ${n*n} cells</text>`, 'Vector circle and a cell-centre rasterisation');
          output.textContent=`${n} × ${n} = ${n*n} cells. Finer grids preserve more boundary detail but need more storage.`;
        }; break;
      case 'geotransform': {
        let col=0,row=0;
        stage.innerHTML=`<div class="grid-buttons">${Array.from({length:24},(_,i)=>`<button type="button" data-cell="${i}" aria-label="Column ${i%6}, row ${Math.floor(i/6)}" aria-pressed="${i===0}">${i%6},${Math.floor(i/6)}</button>`).join('')}</div>`;
        controls.innerHTML='<span class="muted">Click a cell, or focus it and press Enter. Columns → · rows ↓</span>';
        update=()=>{const [x,y]=Geo.cellCentre(col,row);output.textContent=`col=${col}, row=${row} · centre (${format(x,0)}, ${format(y,0)}) m · upper-left corner (${format(x-1000,0)}, ${format(y+1000,0)}) m.`;stage.querySelectorAll('button').forEach(b=>{const selected=Number(b.dataset.cell)===row*6+col;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});};
        stage.addEventListener('click',event=>{const b=event.target.closest('[data-cell]');if(!b)return;col=Number(b.dataset.cell)%6;row=Math.floor(Number(b.dataset.cell)/6);update();});
        break;
      }
      case 'resampling':
        controls.innerHTML=range('u · right',0,1,.25,.01,'u')+range('v · down',0,1,.5,.01,'v');
        update=()=>{
          const u=Number(controls.querySelector('[name=u]').value),v=Number(controls.querySelector('[name=v]').value),z=Geo.bilinear(u,v);
          draw(`<rect x="190" y="50" width="200" height="180" fill="#e1e9d2" stroke="#9eb58d"/><path d="M190 ${50+180*v}H390M${190+200*u} 50V230" stroke="#b17d4b" stroke-dasharray="4 4"/><text class="large" x="145" y="54">10</text><text class="large" x="405" y="54">20</text><text class="large" x="145" y="240">30</text><text class="large" x="405" y="240">40</text><circle cx="${190+200*u}" cy="${50+180*v}" r="8" fill="#38674a"/><text class="small" x="220" y="268">Four source cell centres</text>`, 'Bilinear interpolation point between four source cell centres');
          output.textContent=`u=${u.toFixed(2)}, v=${v.toFixed(2)} → ${z.toFixed(2)}. Weights: ${[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v].map(w=>w.toFixed(3)).join(', ')}.`;
        }; break;
      case 'precision':
        controls.innerHTML=range('Systematic offset',0,60,35,1,'offset')+range('Observation spread',2,55,8,1,'spread');
        update=()=>{
          const offset=Number(controls.querySelector('[name=offset]').value),spread=Number(controls.querySelector('[name=spread]').value);
          const points=[[.2,-.5],[-.7,.3],[.6,.8],[-.9,-.6],[.4,.2],[.9,-.8],[-.4,.9]].map(([x,y])=>`<circle cx="${300+offset+x*spread}" cy="${140+y*spread}" r="4" fill="#b97b47"/>`).join('');
          draw(`${[90,60,30].map(r=>`<circle cx="300" cy="140" r="${r}" fill="none" stroke="#a6b897"/>`).join('')}<path d="M287 140h26M300 127v26" stroke="#4d6b47" stroke-width="2"/>${points}<text x="220" y="263">Cross = true location</text>`, 'Measurement target with independent systematic offset and observation spread');
          output.textContent=`Offset ${offset}; spread ${spread} (arbitrary units). ${spread<15?'Tight repeatability':'Scattered repeats'} ${offset>20?'can still miss the truth.':'does not determine stored decimal places.'}`;
        }; break;
      case 'cartography': {
        const values=[120,135,150,160,180,210,250,900,1100,1250,4000,5200], colours=['#ffffcc','#a1dab4','#41b6c4','#225ea8'];
        controls.innerHTML=select('Classification',[['equal','Equal interval'],['quantile','Quantile'],['jenks','Natural breaks (Fisher-Jenks)']]);
        update=()=>{
          const method=controls.querySelector('select').value,edges=Geo.breaks(values,4,method),counts=[0,0,0,0];
          const tiles=values.map((v,i)=>{const c=Geo.classify(v,edges);counts[c]++;return `<rect x="${60+i%6*80}" y="${40+Math.floor(i/6)*90}" width="76" height="86" rx="3" fill="${colours[c]}" stroke="#fff"/><text x="${98+i%6*80}" y="${88+Math.floor(i/6)*90}" text-anchor="middle" style="fill:${c===3?'#fff':'#254835'}">${v}</text>`;}).join('');
          draw(tiles+colours.map((c,i)=>`<rect x="${100+i*103}" y="239" width="20" height="13" fill="${c}"/><text class="small" x="${126+i*103}" y="250">Class ${i+1}: ${counts[i]}</text>`).join(''), 'Twelve synthetic density districts coloured by selected classification');
          output.textContent=`Breaks: ${edges.map(v=>format(v)).join(' / ')} · GVF ${Geo.gvf(values,edges).toFixed(3)} · class counts ${counts.join(', ')}.`;
        }; break;
      }
      case 'formats':
        controls.innerHTML=select('Container',[['gpkg','GeoPackage'],['json','GeoJSON'],['wkt','Plain geometry WKT'],['cog','COG raster']]);
        update=()=>{
          const kind=controls.querySelector('select').value;
          const steps={gpkg:[['CRS table','gpkg_spatial_ref_sys'],['Layer registry','gpkg_contents'],['Geometry column','gpkg_geometry_columns'],['Feature table','fid · geom · attributes']],json:[['Format contract','WGS 84 · lon, lat'],['Feature','properties + geometry'],['Coordinates','[4.9003, 52.3791]']],wkt:[['Geometry text','POINT(4.9003 52.3791)'],['Missing context','CRS / SRID from container']],cog:[['HTTP range request','Only relevant bytes'],['Overview / tile','Appropriate resolution'],['Pixel values','Embedded georeferencing']]}[kind];
          stage.innerHTML=`<div class="workflow">${steps.map(([a,b])=>`<div><b>${a}</b>${b}</div>`).join('')}</div>`;
          output.textContent={gpkg:'A single SQLite file keeps layer metadata, geometry and CRS definitions together.',json:'The format contract specifies WGS 84 longitude/latitude; no custom CRS member in RFC 7946.',wkt:'Plain geometry WKT needs external CRS context. EWKT can prefix an SRID.',cog:'Internal tiling and overviews support efficient partial reads with the right HTTP server/client.'}[kind];
        }; break;
      case 'qgis':
        controls.innerHTML=select('GUI action',[['project','Change project CRS'],['assign','Assign projection'],['transform','Reproject layer / Save As with CRS'],['buffer','Buffer projected stations'],['raster','Warp continuous raster']]);
        update=()=>{
          const action=controls.querySelector('select').value;
          const defs={project:['Display transform only','Stored values unchanged','No persistent gdf change'],assign:['Set verified CRS label','Stored values unchanged','gdf.set_crs(4326)'],transform:['Convert coordinate values','Same real-world positions','gdf.to_crs(32631)'],buffer:['Grow service polygons','Distance in layer units','geom.buffer(15000)'],raster:['Reproject and resample','Choose method for data','gdalwarp -r bilinear ...']}[action];
          stage.innerHTML=`<div class="workflow"><div><b>In QGIS</b>${defs[0]}</div><div><b>What happens</b>${defs[1]}</div><div><b>Code equivalent</b><code>${defs[2]}</code></div></div>`;
          output.textContent=action==='buffer'?'First verify the station layer is in a suitable metre-based CRS. Use 16 segments per quadrant to match the source.':defs[1]+'. Check the layer, not just the project status indicator.';
        }; break;
      case 'debugging':
        controls.innerHTML=select('Symptom',[['ocean','Dutch stations in the Indian Ocean'],['shift','Consistent 1–2 m shift'],['half','Raster half-cell shift'],['buffer','An enormous “100 m” buffer'],['stripe','Polygon across a world-wide stripe']]);
        update=()=>{
          const kind=controls.querySelector('select').value;
          const steps={ocean:['Inspect axis contract','Test both orders in Dutch AOI','Normalise only when unambiguous'],shift:['Inspect datum / epoch','Check selected operation / grids','Also investigate source accuracy'],half:['Inspect affine transform','Compare corners and centres','Check metadata; avoid double offset'],buffer:['Inspect source CRS units','Degrees are not metres','Project appropriately / use geography'],stripe:['Inspect ±180° crossing','Handle longitude wrap / cutting','Use appropriate geodesic strategy']}[kind];
          stage.innerHTML=`<div class="workflow">${steps.map((s,i)=>`<div><b>0${i+1}</b>${s}</div>`).join('')}</div>`;
          output.textContent='Test one hypothesis against a known point or expected numeric result. Keep the original data.';
        }; break;
      case 'coverage': {
        const data=Geo.population(),colours=['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026'],edges=[125,247,366,502,662,919];
        controls.innerHTML=range('Buffer radius · km',5,25,15,1)+'<button type="button" data-default>Reset to 15 km</button>';
        update=()=>{
          const radius=Number(controls.querySelector('input').value)*1000,result=Geo.coverage(data,radius);
          const scale=.003,px=x=>50+(x-570000)*scale,py=y=>15+(5820000-y)*scale;
          let tiles=data.cells.map((cell,i)=>`<rect x="${50+cell.col*6}" y="${15+cell.row*6}" width="6" height="6" fill="${result.memberships[i]?colours[Geo.classify(cell.value,edges)]:'#e6ebdc'}"/>`).join('');
          tiles+=result.rings.map(r=>`<polygon points="${r.map(([x,y])=>`${px(x)},${py(y)}`).join(' ')}" fill="none" stroke="#2d4e3b" stroke-width="1"/>`).join('');
          tiles+=data.stations.map((s,i)=>`<circle cx="${px(s.xy[0])}" cy="${py(s.xy[1])}" r="3" fill="#234835"/><text class="small" x="350" y="${50+i*42}">${s.name}: ${format(result.totals[i].people,0)}</text>`).join('');
          tiles+='<path d="M65 244h30m-30-3v6m30-6v6" stroke="#294733" stroke-width="2"/><text class="small" x="65" y="235">10 km</text><text class="small" x="50" y="278">Easting / northing · EPSG:32631 · metres · north up ↑</text>';
          draw(tiles,'Computed synthetic population grid with station buffers and 10 km scale bar');
          output.textContent=`${radius/1000} km · union: ${format(result.people,0)} people / ${result.cells} cells · excess counting: ${format(result.excess,0)}. Fixed legend: ≤247 / ≤366 / ≤502 / ≤662 / >662 people per cell.`;
        };
        controls.querySelector('[data-default]').addEventListener('click',()=>{controls.querySelector('input').value=15;update();});
        break;
      }
    }
    if (update) {
      controls.addEventListener('input', update);
      // Native select change is also emitted for keyboard use in all supported browsers.
      controls.addEventListener('change', update);
      update();
    }
  }
};
