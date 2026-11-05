const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const files=['phase5-course.js','phase5-data.js','phase6-course.js','phase6-data.js','phase56.js'];
const context={App:{state:{phase5:{},phase6:{}},storageAvailable:true},Beginner:{escape,inline:escape}};
vm.createContext(context);
const phases=vm.runInContext(files.map(read).join('\n')+'\n[Phase5,Phase6];',context);
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');

for(const phase of phases){
  test(`Phase ${phase.number}: every source character and heading survives with unique mapping`,()=>{
    const source=read(phase.data.source),mapped=phase.course.lessons.flatMap(l=>l.sources);
    assert.equal(phase.data.sourceSha256,sha(source));
    assert.equal(phase.data.sections.map(s=>s.markdown).join(''),source);
    assert.equal(phase.data.sections.length,phase.number===5?65:81);
    assert.equal(new Set(mapped).size,mapped.length);
    assert.deepEqual([...mapped].sort(),[...phase.data.sections.map(s=>s.key)].sort());
    for(const s of phase.data.sections){
      assert.equal(s.sha256,sha(s.markdown));assert.equal(s.markdown,source.slice(s.start,s.end));
      assert.ok(phase.lesson(s.topics[0]));
      assert.ok(read(`PHASE${phase.number}-COVERAGE.md`).includes(`#${phase.key}/reference/${s.id}`));
    }
  });
  test(`Phase ${phase.number}: listings, tables, source figures and complete exercise downloads remain available`,()=>{
    let tables=0,blocks=0,diagrams=0;
    for(const s of phase.data.sections){
      tables+=(s.html.match(/<table>/g)||[]).length;
      for(const m of s.markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)\n```/gm)){
        assert.ok(s.html.includes(escape(m[2])),`Truncated code in ${s.key}`);
        if(m[1]==='mermaid'){
          diagrams++;const svg=read(`assets/figures/${phase.key}-source-${s.id}.svg`);
          assert.match(svg,/<title /);assert.match(svg,/<desc /);assert.ok(!svg.includes('Syntax error'));
        }else blocks++;
      }
    }
    assert.equal(tables,phase.data.counts.tables);assert.equal(blocks,phase.data.counts.codeBlocks);assert.equal(diagrams,phase.data.counts.diagrams);
    for(const e of phase.course.exercises){
      assert.equal(read(`exercises/${phase.key}/exercise-${e.number}.md`),phase.section(`exercise-${e.number}`).markdown);
      assert.equal(read(`exercises/${phase.key}/solutions/exercise-${e.number}.md`),phase.section(`solution-${e.number}`).markdown);
      assert.equal(phase.lesson(e.lesson).exercise,e.number);
    }
  });
  test(`Phase ${phase.number}: every guided step has its own accessible, nonempty illustration`,()=>{
    const seen=new Set();let count=0;
    for(const l of phase.course.lessons){
      assert.equal(l.steps.length,3);assert.equal(l.check.length,2);
      for(const [i,step] of l.steps.entries()){
        const file=phase.figurePath(l,i);assert.ok(!seen.has(file));seen.add(file);
        assert.ok(step.visual.caption.length>60);assert.ok(step.text.length>100);
        const svg=read(file);
        assert.ok(svg.includes(`<title id="title">${escape(step.visual.title)}</title>`));
        assert.ok(svg.includes(`<desc id="desc">${escape(step.visual.caption)}</desc>`));
        assert.ok(!/NaN|Infinity|undefined/.test(svg));assert.ok(svg.includes('viewBox='));
        assert.ok(phase.figure(l,i).includes(file));count++;
      }
    }
    assert.equal(count,phase.data.counts.stepVisuals);
  });
}

test('Teaching chart values agree with independent NDVI, area, IDW and tile calculations',()=>{
  const [p5,p6]=phases;
  const [lon,lat,z]=[4.9,52.37,12],n=2**z;
  assert.equal(Math.floor((lon+180)/360*n),2103);
  assert.equal(Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n),1346);
  const bounds=p5.lesson('tile-math').steps[1].visual.bounds;
  assert.ok(bounds[0]<lon&&bounds[2]>lon&&bounds[1]<lat&&bounds[3]>lat);
  const spectra=[[0.05,0.45],[0.10,0.20],[0.20,0.28],[0.04,0.02]];
  const indices=p6.lesson('indices').steps[0].visual.values.map(v=>v[1]);
  spectra.forEach(([red,nir],i)=>assert.ok(Math.abs((nir-red)/(nir+red)-indices[i])<0.0001));
  const areas=p6.lesson('indices').steps[2].visual.values.map(v=>v[1]);
  assert.ok(Math.abs(areas.reduce((a,b)=>a+b,0)-16*30*30/10000)<1e-12);
  let numerator=0,denominator=0;
  for(const [x,y,rain] of [[0,0,10],[10,0,20],[0,10,30],[10,10,40]]){const w=1/((x-3)**2+(y-4)**2);numerator+=w*rain;denominator+=w;}
  assert.ok(Math.abs(numerator/denominator-20.644)<0.001);
  const radar=p6.lesson('change').steps[2].visual.values;
  assert.ok(Math.abs(radar[2][1]-10*Math.log10((0.01+0.1)/2))<0.001);
});

test('Math, alpha headings and clarifications remain separate from source text',()=>{
  const p6=phases[1];
  assert.equal(p6.data.counts.equations,21);assert.ok(p6.data.counts.inlineMath>200);
  for(const key of ['A.2.2','A.6.3','accuracy-assessment','shared-dataset','part-d'])assert.ok(p6.data.sections.some(s=>s.key===key));
  assert.ok(p6.section('A-2-2').html.includes('<math'));
  for(const phase of phases)for(const key of Object.keys(phase.course.clarifications)){
    const section=phase.data.sections.find(s=>s.key===key);assert.ok(section,key);
    assert.ok(phase.content(section).endsWith(section.html+'</div>'));
  }
});

test('New phase records are isolated and learner markup is escaped and safely fenced',()=>{
  context.App.state.phase5={'exercise-1':{complete:true,notes:'Tile ``` <script>literal</script>'},stack:{read:true}};
  context.App.state.phase6={indices:{notes:'Pixel <img src=x onerror=bad()>',read:true}};
  assert.equal(phases[0].completed(),1);assert.equal(phases[1].completed(),0);
  assert.ok(phases[0].exportNotes().includes('````text\nTile ``` <script>literal</script>\n````'));
  assert.ok(phases[1].notebookHTML().includes('&lt;img src=x onerror=bad()&gt;'));
  assert.ok(!phases[0].notebookHTML().includes('<script>literal'));
});
