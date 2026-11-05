const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const files=['phase3-course.js','phase3-data.js','phase3.js'];
const {course,data,phase3}=vm.runInNewContext(files.map(read).join('\n')+'\n({course:Phase3Course,data:Phase3Data,phase3:Phase3});');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const section=key=>data.sections.find(s=>s.key===key);
const blocks=(key,lang)=>[...section(key).markdown.matchAll(new RegExp('```'+lang+'\\n([\\s\\S]*?)\\n```','g'))].map(m=>m[1]+'\n');

test('Phase 3 preserves the entire source with exact hashes and explicit unique mappings',()=>{
  const source=read('gis-note-phase3.md');
  assert.equal(data.sourceSha256,sha(source));
  assert.equal(data.sections.map(s=>s.markdown).join(''),source);
  assert.equal(data.sections.length,53);assert.equal(course.lessons.length,10);
  assert.equal(new Set(course.lessons.map(l=>l.id)).size,10);
  const mapped=course.lessons.flatMap(l=>l.sources);
  assert.equal(new Set(mapped).size,mapped.length);
  assert.deepEqual([...data.sections.map(s=>s.key)].sort(),[...mapped].sort());
  for(const s of data.sections){
    assert.equal(s.sha256,sha(s.markdown));assert.equal(s.markdown,source.slice(s.start,s.end));
    assert.ok(course.lessons.some(l=>l.id===s.topics[0]));assert.ok(s.html.includes('<h2>'));
    assert.ok(read('PHASE3-COVERAGE.md').includes(`index.html#phase3/reference/${s.id}`));
  }
});

