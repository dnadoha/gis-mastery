const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'core-geospatial-concepts.md'),'utf8');
const {data,beginner,reference}=vm.runInNewContext(['course.js','beginner.js','reference-data.js','reference.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')+'\n({data:ReferenceData,beginner:Beginner,reference:Reference});');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('every source character and heading is included exactly once in the complete reading',()=>{
  assert.equal(data.sourceSha256,sha(source),'Source changed: run npm run build');
  assert.equal(data.sections.map(s=>s.markdown).join(''),source);
  const outsideFences=source.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'');
  const headings=[...outsideFences.matchAll(/^#{1,6} (.+)$/gm)].map(m=>m[1]);
  assert.deepEqual(Array.from(data.sections,s=>s.title),headings);
  assert.equal(new Set(data.sections.map(s=>s.id)).size,headings.length);
  let end=0;
  for(const s of data.sections){assert.equal(s.start,end);assert.equal(s.markdown,source.slice(s.start,s.end));assert.equal(s.sha256,sha(s.markdown));assert.ok(s.html.includes('<h2>'));end=s.end;}
  assert.equal(end,source.length);
});

test('every source section is available in its mapped chapter and full reader',()=>{
  const report=fs.readFileSync(path.join(root,'SOURCE-COVERAGE.md'),'utf8');
  for(const s of data.sections){
    assert.ok(s.topics.length);
    for(const id of s.topics){
      assert.ok(beginner.path.includes(id));
      assert.ok(reference.lessonHTML({id}).includes(`id="section-source-${s.id}"`));
      assert.ok(reference.lessonHTML({id}).includes(s.html),`${s.key}: shortened chapter reading`);
    }
    const main={innerHTML:''};reference.render(main,s.id);
    assert.ok(main.innerHTML.includes(s.html),`${s.key}: shortened source reader`);
    assert.ok(report.includes(`index.html#reference/${s.id}`));
  }
  for(const id of beginner.path)assert.ok(reference.forTopic(id).length,`No full detail for ${id}`);
});

test('full code, equations, tables and diagrams survive rendering instead of becoming summaries',()=>{
  let code=0,diagrams=0,equations=0,tables=0,images=0;
  for(const s of data.sections){
    for(const m of s.markdown.matchAll(/^```([^\n]*)\n([\s\S]*?)\n```/gm)){
      assert.ok(s.html.includes(escape(m[2])),`Truncated code in ${s.key}`);
      if(m[1]==='mermaid'){
        diagrams++;
        const file=path.join(root,`assets/figures/reference-${s.id}.svg`);
        assert.ok(fs.existsSync(file));
        const svg=fs.readFileSync(file,'utf8');assert.match(svg,/<title /);assert.match(svg,/<desc /);assert.ok(!svg.includes('Syntax error'));
      }else code++;
    }
    for(const m of s.markdown.matchAll(/^\$\$\s*\n([\s\S]*?)\n\$\$/gm)){
      equations++;assert.ok(s.html.includes(escape(m[1])),`Missing equation in ${s.key}`);assert.ok(s.html.includes('<math'));
    }
    tables+=(s.html.match(/<table>/g)||[]).length;
    images+=(s.markdown.match(/!\[/g)||[]).length;
    for(const m of s.html.matchAll(/<img[^>]+src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,m[1])),`Missing image ${m[1]}`);
  }
  assert.deepEqual({sections:data.sections.length,tables,codeBlocks:code,diagrams,equations,images},JSON.parse(JSON.stringify(data.counts)));
  assert.deepEqual({tables,code,diagrams,equations,images},{tables:34,code:33,diagrams:6,equations:9,images:16});
});

test('the complete download and Appendix A match the original source',()=>{
  const guide=fs.readFileSync(path.join(root,'beginner-geospatial-guide.md'),'utf8');
  assert.ok(guide.endsWith(source),'The complete guide must include the full technical note');
  const appendix=data.sections.find(s=>s.key==='appendix-a').markdown.match(/```python\n([\s\S]*?)\n```/)[1];
  assert.equal(fs.readFileSync(path.join(root,'data/geolib.py'),'utf8'),appendix+'\n');
  for(const s of data.sections)assert.ok(guide.includes(`](#${s.anchor})`),`Missing detailed-reading link ${s.key}`);
});
