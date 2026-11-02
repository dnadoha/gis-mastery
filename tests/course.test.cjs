const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
vm.runInContext(['course.js','geo.js','bangladesh.js','teaching.js','neighbourhood.js','beginner.js','programming.js','visuals.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n') + '\nthis.topics = TOPICS; this.geo = Geo; this.bd = Bangladesh; this.teaching = Teaching; this.neighbourhood = Neighbourhood; this.programming = Programming;', context);
const topics = context.topics, geo = context.geo;
const plain = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected, tolerance) => assert.ok(Math.abs(actual-expected)<=tolerance, `${actual} differs from ${expected} by more than ${tolerance}`);

test('18 unique topics with Python/Go challenges and 54 substantive field tasks', () => {
  assert.equal(topics.length,18);
  assert.equal(new Set(topics.map(t=>t.id)).size,18);
  assert.equal(Object.keys(context.programming.lessons).length,18);
  assert.equal(topics.reduce((s,t)=>s+t.tasks.length,0),54);
  topics.forEach(t=>{
    assert.match(t.id,/^[a-z-]+$/);
    assert.equal(t.exercises,undefined,'The old quiz bank must be removed');
    assert.equal(t.tasks.length,3);
    assert.ok(t.sections.length>=3);
    assert.equal(t.lab.length,3);
    assert.ok(t.reference && t.code && t.analogy && t.goals.length);
    const q=context.programming.lessons[t.id];
    assert.ok(q.title && q.prompt.length>100 && q.explanation && q.hint && q.criteria.length>=2);
    for(const language of ['python','go'])assert.ok(q[language].signature && q[language].body && q[language].tests.includes('check('));
    t.tasks.forEach(task=>assert.ok(task.title && task.prompt.length>30 && task.rubric.length>30));
  });
});

test('all 72 downloadable programs match the visible exercise definitions',()=>{
  const programming=context.programming;
  for(const t of topics)for(const language of ['python','go'])for(const solution of [false,true]){
    const file=path.join(root,'exercises',solution?'solutions':'',language,programming.filename(t.id,language));
    assert.equal(fs.readFileSync(file,'utf8'),programming.file(t.id,language,solution),`Stale download: ${file}`);
  }
});

test('the connected story has independently checkable distances, projection and unique population totals',()=>{
  const scene=context.neighbourhood,cells=scene.cells();
  near(scene.projected()[0],236377.4,.1);
  near(scene.projected()[1],2635628.6,.1);
  near(Math.hypot(scene.homes[0][0]-scene.schools[0][0],scene.homes[0][1]-scene.schools[0][1]),100,1e-10);
  assert.equal(cells.length,24);
  assert.equal(cells.reduce((sum,c)=>sum+c.people,0),240);
  assert.equal(cells.filter(c=>c.memberships===2).length,4);
  assert.equal(cells.filter(c=>c.memberships>0).reduce((sum,c)=>sum+c.people,0),200);
  scene.schools.forEach(([x,y])=>assert.equal(cells.filter(c=>Math.hypot(c.x-x,c.y-y)<=200).length,12));
  assert.equal(topics[0].id,'geometry');
  assert.ok(topics.findIndex(t=>t.id==='axes')<topics.findIndex(t=>t.id==='crs'));
  assert.ok(topics.findIndex(t=>t.id==='topology')<topics.findIndex(t=>t.id==='coverage'));
});

test('WGS 84 curvature and spherical distortion match source tables',()=>{
  near(geo.degreeLengths(0).lat,110574.3,.1);
  near(geo.degreeLengths(0).lon,111319.5,.1);
  near(geo.degreeLengths(52.3791).lat,111274.5,.1);
  near(geo.degreeLengths(52.3791).lon,68096.4,.1);
  near(geo.mercatorScale(60),2,1e-12);
  near(geo.mercatorScale(80)**2,33.16,.01);
});

test('sixth-order UTM coordinates match source reference within 0.1 m',()=>{
  const expected=[[629345.7,5804903.4],[644576.5,5773082.7],[601014.8,5753649.3],[590782.8,5770830.9]];
  geo.stations.forEach((s,i)=>geo.utm(s.lat,s.lon).forEach((value,j)=>near(value,expected[i][j],.1)));
  near(geo.utm(52,3)[0],500000,1e-8);
});

test('ring area, buffer approximation and non-boundary point inclusion',()=>{
  const square=[[0,0],[4,0],[4,3],[0,3]];
  assert.equal(geo.area(square),12);
  assert.equal(geo.area([...square].reverse()),-12);
  assert.equal(geo.area([]),0);
  assert.equal(geo.area([[0,0],[2,2],[2,0],[0,2]]),0);
  assert.equal(geo.pointInRing([2,2],square),true);
  assert.equal(geo.pointInRing([5,2],square),false);
  near(geo.area(geo.circle([629345.7,5804903.4],15000)),705723410.4,.1);
});

test('cell centres and bilinear interpolation match source examples',()=>{
  assert.deepEqual(plain(geo.cellCentre(0,0)),[571000,5819000]);
  assert.deepEqual(plain(geo.cellCentre(29,7)),[629000,5805000]);
  assert.equal(geo.bilinear(.25,.5),22.5);
  assert.equal(geo.bilinear(.5,.5),25);
  assert.equal(geo.bilinear(0,0),10);
  assert.equal(geo.bilinear(1,1),40);
});

