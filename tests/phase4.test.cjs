const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const files=['phase4-course.js','phase4-data.js','phase4.js'];
const {course,data,phase}=vm.runInNewContext(files.map(read).join('\n')+'\n({course:Phase4Course,data:Phase4Data,phase:Phase4});');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const section=key=>data.sections.find(s=>s.key===key);
const sql=key=>[...section(key).markdown.matchAll(/```sql\n([\s\S]*?)\n```/g)].map(m=>m[1]+'\n').join('\n');

test('Phase 4 preserves all source text, hashes and unique chapter mappings',()=>{
  const source=read('phase-4-spatial-databases.md'),mapped=course.lessons.flatMap(l=>l.sources);
  assert.equal(data.sourceSha256,sha(source));assert.equal(data.sections.map(s=>s.markdown).join(''),source);
  assert.equal(data.sections.length,60);assert.equal(course.lessons.length,9);
  assert.equal(new Set(mapped).size,mapped.length);
  assert.deepEqual([...data.sections.map(s=>s.key)].sort(),[...mapped].sort());
  for(const s of data.sections){
    assert.equal(s.sha256,sha(s.markdown));assert.equal(s.markdown,source.slice(s.start,s.end));
    assert.ok(course.lessons.some(l=>l.id===s.topics[0]));assert.ok(s.html.includes('<h2>'));
    assert.ok(read('PHASE4-COVERAGE.md').includes(`index.html#phase4/reference/${s.id}`));
  }
});