test('Phase 3 renders every table, code block, equation and Mermaid diagram offline',()=>{
  let tables=0,codeBlocks=0,diagrams=0,equations=0;
  for(const s of data.sections){
    tables+=(s.html.match(/<table>/g)||[]).length;
    for(const m of s.markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)\n```/gm)){
      assert.ok(s.html.includes(escape(m[2])),`Missing code or schematic in ${s.key}`);
      if(m[1]==='mermaid'){
        diagrams++;const svg=read(`assets/figures/phase3-${s.id}.svg`);
        assert.match(svg,/<title /);assert.match(svg,/<desc /);assert.ok(!svg.includes('Syntax error'));
      }else codeBlocks++;
    }
    for(const m of s.markdown.matchAll(/\$\$([\s\S]*?)\$\$/g)){
      equations++;assert.ok(s.html.includes(escape(m[1].trim())));
      assert.ok(s.html.includes('<math'));assert.ok(!s.html.includes('katex-error'));
    }
  }
  assert.deepEqual({tables,codeBlocks,diagrams,equations},{tables:23,codeBlocks:33,diagrams:5,equations:4});
  for(const [key,value] of Object.entries({tables,codeBlocks,diagrams,equations}))assert.equal(data.counts[key],value);
});

test('guided chapters connect three steps, source readings, checks and all four exercises',()=>{
  for(const l of course.lessons){
    assert.equal(l.steps.length,3);assert.ok(l.before.length>60);assert.ok(l.after.length>50);
    assert.equal(l.check.length,2);assert.ok(l.takeaway.length>40);
    if(l.diagram)assert.ok(phase3.section(l.diagram).html.includes('source-diagram'));
  }
  assert.equal(course.exercises.length,4);
  for(const e of course.exercises){
    assert.ok(course.lessons.some(l=>l.id===e.lesson&&l.exercise===e.number));
    assert.equal(read(`exercises/phase3/exercise-${e.number}.md`),section(`exercise-${e.number}`).markdown);
    assert.ok(read(`exercises/phase3/solutions/exercise-${e.number}.md`).includes(section(`solution-${e.number}`).markdown));
    for(const file of e.files)assert.ok(fs.statSync(path.join(root,'exercises/phase3',file)).size>0,file);
  }
});

test('source code downloads match their listings, including the assembled road fixture',()=>{
  const expected={
    'solutions/fixtures.py':blocks('solution-1','python')[0]+'\n'+blocks('solution-4','python')[0],
    'solutions/check_ex1.py':blocks('solution-1','python')[1],
    'solutions/vector_ops.py':blocks('solution-2','python')[0],
    'solutions/test_vector_ops.py':blocks('solution-2','python')[1],
    'solutions/raster_ops.py':blocks('solution-3','python')[0],
    'solutions/scale_demo.py':blocks('solution-3','python')[1],
    'solutions/capstone.py':blocks('solution-4','python')[1],
    'solutions/capstone.sql':blocks('solution-4','sql')[0],
    'flood_exposure.py':blocks('5.2','python')[0],
    'javascript-examples.mjs':blocks('4.9','js')[0]
  };
  for(const [file,text] of Object.entries(expected))assert.equal(read('exercises/phase3/'+file),text,file);
  assert.ok(read('exercises/phase3/README.md').includes('not silently corrected or certified as executed'));
});

test('source clarifications remain separate and explain executable-example limitations',()=>{
  const notes=course.clarifications;
  assert.ok(notes['4.2'].includes('pyproj.transformer'));
  assert.ok(notes['4.3'].includes('defaults to 8'));
  assert.ok(notes['solution-3'].includes('class 0'));
  assert.ok(notes['exercise-4'].includes('point-only touch'));
  assert.ok(notes['solution-4'].includes('not a proven count'));
  for(const key of Object.keys(notes))assert.ok(section(key),key);
  const context={App:{state:{phase3:{}}},Beginner:{escape:value=>escape(String(value)),inline:value=>escape(String(value))}};
  vm.createContext(context);vm.runInContext(files.map(read).join('\n')+'\nthis.p=Phase3;',context);
  const s=section('4.2'),html=context.p.content(s);
  assert.ok(html.includes('Reading clarification'));assert.ok(html.endsWith(s.html+'</div>'));
});

test('Phase 3 notes and completion are isolated, escaped and safely fenced in export',()=>{
  const context={App:{state:{phase2:{'exercise-1':{complete:true}},phase3:{'exercise-2':{complete:true,notes:'a ``` draft <script>literal</script>'},crs:{read:true}}}},Beginner:{escape:value=>escape(String(value)),inline:value=>escape(String(value))}};
  vm.createContext(context);vm.runInContext(files.map(read).join('\n')+'\nthis.p=Phase3;',context);
  assert.equal(context.p.completed(),1);assert.equal(context.p.record('unknown').complete,undefined);
  assert.ok(context.p.exportNotes().includes('1/4 exercises completed (self-reported)'));
  assert.ok(context.p.exportNotes().includes('````text\na ``` draft <script>literal</script>\n````'));
  assert.ok(context.p.notebookHTML().includes('&lt;script&gt;literal&lt;/script&gt;'));
  assert.ok(!context.p.notebookHTML().includes('<script>'));
  assert.deepEqual(Object.keys(context.App.state),['phase2','phase3']);
});

test('Phase 3 integrates with static loading, routing, notebook, reset and builds',()=>{
  const html=read('index.html'),app=read('app.js'),pkg=JSON.parse(read('package.json'));
  for(const file of files){const index=html.indexOf(`src="${file}"`);assert.ok(index>=0&&index<html.indexOf('src="app.js"'));}
  assert.ok(html.includes('href="#phase3"'));assert.ok(html.includes('href="gis-note-phase3.md"'));
  assert.ok(app.includes("if(page==='phase3') Phase3.render(main,parts.slice(1))"));
  assert.ok(app.includes('Phase3.notebookHTML()'));assert.ok(app.includes('Phase3.exportNotes()'));
  assert.ok(app.includes("phase2:{},phase3:{},phase4:{},phase5:{},phase6:{},lastTopic:'geometry'"));
  assert.ok(pkg.scripts.build.includes('node scripts/build-phase3.cjs'));
  assert.equal(pkg.scripts['build:phase3'],'node scripts/build-phase3.cjs');
});
