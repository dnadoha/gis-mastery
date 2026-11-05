/* Reuse the source splitter and pinned Markdown / KaTeX / Mermaid pipeline. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {splitSource}=require('./build-reference.cjs');
const {render}=require('./phase56-figures.cjs');
const root=path.resolve(__dirname,'..');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function headingKey(title){
  const alpha=title.match(/^([A-D](?:\.\d+)+)\s/);
  if(alpha)return alpha[1];
  const part=title.match(/^Part ([A-D])\s/);
  if(part)return `part-${part[1].toLowerCase()}`;
  if(title==='Accuracy assessment')return 'accuracy-assessment';
  if(title.startsWith('Shared dataset for Exercises'))return 'shared-dataset';
  return null;
}
async function build(number,browser){
  const course=vm.runInNewContext(fs.readFileSync(path.join(root,`phase${number}-course.js`),'utf8')+`;Phase${number}Course`);
  const sourceName=`phase-${number}-note.md`,source=fs.readFileSync(path.join(root,sourceName),'utf8').replace(/\r\n/g,'\n');
  const mapping={};
  for(const lesson of course.lessons)for(const key of lesson.sources){
    if(mapping[key])throw Error(`Duplicate Phase ${number} mapping: ${key}`);
    mapping[key]=[lesson.id];
  }
  const sections=splitSource(source,mapping,headingKey);
  const counts={sections:sections.length,tables:0,codeBlocks:0,diagrams:0,equations:0,inlineMath:0,stepVisuals:0};
  const {Marked,Renderer}=await import('marked'),katex=require('katex');
  const renderer=new Renderer(),baseTable=renderer.table,diagrams=[];
  let current;
  renderer.heading=function(token){return `<h2>${this.parser.parseInline(token.tokens)}</h2>\n`;};
  renderer.table=function(token){counts.tables++;return `<div class="source-table" role="region" tabindex="0" aria-label="Table in ${escape(current.title)}">${baseTable.call(this,token)}</div>`;};
  renderer.code=function(token){
    const code=`<pre><code class="language-${escape(token.lang||'text')}">${escape(token.text)}</code></pre>`;
    if(token.lang!=='mermaid'){counts.codeBlocks++;return code;}
    const file=`assets/figures/phase${number}-source-${current.id}.svg`;
    if(diagrams.some(d=>d.file===file))throw Error(`Duplicate diagram in ${current.key}`);
    diagrams.push({file,text:token.text,title:current.title});counts.diagrams++;
    return `<figure class="source-diagram"><a href="${file}" target="_blank" rel="noopener noreferrer"><img src="${file}" alt="${escape(current.title)} — source diagram" loading="lazy"></a><figcaption>Source diagram · <a href="${file}" target="_blank" rel="noopener noreferrer">Enlarge ↗</a></figcaption></figure><details class="source-code"><summary>Mermaid definition</summary>${code}</details>`;
  };
  const marked=new Marked({gfm:true,renderer,extensions:[{
    name:'displayMath',level:'block',start:src=>src.indexOf('$$'),
    tokenizer(src){const m=/^\$\$([\s\S]*?)\$\$(?:[ \t]*\n|$)/.exec(src);if(m)return{type:'displayMath',raw:m[0],text:m[1].trim()};},
    renderer(token){counts.equations++;return `<div class="source-equation" tabindex="0" role="region" aria-label="Equation">${katex.renderToString(token.text,{displayMode:true,throwOnError:true,output:'htmlAndMathml',strict:'error'})}</div><details class="source-code"><summary>Equation notation (TeX)</summary><pre><code>${escape(token.text)}</code></pre></details>`;}
  },{
    name:'inlineMath',level:'inline',start:src=>src.indexOf('$'),
    tokenizer(src){const m=/^\$(?!\$)([^\n$]+?)\$(?!\$)/.exec(src);if(m)return{type:'inlineMath',raw:m[0],text:m[1]};},
    renderer(token){counts.inlineMath++;return katex.renderToString(token.text,{throwOnError:true,output:'htmlAndMathml',strict:'error'});}
  }]});
  for(const section of sections){current=section;section.html=marked.parse(section.markdown);section.sha256=sha(section.markdown);}
  const {renderMermaid}=await import('@mermaid-js/mermaid-cli');
  for(const diagram of diagrams){
    const {data}=await renderMermaid(browser,diagram.text,'svg',{fontEmbed:false,backgroundColor:'white',svgId:path.basename(diagram.file,'.svg'),mermaidConfig:{theme:'neutral',fontFamily:'Arial, Helvetica, sans-serif',deterministicIds:true,deterministicIDSeed:diagram.file,flowchart:{htmlLabels:false}}});
    const svg=Buffer.from(data).toString().replace(/<svg\b([^>]*)>/,(match,attrs)=>`<svg${attrs.replace(/\saria-labelledby="[^"]*"/g,'')} aria-labelledby="source-title source-desc"><title id="source-title">${escape(diagram.title)}</title><desc id="source-desc">Complete diagram from ${sourceName}; explanation follows in the source reader.</desc>`);
    fs.writeFileSync(path.join(root,diagram.file),svg+'\n');
  }
  for(const lesson of course.lessons)for(const [index,step] of lesson.steps.entries()){
    if(!step.visual?.caption)throw Error(`Missing step visual: ${number}/${lesson.id}/${index+1}`);
    fs.writeFileSync(path.join(root,`assets/figures/phase${number}-${lesson.id}-step-${index+1}.svg`),render(step.visual));
    counts.stepVisuals++;
  }
  const data={source:sourceName,sourceSha256:sha(source),counts,sections};
  fs.writeFileSync(path.join(root,`phase${number}-data.js`),`/* Generated by scripts/build-phase56.cjs. Source notes are read-only. */\nconst Phase${number}Data = `+JSON.stringify(data)+';\n');
  const directory=path.join(root,`exercises/phase${number}`);
  fs.mkdirSync(path.join(directory,'solutions'),{recursive:true});
  for(const e of course.exercises){
    const task=sections.find(s=>s.key===`exercise-${e.number}`),solution=sections.find(s=>s.key===`solution-${e.number}`);
    fs.writeFileSync(path.join(directory,`exercise-${e.number}.md`),task.markdown);
    fs.writeFileSync(path.join(directory,`solutions/exercise-${e.number}.md`),solution.markdown);
  }
  fs.writeFileSync(path.join(root,`PHASE${number}-COVERAGE.md`),`# Phase ${number} source and visual coverage\n\nThe app retains all ${counts.sections} sections, ${counts.tables} tables, ${counts.codeBlocks} code/text listings, ${counts.equations} displayed equations and ${counts.diagrams} source Mermaid diagrams. ${counts.stepVisuals} original step visuals accompany ${course.lessons.length} guided chapters. Notes are read without modification.\n\nLF-canonical source SHA-256: \`${data.sourceSha256}\`. Source slices reconstruct the complete note. Reference outputs are not evidence of live GIS execution.\n\n| Source section | Full reading | Guided chapter |\n|---|---|---|\n${sections.map(s=>`| ${s.title.replace(/\|/g,'\\|')} | [Read](index.html#phase${number}/reference/${s.id}) | [${s.topics[0]}](index.html#phase${number}/lesson/${s.topics[0]}) |`).join('\n')}\n\nRebuild: \`npm run build:phase56\`. Every step asset is generated from its own visual definition in \`phase${number}-course.js\`.\n`);
  console.log(`Built Phase ${number}:`,counts);
}
async function main(){
  const {default:puppeteer}=await import('puppeteer');
  const browser=await puppeteer.launch({headless:true,...(process.env.PUPPETEER_EXECUTABLE_PATH?{executablePath:process.env.PUPPETEER_EXECUTABLE_PATH}:{})});
  try{await build(5,browser);await build(6,browser);}finally{await browser.close();}
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={headingKey};
