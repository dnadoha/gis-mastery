const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const {course,data,phase2}=vm.runInNewContext(['phase2-course.js','phase2-data.js','phase2.js'].map(read).join('\n')+'\n({course:Phase2Course,data:Phase2Data,phase2:Phase2});');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('Phase 2 includes all original text, source sections and explicit chapter mappings',()=>{
  const source=read('gis-note-phase2.md').replace(/\r\n/g,'\n');
  assert.equal(data.sourceSha256,sha(source),'Rebuild Phase 2 after editing the source');
  assert.equal(data.sections.map(s=>s.markdown).join(''),source);
  assert.equal(data.sections.length,81);
  assert.equal(course.lessons.length,12);
  assert.equal(new Set(course.lessons.map(l=>l.id)).size,12);
  const mapped=course.lessons.flatMap(l=>l.sources);
  assert.equal(new Set(mapped).size,mapped.length);
  assert.deepEqual([...data.sections.map(s=>s.key)].sort(),[...mapped].sort());
  for(const section of data.sections){
    assert.equal(section.sha256,sha(section.markdown));
    assert.equal(section.markdown,source.slice(section.start,section.end));
    assert.ok(course.lessons.some(l=>l.id===section.topics[0]));
    assert.ok(section.html.includes('<h2>'));
  }
});

test('Phase 2 keeps all tables, code blocks and six offline diagrams',()=>{
  let tables=0,blocks=0,diagrams=0;
  for(const section of data.sections){
    tables+=(section.html.match(/<table>/g)||[]).length;
    for(const match of section.markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)\n```/gm)){
      assert.ok(section.html.includes(escape(match[2])),`Truncated source code in ${section.key}`);
      if(match[1]==='mermaid'){
        diagrams++;
        const svg=read(`assets/figures/phase2-${section.id}.svg`);
        assert.match(svg,/<title /);assert.match(svg,/<desc /);assert.ok(!svg.includes('Syntax error'));
      } else blocks++;
    }
  }
  assert.equal(tables,30);assert.equal(blocks,44);assert.equal(diagrams,6);
  assert.equal(data.counts.tables,tables);assert.equal(data.counts.codeBlocks,blocks);assert.equal(data.counts.diagrams,diagrams);
  for(const l of course.lessons){assert.equal(l.steps.length,3);assert.ok(l.before.length>60);assert.ok(l.after.length>50);if(l.diagram)assert.ok(phase2.section(l.diagram).html.includes('source-diagram'));}
});

test('all five exercise tasks, full solutions, corrected helpers and report downloads exist',()=>{
  assert.equal(course.exercises.length,5);
  for(const exercise of course.exercises){
    const n=exercise.number;
    assert.equal(read(`exercises/phase2/exercise-${n}.md`),data.sections.find(s=>s.key===`exercise-${n}`).markdown);
    assert.ok(read(`exercises/phase2/solutions/exercise-${n}.md`).includes(data.sections.find(s=>s.key===`solution-${n}`).markdown));
    for(const file of exercise.files)assert.ok(fs.statSync(path.join(root,'exercises/phase2',file)).size>0,file);
    assert.ok(course.lessons.some(l=>l.id===exercise.lesson&&l.exercise===n));
  }
  assert.ok(read('exercises/phase2/commands.sh').includes('-a_nodata none'));
  assert.ok(read('exercises/phase2/check_geojson.py').includes('MultiPolygon'));
  assert.ok(read('exercises/phase2/verify_package.py').includes('raster/dem_cog.tif'));
  assert.ok(read('exercises/phase2/README.md').includes('NOT a full RFC 7946'));
});

test('service templates preserve WMS version-specific bbox order and the WMTS address',()=>{
  const urls=read('exercises/phase2/requests.txt').split('\n').filter(s=>s.startsWith('https://')).map(s=>new URL(s));
  const map=version=>urls.find(u=>u.searchParams.get('REQUEST')==='GetMap'&&u.searchParams.get('VERSION')===version&&u.searchParams.get(version==='1.3.0'?'CRS':'SRS')==='EPSG:4326');
  assert.equal(map('1.3.0').searchParams.get('BBOX'),'52.3728,4.892,52.3744,4.8945');
  assert.equal(map('1.1.1').searchParams.get('BBOX'),'4.892,52.3728,4.8945,52.3744');
  const tile=urls.find(u=>u.searchParams.get('REQUEST')==='GetTile');
  assert.equal(tile.searchParams.get('TILEMATRIX'),'14');assert.equal(tile.searchParams.get('TILEROW'),'5384');assert.equal(tile.searchParams.get('TILECOL'),'8414');
  const features=urls.find(u=>u.pathname.endsWith('/collections/parcels/items'));
  assert.equal(features.searchParams.get('bbox'),'4.892,52.3728,4.8945,52.3744');
});

test('Phase 2 completion stays separate and notebook export safely fences learner content',()=>{
  const context={App:{state:{phase2:{'exercise-1':{complete:true,notes:'a ``` fenced draft'},publishing:{read:true}}}},Beginner:{escape:value=>escape(String(value)),inline:value=>escape(String(value))}};
  vm.createContext(context);
  vm.runInContext(read('phase2-course.js')+'\n'+read('phase2-data.js')+'\n'+read('phase2.js')+'\nthis.p=Phase2;',context);
  assert.equal(context.p.completed(),1);
  const exported=context.p.exportNotes();
  assert.ok(exported.includes('1/5 exercises completed (self-reported)'));
  assert.ok(exported.includes('````text\na ``` fenced draft\n````'));
  assert.equal(context.p.record('unknown').complete,undefined);
  assert.deepEqual(Object.keys(context.App.state),['phase2']);
});

test('Phase 1 source splitter still uses the original map by default',()=>{
  const {splitSource}=require('../scripts/build-reference.cjs');
  assert.equal(splitSource(read('core-geospatial-concepts.md')).length,71);
  assert.throws(()=>splitSource('# Unexpected\n## 99. Unmapped\n'),/Unmapped/);
});
