/* Read the complete source beside the connected introduction; all content is build-generated. */
const Reference = {
  bridges: {
    geometry:'We began with school points, road paths and a park area. Now extend those shapes to holes, multipart objects, validity rules and the full geometry hierarchy. The opening sections also explain the course goals and study plan.',
    axes:'We kept longitude and latitude beside School A’s numbers. Now compare every tool’s field-order rules, then test the harder Dutch example where both swapped values pass a range check.',
    earth:'We agreed on a reference for the school. Now examine the ellipsoid parameters, reference frames, height surfaces and time-dependent changes behind that agreement.',
    crs:'Our school’s CRS label gave its numbers meaning. Now compare the complete CRS catalogue examples, axis definitions and choices for storing, measuring and displaying data.',
    projections:'We chose a local flat grid. Now work through the projection families, Mercator formulas, UTM parameters, zone exceptions and task-by-task choices.',
    transformations:'We separated assigning a label from calculating new numbers. Now follow the full transformation workflow, datum operations, grids, equations and tool equivalents.',
    distances:'Our school example separated a direct distance from a road route. Now compare spherical, ellipsoidal and projected measurements, with all six station pairs and the area calculations.',
    precision:'We separated repeated-position agreement from closeness to the accepted location. The source also uses precision to mean stored digits. Now connect both uses to scale, resolution, uncertainty and computer number formats.',
    'vector-raster':'Our schools were objects and our population was a grid. Now compare their storage, analysis, formats, cell sizes, missing values and memory costs in full.',
    geotransform:'We found each cell centre by moving half a cell from its corner. Now read the six-parameter formula, inverse lookup, array-order rules and complete population-grid application.',
    resampling:'We preserved population when combining four cells. Now choose methods for categories and continuous measurements, calculate interpolation weights, and handle missing values and repeated reprojections.',
    topology:'The two school areas overlapped. Now distinguish every boundary relationship, read all nine matrix positions, and compare the exact named-predicate patterns.',
    algorithms:'We checked a distance rule and a circular outline. Now follow the orientation, intersection, area, centroid, ray-casting, simplification and clipping algorithms, including their complete code.',
    coverage:'We counted 200 people once in our neighbourhood. The full project applies the same reasoning to four Dutch stations and a different population grid. Follow Exercises 1–4 in order, then compare your work with the complete solutions.',
    cartography:'Our legend explained which cells were selected. Now work through visual variables, every classification method, the full classification code, label anchors and the finished map.',
    formats:'We packaged School A with its coordinate rules. Now inspect the full format comparison, GeoPackage table relationships, PostGIS queries and assign/transform equivalents.',
    qgis:'We imported our School A file. The full lab uses the Dutch station files and proceeds through installation, CRS experiments, processing, styling, layout and scripting.',
    debugging:'We checked the school calculation from beginning to end. Now use the complete station investigation, 20-pitfall catalogue, ingest validator, performance practices and glossary.'
  },
  clarifications: {
    '2.6':'Here “precision” means the detail of the stored number. In our target diagram it means agreement among repeated readings. Both usages exist; neither proves accuracy. Keep a lossless original and choose reporting precision separately.',
    '4.2':'The sec(latitude) distortion factors are spherical approximations. EPSG:3857 applied to ellipsoidal latitude has slightly different directional scales. The simple UTM-zone formula also needs special-zone handling and a +180° endpoint rule (zone 60).',
    '4.4.3':'The short ray-casting function is an illustration with a half-open boundary convention. For real boundary points, including shared vertices, choose and test an explicit contains/covers rule rather than assuming this helper always assigns one neighbour.',
    '4.6':'Six decimal places are a common GeoJSON reporting choice, not a limit imposed by RFC 7946. Fine stored steps do not establish measurement accuracy. Combine uncertainty figures only when their meanings and independence assumptions are compatible.',
    '4.7.1':'In the four-class equal-interval example, 10 values enter the first class and 2 enter the last: the two middle classes are empty. “Wasting three colours” in the source interpretation should be read as this two-empty-class result.',
    '4.9':'QGIS Graduated styling applies to vector attributes. For raster cell values use Singleband pseudocolor, or convert cells to polygons before comparing the vector classification modes. Interface labels and the project’s initial CRS depend on the QGIS version and settings.',
    '5.2':'Coordinate magnitudes are clues, not proof: some valid projected coordinates are small. In this example, the station names, source context and expected Netherlands area provide the additional evidence.',
    'exercise-4':'For the QGIS classification comparison, use Singleband pseudocolor for a raster or polygonised cells for vector Graduated styling. Keep the same covered-cell subset and class-boundary convention when comparing outputs.',
    'solution-1':'The decimal recommendations are reporting choices. They are not a GeoJSON format maximum and do not justify discarding a lossless original. The float32 spacings and maximum round-to-nearest errors are separate numerical limits.',
    'solution-4':'For exact colour/statistics agreement, use the same class-boundary convention throughout: the source’s GVF code uses upper-inclusive bins, while Matplotlib BoundaryNorm normally uses lower-inclusive bins. In QGIS, Graduated is for vector fields; use Singleband pseudocolor for raster values. A 15 km radius is 7.5 of these 2 km cells; the diameter spans 15 cells.',
    'appendix-a':'This download preserves the source’s teaching helpers exactly. Vincenty has no coincident-point or non-convergence guard, shoelace assumes a non-empty ring, and the automatic UTM-zone formula omits special zones and the +180° endpoint. The demonstrated checkpoints do not establish correctness for those unsupported inputs. Use a tested production library for general inputs.'
  },
  escape(value) { return Beginner.escape(value); },
  section(id) { return ReferenceData.sections.find(s=>s.id===id); },
  forTopic(id) { return ReferenceData.sections.filter(s=>s.topics.includes(id)); },
  content(section) {
    const note=this.clarifications[section.key];
    const index=ReferenceData.sections.indexOf(section),children=[];
    if(section.headingOnly)for(let i=index+1;i<ReferenceData.sections.length&&ReferenceData.sections[i].depth>section.depth;i++)children.push(ReferenceData.sections[i]);
    return `${note?`<aside class="source-clarification"><strong>Reading clarification</strong><p>${this.escape(note)}</p></aside>`:''}<div class="source-text" data-source-id="${section.id}">${section.html}</div>${children.length?`<ol class="source-children">${children.map(s=>`<li><a href="#reference/${s.id}">${this.escape(s.title)}</a></li>`).join('')}</ol>`:''}${section.key==='appendix-a'?'<a class="button light" href="data/geolib.py" download>Download the complete geolib.py ↓</a>':''}`;
  },
  lessonHTML(topic) {
    const sections=this.forTopic(topic.id);
    return `<details id="section-source" class="lesson-block optional-learning full-source" tabindex="-1"><summary>Full detail from the original note · ${sections.length} sections</summary><p class="source-bridge">${this.escape(this.bridges[topic.id])}</p><p>These are the complete source readings, including tables, formulas, code and exercise criteria. The station examples use their own Dutch dataset. Follow the sections below in order; open solutions after attempting their exercises.</p><p><a href="#reference">See the complete coverage index →</a> · <a href="#reference/9-2">Look up a technical word →</a></p>${sections.map(s=>`<details id="section-source-${s.id}" class="source-entry" tabindex="-1"><summary>${this.escape(s.title)}</summary><div class="source-entry-body">${this.content(s)}<p class="source-location">Source lines ${s.lineStart}–${s.lineEnd} · <a href="#reference/${s.id}">Read this section on its own →</a></p></div></details>`).join('')}</details>`;
  },
  render(main,id) {
    if(!id) {this.index(main);return;}
    const section=this.section(id);
    if(!section){main.innerHTML='<section class="lesson-block"><h1>Section not found</h1><a href="#reference">Return to the full-note index →</a></section>';return;}
    const index=ReferenceData.sections.indexOf(section),previous=ReferenceData.sections[index-1],next=ReferenceData.sections[index+1];
    main.innerHTML=`<div class="reference-reader"><header class="lesson-header"><div class="eyebrow">COMPLETE NOTE / SECTION ${index+1} OF ${ReferenceData.sections.length}</div><h1>Read the full detail.</h1><p><a href="#reference">← All source sections</a> · <a href="#reference/9-2">Glossary</a></p><p>Connect this reading to ${section.topics.map(id=>`<a href="#lesson/${id}">chapter ${Beginner.path.indexOf(id)+1}: ${this.escape(Beginner.lessons[id].short)}</a>`).join(' or ')}.</p></header><article class="lesson-block">${this.content(section)}</article><nav class="lesson-pagination" aria-label="Previous and next source sections">${previous?`<a class="button light" href="#reference/${previous.id}">← ${this.escape(previous.title)}</a>`:'<a class="button light" href="#reference">← Source index</a>'}${next?`<a class="button primary" href="#reference/${next.id}">Next: ${this.escape(next.title)} →</a>`:'<a class="button primary" href="#reference">Review the complete coverage →</a>'}</nav><p class="source-location">Complete source section · lines ${section.lineStart}–${section.lineEnd} · <a href="core-geospatial-concepts.md" download>Download original Markdown ↓</a></p></div>`;
  },
  index(main) {
    const c=ReferenceData.counts;
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">EVERY SOURCE SECTION HAS A HOME</div><h1>The complete note, covered.</h1><p>Follow the full technical reading in source order, or find its place in the connected chapters. Every section below includes its original details. The beginner story is the first reading; these sections carry the complete technical depth.</p><p><strong>${c.sections} of ${c.sections} sections</strong> · ${c.tables} tables · ${c.codeBlocks} code/text listings · ${c.equations} equations · ${c.diagrams} rendered workflow diagrams · ${c.images} source illustrations</p><div class="resource-links"><a class="button primary" href="#reference/overview">Read the complete note →</a><a class="button light" href="#lesson/geometry">Begin with the connected story</a><a href="SOURCE-COVERAGE.md">Download the coverage index ↗</a><a href="data/geolib.py" download>geolib.py ↓</a></div></header><section class="lesson-block"><h2>Find a section</h2><label for="source-search">Search headings or the full source text</label><input id="source-search" type="search" placeholder="e.g. Helmert, float32, Solution 4"><p id="source-count" role="status" class="muted"></p><div id="source-index" class="source-index"></div></section>`;
    const render=()=>{
      const query=main.querySelector('#source-search').value.toLowerCase().trim();
      const sections=ReferenceData.sections.filter(s=>s.markdown.toLowerCase().includes(query));
      main.querySelector('#source-count').textContent=`${sections.length} of ${c.sections} source sections shown`;
      main.querySelector('#source-index').innerHTML=sections.map(s=>`<article class="source-index-entry" data-source-index="${s.id}"><h3><a href="#reference/${s.id}">${this.escape(s.title)}</a></h3><p>${s.topics.map(id=>`<a href="#lesson/${id}/source-${s.id}">Chapter ${Beginner.path.indexOf(id)+1}: ${this.escape(Beginner.lessons[id].short)}</a>`).join(' · ')}</p><small>Full source included · lines ${s.lineStart}–${s.lineEnd}</small></article>`).join('')||'<p>No matching section. Try another word.</p>';
    };
    main.querySelector('#source-search').addEventListener('input',render);render();
  }
};