test('classifications and GVF match the independently supplied density checkpoints',()=>{
  const values=[120,135,150,160,180,210,250,900,1100,1250,4000,5200];
  for(const [method,edges,gvf] of [
    ['equal',[120,1390,2660,3930,5200],.919],
    ['quantile',[120,157.5,230,1137.5,5200],.725],
    ['jenks',[120,250,1250,4000,5200],.998]
  ]) {
    assert.deepEqual(plain(geo.breaks(values,4,method)),edges);
    near(geo.gvf(values,edges),gvf,.0006);
  }
  assert.equal(geo.classify(250,[120,250,1250,4000,5200]),0);
  assert.equal(geo.classify(5200,[120,250,1250,4000,5200]),3);
});

test('synthetic raster and all zonal/union checkpoints match the source',()=>{
  const data=geo.population(),result=geo.coverage(data,15000);
  assert.equal(data.cells.length,1800);
  assert.equal(data.cells.reduce((sum,c)=>sum+c.value,0),329481);
  assert.equal(Math.min(...data.cells.map(c=>c.value)),20);
  assert.equal(Math.max(...data.cells.map(c=>c.value)),919);
  assert.deepEqual(plain(result.totals),[{cells:179,people:79031},{cells:178,people:53908},{cells:175,people:82813},{cells:179,people:77700}]);
  assert.equal(result.cells,674);
  assert.equal(result.people,270955);
  assert.equal(result.excess,22497);
  assert.deepEqual(plain(result.counts),[1126,637,37,0,0]);
  assert.equal(result.totals.reduce((s,t)=>s+t.people,0),result.people+result.excess);
  const vals=data.cells.filter((_,i)=>result.memberships[i]).map(c=>c.value);
  assert.deepEqual(plain(geo.breaks(vals,5,'jenks')),[125,247,366,502,662,919]);
  near(geo.gvf(vals,geo.breaks(vals,5,'jenks')),.9560,.0001);
  near(geo.gvf(vals,geo.breaks(vals,5,'equal')),.9496,.0001);
  near(geo.gvf(vals,geo.breaks(vals,5,'quantile')),.9419,.0001);
});

test('coverage radii change masks, not population; union is monotone',()=>{
  const data=geo.population();
  const small=geo.coverage(data,5000),large=geo.coverage(data,25000);
  assert.ok(small.people < 270955 && large.people > 270955);
  assert.ok(small.cells < 674 && large.cells > 674);
  assert.ok(small.memberships.every((count,i)=>!count || large.memberships[i]));
  assert.equal(data.cells.reduce((sum,c)=>sum+c.value,0),329481);
});

test('every topic has a visual lab branch and local linked assets exist',()=>{
  const visuals=fs.readFileSync(path.join(root,'visuals.js'),'utf8');
  topics.forEach(t=>assert.ok(visuals.includes(`case '${t.id}':`),`Missing lab for ${t.id}`));
  for(const file of ['index.html','styles.css','app.js','assets/mark.svg','core-geospatial-concepts.md','data/stations.csv','data/stations_mixed.csv','data/stations_raw.csv'])assert.ok(fs.existsSync(path.join(root,file)));
});

test('regional teaching examples retain analogies, relevant schematics and challenges without photo filler',()=>{
  const bd=context.bd;
  topics.forEach(t=>{
    const local=bd.lessons[t.id];
    assert.equal(t.analogy,local.analogy);
    assert.ok(t.analogy.length>100 && local.bridge.length>70 && local.limit.length>70);
    assert.equal(local.steps.length,3);
    assert.ok(t.tasks[2].title.startsWith('Bangladesh challenge'));
    const html=bd.sectionHTML(t);
    assert.equal((html.match(/<svg /g)||[]).length,1);
    assert.equal((html.match(/<img /g)||[]).length,0);
    assert.ok(html.includes('Where the analogy stops'));
    assert.ok(!html.includes('NaN'));
  });
});

test('instructional figures are placed in explanations with reading guides, checks and provenance',()=>{
  const teaching=context.teaching;
  for(const [key,figure] of Object.entries(teaching.figures)) {
    assert.ok(figure.author && figure.license && figure.alt && figure.original);
    const bytes=fs.readFileSync(path.join(root,'assets/figures',figure.file));
    if(figure.file.endsWith('.svg')) {
      const svg=bytes.toString('utf8');
      assert.match(svg,/<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/);
      assert.match(svg,/<title[^>]*>.+<\/title>/);
      assert.match(svg,/<desc[^>]*>.+<\/desc>/);
      assert.ok(!svg.includes('NaN') && !svg.includes('Infinity'));
      assert.ok(fs.existsSync(path.join(root,figure.original)));
      assert.ok(fs.existsSync(path.join(root,figure.licenseUrl)));
    } else {
      assert.ok(figure.original.startsWith('https://'));
      assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    }
    const html=teaching.figure(key,'Read this labelled comparison.','What changed?','The explained concept.');
    assert.ok(html.includes('How to read it.') && html.includes('Check yourself:') && html.includes(figure.source));
    assert.ok(!html.includes('assets/photos/'));
  }
  const geometry=topics.find(t=>t.id==='geometry');
  assert.ok(geometry.sections.length>=12);
  const text=geometry.sections.map(s=>s[1]).join('');
  for(const key of ['point','line','polygon','ring','multiLine','multiPolygon','collection','fundamentals','holes','invalidHoles','repair','slivers','shared'])assert.ok(text.includes(`data-concept-figure="${key}"`),`Geometry misses ${key}`);
  assert.ok(text.includes('can be open or closed'));
  assert.ok(text.includes('90.4125, 23.8103'));
  assert.ok(text.includes('three coordinate ordinates but remains a dimension-0'));
  assert.ok(topics.find(t=>t.id==='topology').sections[0][1].includes('topo-fundamentals.png'));
});
