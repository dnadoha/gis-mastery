/* Build a complete, offline reading directly from the supplied Markdown. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),mapping=require('./reference-map.cjs');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const slug=value=>value.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu,'').replace(/ /g,'-');

function splitSource(source,sourceMapping=mapping) {
  const sections=[];let offset=0,fence=null;
  for(const line of source.match(/[^\n]*\n|[^\n]+$/g)||[]) {
    const marker=line.match(/^\s*(`{3,}|~{3,})/);
    if(marker) {
      if(!fence)fence=marker[1];
      else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence=null;
    } else if(!fence) {
      const heading=line.match(/^(#{1,6}) (.+?)\r?\n?$/);
      if(heading) {
        const title=heading[2],number=title.match(/^(\d+(?:\.\d+)*)(?:\.?\s)/)?.[1];
        const named=title.match(/^(Exercise|Solution) (\d+)/i);
        const key=heading[1].length===1?'overview':number|| (named?`${named[1].toLowerCase()}-${named[2]}`:title.startsWith('Appendix A')?'appendix-a':null);
        if(!sourceMapping[key])throw Error(`Unmapped source heading: ${title}`);
        if(sections.some(s=>s.key===key))throw Error(`Duplicate source key: ${key}`);
        sections.push({key,id:key.replaceAll('.','-'),title,anchor:slug(title),depth:heading[1].length,start:offset,topics:sourceMapping[key]});
      }
    }
    offset+=line.length;
  }
  for(const [i,s] of sections.entries()) {
    s.end=sections[i+1]?.start??source.length;
    s.markdown=source.slice(s.start,s.end);
    s.lineStart=source.slice(0,s.start).split('\n').length;
    s.lineEnd=s.lineStart+s.markdown.replace(/\n$/,'').split('\n').length-1;
  }
  if(sections.map(s=>s.markdown).join('')!==source)throw Error('Source text was lost during sectioning');
  for(const key of Object.keys(sourceMapping))if(!sections.some(s=>s.key===key))throw Error(`Stale source mapping: ${key}`);
  return sections;
}

async function build() {
  const {Marked,Renderer}=await import('marked'),katex=require('katex');
  const source=fs.readFileSync(path.join(root,'core-geospatial-concepts.md'),'utf8').replace(/\r\n/g,'\n'),sections=splitSource(source);
  const byAnchor=new Map(sections.map(s=>[s.anchor,s.id]));
  const course=vm.runInNewContext(['course.js','beginner.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')+'\n({topics:TOPICS,path:Beginner.path});');
  for(const s of sections)for(const id of s.topics)if(!course.path.includes(id))throw Error(`Unknown lesson ${id}`);
  const counts={sections:sections.length,tables:0,codeBlocks:0,diagrams:0,equations:0,images:0};
  const diagrams=[];
  let current;
  const renderer=new Renderer();
  const baseTable=renderer.table,baseLink=renderer.link;
  renderer.table=function(token){counts.tables++;return `<div class="source-table" role="region" aria-label="Table in ${escape(current.title)}" tabindex="0">${baseTable.call(this,token)}</div>`;};
  renderer.heading=function(token){return `<h2>${this.parser.parseInline(token.tokens)}</h2>\n`;};
  renderer.image=function(token){counts.images++;return `<a href="${escape(token.href)}" target="_blank" rel="noopener noreferrer"><img src="${escape(token.href)}" alt="${escape(token.text)}" loading="lazy" decoding="async"></a>`;};
  renderer.link=function(token){
    if(token.href.startsWith('#')&&byAnchor.has(token.href.slice(1))) token={...token,href:`#reference/${byAnchor.get(token.href.slice(1))}`};
    if(token.href==='index.html')token={...token,href:'#home'};
    return baseLink.call(this,token);
  };
  renderer.code=function(token){
    const code=`<pre><code class="language-${escape(token.lang||'text')}">${escape(token.text)}</code></pre>`;
    if(token.lang==='mermaid') {
      counts.diagrams++;
      const file=`assets/figures/reference-${current.id}.svg`;
      if(diagrams.some(d=>d.file===file))throw Error(`More than one diagram in ${current.key}; give each a unique asset`);
      diagrams.push({file,text:token.text,title:current.title});
      return `<figure class="source-diagram"><a href="${file}" target="_blank" rel="noopener noreferrer"><img src="${file}" alt="${escape(current.title)} — follow the connected labelled steps; the reading guide follows below." loading="lazy" decoding="async"></a><figcaption><a href="${file}" target="_blank" rel="noopener noreferrer">Open diagram at full size ↗</a></figcaption></figure><details class="source-code"><summary>Diagram definition (Mermaid)</summary>${code}</details>`;
    }
    counts.codeBlocks++;
    return code;
  };
  const marked=new Marked({gfm:true,renderer,extensions:[{
    name:'displayMath',level:'block',start:src=>src.indexOf('$$'),
    tokenizer(src){const m=/^\$\$\s*\n([\s\S]*?)\n\$\$(?:\n|$)/.exec(src);if(m)return{type:'displayMath',raw:m[0],text:m[1]};},
    renderer(token){counts.equations++;return `<div class="source-equation" tabindex="0" role="region" aria-label="Equation">${katex.renderToString(token.text,{displayMode:true,throwOnError:true,output:'htmlAndMathml',strict:'error'})}</div><details class="source-code"><summary>Equation notation (TeX)</summary><pre><code>${escape(token.text)}</code></pre></details>`;}
  }]});
  for(const s of sections) {
    current=s;
    s.html=marked.parse(s.markdown);
    s.sha256=sha(s.markdown);
    s.headingOnly=!s.markdown.replace(/^#{1,6}[^\n]*(?:\n|$)/,'').replace(/---|\s/g,'');
  }
  const fonts=path.join(root,'assets/vendor/katex');
  fs.mkdirSync(fonts,{recursive:true});
  fs.copyFileSync(path.join(root,'node_modules/katex/dist/katex.min.css'),path.join(fonts,'katex.min.css'));
  fs.copyFileSync(path.join(root,'node_modules/katex/LICENSE'),path.join(fonts,'LICENSE'));
  fs.cpSync(path.join(root,'node_modules/katex/dist/fonts'),path.join(fonts,'fonts'),{recursive:true});
  const diagramLicenses=path.join(root,'assets/vendor/mermaid');
  fs.mkdirSync(diagramLicenses,{recursive:true});
  fs.copyFileSync(path.join(root,'node_modules/mermaid/LICENSE'),path.join(diagramLicenses,'LICENSE'));
  fs.copyFileSync(path.join(root,'node_modules/@mermaid-js/mermaid-cli/LICENSE'),path.join(diagramLicenses,'CLI-LICENSE'));
  const {renderMermaid}=await import('@mermaid-js/mermaid-cli');
  const {default:puppeteer}=await import('puppeteer');
  const browser=await puppeteer.launch({headless:true,...(process.env.PUPPETEER_EXECUTABLE_PATH?{executablePath:process.env.PUPPETEER_EXECUTABLE_PATH}:{})});
  try {
    for(const d of diagrams) {
      const {data}=await renderMermaid(browser,d.text,'svg',{fontEmbed:false,backgroundColor:'white',svgId:path.basename(d.file,'.svg'),mermaidConfig:{theme:'neutral',fontFamily:'Arial, Helvetica, sans-serif',deterministicIds:true,deterministicIDSeed:d.file,flowchart:{htmlLabels:false},class:{htmlLabels:false}}});
      const svg=Buffer.from(data).toString().replace(/<svg\b([^>]*)>/,(match,attrs)=>`<svg${attrs.replace(/\saria-labelledby="[^"]*"/g,'')} aria-labelledby="reference-title reference-desc"><title id="reference-title">${escape(d.title)}</title><desc id="reference-desc">Rendered directly from the complete Mermaid definition in core-geospatial-concepts.md. All nodes, labels and relationships are retained.</desc>`);
      fs.writeFileSync(path.join(root,d.file),svg+'\n');
    }
  } finally { await browser.close(); }
  const data={source:'core-geospatial-concepts.md',sourceSha256:sha(source),counts,sections};
  fs.writeFileSync(path.join(root,'reference-data.js'),'/* Generated by scripts/build-reference.cjs; edit the source note and explicit mapping. */\nconst ReferenceData = '+JSON.stringify(data)+';\n');
  const appendix=sections.find(s=>s.key==='appendix-a').markdown.match(/```python\n([\s\S]*?)\n```/)[1];
  fs.writeFileSync(path.join(root,'data/geolib.py'),appendix+'\n');
  const report=`# Source coverage: Core Geospatial Concepts

This index maps every section of [the supplied note](core-geospatial-concepts.md) to its full website reading and connected beginner chapter. The chapter story introduces the idea; **Full detail from the original note** contains the complete source text, tables, code, tasks, hints, criteria and solutions assigned to that chapter. The [complete-note reader](index.html#reference) also follows the source order from preparation to Appendix A.

## What the audit added

The earlier chapter explanations were summaries. They did not reproduce every parameter, table row, formula, procedure or solution. The complete readings now include:

- Earth models, ellipsoid parameters, datum/frame versions and epochs; every CRS and axis-order comparison.
- All projection, curvature, distance, Helmert, orientation, area, geotransform and interpolation formulas.
- Geometry hierarchy, validity rules, full DE-9IM matrix/pattern tables, algorithms and boundary cases.
- Raster sampling, NoData, storage arithmetic, COG, numeric precision, classification and label placement.
- The full QGIS A–E lab, tool-equivalence tables, nine-part station investigation, 20 pitfalls and best practices.
- All four progressive exercises with their sample inputs, prerequisites, deliverables, tolerances and hints; all four full solutions and outputs.
- Study plan, glossary, authoritative reading list, next steps and the complete downloadable [geolib.py](data/geolib.py).

## Checked completeness

- **${counts.sections} / ${counts.sections} source sections** explicitly mapped, including introductory and parent sections.
- **${counts.tables} tables, ${counts.codeBlocks} code/text listings, ${counts.equations} displayed equations, ${counts.diagrams} Mermaid diagrams and ${counts.images} source images** rendered in the full readings.
- The saved source slices concatenate byte-for-byte to the LF-canonical UTF-8 source (no content edits); SHA-256: \`${data.sourceSha256}\`.
- Unmapped, duplicated or stale section mappings fail the build. Tests detect source changes, missing content, missing figures and stale generated output.
- This is a content-inclusion audit. External QGIS/PostGIS workflows and all third-party code examples are not thereby certified as executed. Short reading clarifications accompany source passages whose assumptions need care.

## Section-by-section locations

| Source section | Full website reading | Connected chapters | Source lines |
|---|---|---|---|
${sections.map(s=>`| ${s.title.replace(/\|/g,'\\|')} | [Read in full](index.html#reference/${s.id}) | ${s.topics.map(id=>`[${course.path.indexOf(id)+1}. ${course.topics.find(t=>t.id===id).short}](index.html#lesson/${id}/source-${s.id})`).join(' · ')} | ${s.lineStart}–${s.lineEnd} |`).join('\n')}

## Rebuild and verify

Run \`npm ci\`, then \`npm run build\` and \`npm test\`. Diagram generation uses Puppeteer/Chromium; set \`PUPPETEER_EXECUTABLE_PATH\` for an installed browser. The committed website needs no npm packages, CDN, math engine or diagram engine at runtime. The complete beginner download includes the full technical text after its connected first reading.
`;
  fs.writeFileSync(path.join(root,'SOURCE-COVERAGE.md'),report);
  console.log('Built complete reference:',counts);
}

if(require.main===module)build().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={splitSource};
