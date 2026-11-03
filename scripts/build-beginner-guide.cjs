/* Rebuild the connected guide and its shared neighbourhood pictures. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {topics,beginner,scene,reference,programming}=vm.runInNewContext(
  ['course.js','geo.js','bangladesh.js','teaching.js','neighbourhood.js','beginner.js','reference-data.js','programming.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n')+
  '\n({topics:TOPICS,beginner:Beginner,scene:Neighbourhood,reference:ReferenceData,programming:Programming});'
);
const source=fs.readFileSync(path.join(root,'core-geospatial-concepts.md'),'utf8');
if(crypto.createHash('sha256').update(source).digest('hex')!==reference.sourceSha256)throw Error('Rebuild the complete reference first: npm run build');
const intro=`# GIS from zero: one neighbourhood, one connected story

## The question we will answer

**How many people live near at least one school?**

We will build one invented neighbourhood near Dhaka. It has Schools A and B, homes, roads and a park. Each chapter solves the next small part of that same question. The data is for learning, not a real school survey.

Start with chapter 1 and follow the order. You do not need to know any GIS terms first: each new term is explained where we use it. Each chapter reminds you what we already know, develops one idea, and explains why the next step is needed.

The sequence is: **draw the places → locate them → measure carefully → add population → count people once → explain and share the result**.

The [website](index.html) follows this same order. After this connected first reading, [Part 2 contains the complete technical note](#full-technical-reading): every source section, table, formula, code listing, exercise, solution and Appendix A. Each chapter links to its full-detail readings. The [coverage index](SOURCE-COVERAGE.md) maps all ${reference.counts.sections} source sections to the chapters and website. The technical exercises use their own Dutch station dataset.

Each chapter also has a [programming challenge in Python or Go](exercises/README.md), with a starter file, runnable checks, a hint and a worked solution. Run these programs locally and use the website to save drafts and record completion.

## Read in order

${topics.map((t,i)=>`${i+1}. [${t.title}](#topic-${t.id})`).join('\n')}

---
`;
const body=topics.map((topic,index)=>{
  const b=beginner.lessons[topic.id],f=beginner.figureInfo(topic),previous=topics[index-1],next=topics[index+1];
  if(f.file.startsWith('journey-')) fs.writeFileSync(path.join(root,'assets/figures',f.file),scene.diagram(b.figure[0])+'\n');
  const steps=b.steps.map(([heading,paragraphs],i)=>`### ${i+1}. ${heading}\n\n${paragraphs.join('\n\n')}${i===b.figure[1]?`\n\n![${f.alt}](assets/figures/${f.file})\n\n**Follow the picture:** ${f.read}\n\n*[Original project illustration and calculation notes](assets/figures/CREDITS.md#connected-neighbourhood-story).*`:''}`).join('\n\n');
  return `
<a id="topic-${topic.id}"></a>

## Chapter ${index+1}. ${b.title}

**${previous?'Where we left off':'Our starting point'}:** ${b.before}

**Why this step matters:** ${b.purpose}

${steps}

${topic.id==='qgis'?'[Download our School A CSV](data/neighbourhood-school.csv). The documented source CRS is `EPSG:4326`; `lon` is longitude and `lat` is latitude.\n\n':''}**What we can now say:** ${b.takeaway}

**Pause here:** ${b.check[0]}

<details>
<summary>Read the explanation after trying</summary>

${b.check[1]}

</details>

**${next?'Why we continue':'The complete picture'}:** ${b.after}

${previous?`[← ${previous.short}](#topic-${previous.id}) · `:''}${next?`[Next: ${next.short} →](#topic-${next.id})`:'[Review the whole path](#read-in-order)'}

**Full detail for this chapter:** ${reference.sections.filter(s=>s.topics.includes(topic.id)).map(s=>`[${s.title.replace(/`/g,'')}](#${s.anchor})`).join(' · ')}.

**Programming exercise:** [${programming.lessons[topic.id].title}](index.html#lesson/${topic.id}/practice). Download the [Python starter](exercises/python/${programming.filepath(topic.id,'python')}) or [Go starter](exercises/go/${programming.filepath(topic.id,'go')}); both include runnable checks. [Setup and solution files](exercises/README.md).

---
`;
}).join('');
const fullReading=`\n<a id="full-technical-reading"></a>\n\n# Part 2 — The complete technical reading\n\nThe original note follows in full, in its own sequence. Use the chapter links above to revisit its prerequisites. On the website, [full readings](index.html#reference) include short clarifications about precision terminology, projection assumptions, QGIS raster styling and the limits of the teaching code. The original source text is retained below.\n\n---\n\n`;
fs.writeFileSync(path.join(root,'beginner-geospatial-guide.md'),intro+body+fullReading+source);
console.log(`Built ${topics.length} connected chapters and their neighbourhood diagrams.`);