test('all source tables, SQL, schematics and Mermaid diagrams are available offline',()=>{
  let tables=0,codeBlocks=0,diagrams=0;
  for(const s of data.sections){
    tables+=(s.html.match(/<table>/g)||[]).length;
    for(const m of s.markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)\n```/gm)){
      assert.ok(s.html.includes(escape(m[2])),`Missing listing in ${s.key}`);
      if(m[1]==='mermaid'){
        diagrams++;const svg=read(`assets/figures/phase4-${s.id}.svg`);
        assert.match(svg,/<title /);assert.match(svg,/<desc /);assert.ok(!svg.includes('Syntax error'));
      }else codeBlocks++;
    }
  }
  assert.deepEqual({tables,codeBlocks,diagrams},{tables:25,codeBlocks:37,diagrams:5});
  for(const [key,value] of Object.entries({tables,codeBlocks,diagrams}))assert.equal(data.counts[key],value);
});

test('connected chapters and all exercise downloads have complete source content',()=>{
  for(const l of course.lessons){
    assert.equal(l.steps.length,3);assert.ok(l.before.length>60);assert.ok(l.after.length>50);
    assert.equal(l.check.length,2);assert.ok(l.takeaway.length>40);
    if(l.diagram)assert.ok(phase.section(l.diagram).html.includes('source-diagram'));
  }
  for(const e of course.exercises){
    const key=course.solutionKeys[e.number];
    assert.ok(course.lessons.some(l=>l.id===e.lesson&&l.exercise===e.number));
    assert.equal(read(`exercises/phase4/exercise-${e.number}.md`),section(`exercise-${e.number}`).markdown);
    assert.ok(read(`exercises/phase4/solutions/exercise-${e.number}.md`).includes(section(key).markdown));
    assert.equal(read(`exercises/phase4/solutions/exercise-${e.number}.sql`),sql(key));
    for(const file of e.files)assert.ok(fs.statSync(path.join(root,'exercises/phase4',file)).size>0);
  }
  assert.equal(read('exercises/phase4/worked-example.sql'),['5.2','5.3','5.4','5.5','5.6','5.7','5.8'].map(sql).join('\n'));
  assert.equal(read('exercises/phase4/toy-graph.sql'),sql('4.6'));
  assert.equal(read('exercises/phase4/incident-mvt.sql'),sql('4.5.4'));
});

test('response-study arithmetic and historical nearest results are hand-verifiable',()=>{
  const stations=[[120000,487000],[123000,487000],[120000,490000]],incidents=[[120400,487300],[122000,487000],[121400,489000]];
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const nearest=points=>incidents.map(p=>points.map((s,i)=>[i+1,distance(p,s)]).sort((a,b)=>a[1]-b[1])[0]);
  assert.deepEqual(nearest(stations).map(([id,d])=>[id,d.toFixed(2)]),[[1,'500.00'],[2,'1000.00'],[3,'1720.47']]);
  assert.deepEqual(nearest([stations[0],[125000,487000],stations[2]]).map(([id,d])=>[id,d.toFixed(2)]),[[1,'500.00'],[1,'2000.00'],[3,'1720.47']]);
  assert.equal(stations.flatMap(s=>incidents.filter(p=>distance(s,p)<=2000)).length,4);
  assert.equal(stations.flatMap(s=>incidents.filter(p=>distance(s,p)<2000)).length,3);
  const edges=[[1,2,4],[1,3,2],[2,3,1],[2,4,5],[3,4,8],[3,5,10],[4,5,2],[4,6,6],[5,6,3]];
  function costs(start,oneWay=false){
    const d=Array(7).fill(Infinity);d[start]=0;
    for(let round=0;round<6;round++)for(const [u,v,c] of edges){d[v]=Math.min(d[v],d[u]+c);if(!(oneWay&&u===5&&v===6))d[u]=Math.min(d[u],d[v]+c);}
    return d;
  }
  assert.deepEqual([3,4,5].map(v=>costs(1)[v]),[2,8,10]);
  assert.deepEqual([3,4,5].map(v=>costs(6)[v]),[11,5,3]);
  assert.equal(costs(1)[6],13);assert.equal(costs(6,true)[5],8);
});

test('clarifications stay separate; notebook isolates, escapes and fences Phase 4 records',()=>{
  for(const key of Object.keys(course.clarifications))assert.ok(section(key),key);
  assert.match(course.clarifications['exercise-2'],/strict/);
  assert.match(course.clarifications['8.4'],/NULL/);
  const context={App:{state:{phase3:{'exercise-1':{complete:true}},phase4:{'exercise-2':{complete:true,notes:'SQL ``` <script>literal</script>'},registry:{read:true}}}},Beginner:{escape,inline:escape}};
  vm.createContext(context);vm.runInContext(files.map(read).join('\n')+'\nthis.p=Phase4;',context);
  assert.equal(context.p.completed(),1);assert.equal(context.p.record('unknown').complete,undefined);
  assert.ok(context.p.exportNotes().includes('````text\nSQL ``` <script>literal</script>\n````'));
  assert.ok(context.p.notebookHTML().includes('&lt;script&gt;literal&lt;/script&gt;'));
  assert.ok(!context.p.notebookHTML().includes('<script>'));
  assert.ok(context.App.state.phase3['exercise-1'].complete);
  const s=section('4.5.2');assert.ok(context.p.content(s).endsWith(s.html+'</div>'));
  assert.ok(context.p.content(s).includes('Reading clarification'));
});

test('Phase 4 integrates loading, routing, persistence, notebook and static builds',()=>{
  const html=read('index.html'),app=read('app.js'),pkg=JSON.parse(read('package.json'));
  for(const file of files){const index=html.indexOf(`src="${file}"`);assert.ok(index>=0&&index<html.indexOf('src="app.js"'));}
  assert.ok(html.includes('href="#phase4"'));assert.ok(html.includes('href="phase-4-spatial-databases.md"'));
  assert.ok(app.includes("if(page==='phase4') Phase4.render(main,parts.slice(1))"));
  assert.ok(app.includes('Phase4.notebookHTML()'));assert.ok(app.includes('Phase4.exportNotes()'));
  assert.ok(app.includes("phase2:{},phase3:{},phase4:{},phase5:{},phase6:{},lastTopic:'geometry'"));
  assert.ok(pkg.scripts.build.split(' && ').includes('node scripts/build-phase4.cjs'));
  assert.equal(pkg.scripts['build:phase4'],'node scripts/build-phase4.cjs');
});
