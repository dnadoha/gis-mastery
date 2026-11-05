const App = {
  storageKey: 'gis-fieldnotes-v1',
  state: { checks: {}, coding: {}, tasks: {}, notes: {}, phase2: {}, phase3: {}, phase4: {}, phase5: {}, phase6: {}, lastTopic: 'geometry' },
  storageAvailable: true,
  activePage: '',
  filter: 'All topics',
  search: '',
  practiceSet: [],
  escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
  init() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
      if (saved && typeof saved === 'object') {
        for (const key of ['checks','coding','tasks','notes','phase2','phase3','phase4','phase5','phase6']) if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) this.state[key] = saved[key];
        if (TOPICS.some(t => t.id === saved.lastTopic)) this.state.lastTopic = saved.lastTopic;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch { this.storageAvailable = false; }
    document.getElementById('menu').addEventListener('click', () => this.toggleMenu());
    document.getElementById('close-menu').addEventListener('click', () => { this.toggleMenu(false); document.getElementById('menu').focus(); });
    document.getElementById('nav-backdrop').addEventListener('click', () => { this.toggleMenu(false); document.getElementById('menu').focus(); });
    document.getElementById('sidebar').addEventListener('click', event => { if (event.target.closest('a')) this.toggleMenu(false); });
    document.addEventListener('keydown', event => {
      const sidebar=document.getElementById('sidebar');
      if (!matchMedia('(max-width:700px)').matches || !sidebar.classList.contains('open')) return;
      if (event.key==='Escape') { this.toggleMenu(false);document.getElementById('menu').focus(); }
      if (event.key==='Tab') {
        const nodes=[...sidebar.querySelectorAll('a,button')],first=nodes[0],last=nodes.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    const mobile=matchMedia('(max-width:700px)');
    mobile.addEventListener('change',()=>this.toggleMenu(false));
    this.toggleMenu(false);
    window.addEventListener('hashchange', () => this.route(true));
    this.updateNav();
    this.route(false);
  },
  toggleMenu(force) {
    const sidebar = document.getElementById('sidebar');
    const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    const mobile=matchMedia('(max-width:700px)').matches;
    sidebar.inert=mobile&&!open;
    document.getElementById('nav-backdrop').hidden=!mobile||!open;
    document.body.classList.toggle('nav-open',mobile&&open);
    document.getElementById('menu').setAttribute('aria-expanded', String(open));
    if(mobile&&open)sidebar.querySelector('[aria-current="page"],a').focus();
  },
  save() {
    if (!this.storageAvailable) return;
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); }
    catch { this.storageAvailable = false; this.toast('Browser storage is unavailable. Export your notebook to keep this session.'); }
  },
  toast(message) {
    const node = document.getElementById('toast');
    node.textContent = message; node.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => node.classList.remove('visible'), 3500);
  },
  totals() {
    return { coding: TOPICS.filter(t=>Coding.completed(t.id)).length, tasks: TOPICS.reduce((s,t) => s+t.tasks.filter((_,i)=>this.state.tasks[`${t.id}-${i}`]).length,0) };
  },
  updateNav() {
    let group = '';
    document.getElementById('lesson-nav').innerHTML = '<div class="nav-phase">Phase 1 · Foundations</div>'+TOPICS.map((t,i) => {
      let label = '';
      if (group !== Beginner.group(t.id)) { group = Beginner.group(t.id); label = `<div class="nav-group">${group}</div>`; }
      return `${label}<a href="#lesson/${t.id}" data-topic="${t.id}"><span class="nav-num">${String(i+1).padStart(2,'0')}</span>${t.short}${Coding.completed(t.id)?'<span class="nav-check" aria-label="Programming exercise completed (self-reported)">✓</span>':''}</a>`;
    }).join('')+Phase2.navHTML()+Phase3.navHTML()+Phase4.navHTML()+Phase5.navHTML()+Phase6.navHTML();
    document.getElementById('total-progress').textContent = location.hash.startsWith('#phase4')?`${Phase4.completed()} / 4 Phase 4 exercises`:location.hash.startsWith('#phase3')?`${Phase3.completed()} / 4 Phase 3 exercises`:location.hash.startsWith('#phase2')?`${Phase2.completed()} / 5 Phase 2 exercises`:`${this.totals().coding} / ${Coding.count()} Phase 1 programs`;
    const studyPhase=location.hash.split('/')[0]==='#phase5'?Phase5:location.hash.split('/')[0]==='#phase6'?Phase6:null;
    if(studyPhase)document.getElementById('total-progress').textContent=`${studyPhase.completed()} / 4 Phase ${studyPhase.number} exercises`;
    document.querySelectorAll('[data-study-topic]').forEach(a=>{const active=location.hash.startsWith(`#${a.dataset.studyPhase}/lesson/`)&&a.dataset.studyTopic===location.hash.split('/')[2];a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const phase2Id=location.hash.split('/')[2];
    document.querySelectorAll('[data-phase2-topic]').forEach(a=>{const active=location.hash.startsWith('#phase2/lesson/')&&a.dataset.phase2Topic===phase2Id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const phase3Id=location.hash.split('/')[2];
    document.querySelectorAll('[data-phase3-topic]').forEach(a=>{const active=location.hash.startsWith('#phase3/lesson/')&&a.dataset.phase3Topic===phase3Id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const phase4Id=location.hash.split('/')[2];
    document.querySelectorAll('[data-phase4-topic]').forEach(a=>{const active=location.hash.startsWith('#phase4/lesson/')&&a.dataset.phase4Topic===phase4Id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const lessonId = location.hash.split('/')[1];
    document.querySelectorAll('[data-topic]').forEach(a => { const active = a.dataset.topic===lessonId; a.classList.toggle('active',active); if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
    const page = (location.hash.slice(1).split('/')[0] || 'home');
    document.querySelectorAll('[data-page]').forEach(a => { const active=a.dataset.page===page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
  },
  route(moveFocus) {
    const parts = location.hash.slice(1).split('/');
    let page = parts[0] || 'home';
    const topic = TOPICS.find(t => t.id === parts[1]);
    if (page==='lesson' && !topic) page='missing';
    if (!['home','lesson','practice','notebook','resources','reference','phase2','phase3','phase4','phase5','phase6','missing'].includes(page)) page='missing';
    const key = ['phase2','phase3','phase4','phase5','phase6'].includes(page)?parts.join('/'):page==='lesson'?`lesson/${topic.id}`:page==='reference'?`reference/${parts[1]||''}`:page;
    if (this.activePage!==key || page==='notebook') {
      this.activePage=key;
      const main=document.getElementById('main');
      if(page==='home') this.home(main);
      if(page==='lesson') this.lesson(main,topic);
      if(page==='practice') this.practice(main);
      if(page==='notebook') this.notebook(main);
      if(page==='resources') this.resources(main);
      if(page==='reference') Reference.render(main,parts[1]);
      if(page==='phase2') Phase2.render(main,parts.slice(1));
      if(page==='phase3') Phase3.render(main,parts.slice(1));
      if(page==='phase4') Phase4.render(main,parts.slice(1));
      if(page==='phase5') Phase5.render(main,parts.slice(1));
      if(page==='phase6') Phase6.render(main,parts.slice(1));
      if(page==='missing') main.innerHTML='<div class="empty-state"><h1>That trail isn’t on the map.</h1><p>Choose a topic from the sidebar or return to the learning path.</p><a class="button primary" href="#home">Back to the learning path</a></div>';
      if(!this.storageAvailable) main.insertAdjacentHTML('afterbegin','<div class="storage-warning">Browser storage is unavailable. Progress works for this session; export your notebook before closing the page.</div>');
      window.scrollTo(0,0);
      if(moveFocus) main.focus({preventScroll:true});
    }
    this.updateNav();
    const study=page==='phase5'?Phase5:page==='phase6'?Phase6:null;
    const title = study?`Phase ${study.number} · ${parts[1]==='lesson'?(study.lesson(parts[2])?.short||'Not found'):parts[1]==='reference'?'Complete note':parts[1]==='exercises'?'Workshop':study.course.short}`:topic && page==='lesson'?topic.short:page==='phase4'?`Phase 4 · ${parts[1]==='lesson'?(Phase4.lesson(parts[2])?.short||'Not found'):parts[1]==='reference'?'Complete note':parts[1]==='exercises'?'Spatial SQL workshop':'Spatial databases'}`:page==='phase3'?`Phase 3 · ${parts[1]==='lesson'?(Phase3.lesson(parts[2])?.short||'Not found'):parts[1]==='reference'?'Complete note':parts[1]==='exercises'?'Geoprocessing workshop':'Programmatic GIS'}`:page==='phase2'?`Phase 2 · ${parts[1]==='lesson'?(Phase2.lesson(parts[2])?.short||'Not found'):parts[1]==='reference'?'Complete note':parts[1]==='exercises'?'Publishing workshop':'Formats & standards'}`:{home:'Phase 1 · Foundations',practice:'Phase 1 · Coding exercises',notebook:'My field notebook',resources:'Reference shelf',reference:'Phase 1 · Complete note',missing:'Not found'}[page];
    document.getElementById('breadcrumb').textContent=title;
    document.title=`${title} — Fieldnotes`;
    if(page==='lesson' && parts[2]) {
      const section=document.getElementById(`section-${parts[2]}`);
      if(section){
        // A direct link into optional material should reveal its whole ancestor chain.
        for(let node=section;node;node=node.parentElement) if(node.tagName==='DETAILS') node.open=true;
        section.scrollIntoView({behavior:'instant',block:'start'});
        if(moveFocus)section.focus({preventScroll:true});
      }
    } else if(['phase2','phase3','phase4','phase5','phase6'].includes(page)&&parts[3]) {
      const section=document.getElementById(`${page}-${parts[3]}`);
      if(section){for(let node=section;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;section.scrollIntoView({block:'start'});if(moveFocus)section.focus({preventScroll:true});}
    } else if(moveFocus) {
      window.scrollTo(0,0);
    }
  },
  home(main) {
    const resume=TOPICS.find(t=>t.id===this.state.lastTopic)||TOPICS[0];
    main.innerHTML=`<section class="welcome"><div><div class="eyebrow">PHASE 1 · FOUNDATIONS / ONE CONNECTED STORY</div><h1>Learn GIS as one connected story.</h1><p>Start with a school dot. Finish with a result you can explain.</p></div></section><section class="phase-switch" aria-label="Choose a course phase"><span><strong>Phase 1:</strong> understand, locate and analyse places.</span><a class="button light" href="#phase2">Ready for Phase 2? Formats & standards →</a></section>
      <section class="hero"><div class="hero-copy"><div class="eyebrow">OUR QUESTION</div><h2>How many people live<br>near a school?</h2><p>We will build one invented neighbourhood near Dhaka. The same schools, roads and population grid stay with us throughout. Each chapter solves the next small part of the question.</p><div class="hero-actions"><a class="button primary" href="#lesson/${resume.id}">${resume.id==='geometry'?'Start chapter 1':`Continue chapter ${TOPICS.indexOf(resume)+1}`} <span aria-hidden="true">→</span></a>${resume.id!=='geometry'?'<a class="button light" href="#lesson/geometry">Read from the start</a>':'<a class="button light" href="beginner-geospatial-guide.md" download>Download the story ↓</a>'}</div></div><div class="hero-art"><img src="assets/figures/journey-geometry.svg" alt="Our invented neighbourhood with Schools A and B, homes, roads and a park."></div></section>
      <section class="lesson-block first-map" aria-labelledby="first-map-title"><div class="eyebrow">THE THREAD WE WILL FOLLOW</div><h2 id="first-map-title">Each step answers a question raised by the last.</h2><ol class="story-path"><li><b>Draw the places.</b> What should a school or road look like in our data?</li><li><b>Locate them.</b> How do numbers put each object in the right place?</li><li><b>Measure carefully.</b> What does “near a school” mean?</li><li><b>Add the people.</b> Which population cells meet our distance rule?</li><li><b>Count once.</b> What if one cell is near both schools?</li><li><b>Explain and share.</b> How can someone else understand and check the answer?</li></ol><p>Begin at chapter 1 and follow the Next links. New terms are explained inside the sentence where they first become useful. Each chapter tells you what we already know and why we need the next step.</p></section>
      <section aria-labelledby="path-title"><div class="section-heading"><div><h2 id="path-title">Read these chapters in order</h2><p>The sidebar, chapter numbers and Next links all follow this sequence.</p></div><div class="course-tools"><input id="topic-search" type="search" placeholder="Find a chapter…" aria-label="Search topics" value="${this.escape(this.search)}"></div></div><details class="path-filters"><summary>Find a topic to revisit</summary><div class="filter-chips" id="topic-filters">${['All topics','Locate','Analyse','Represent','Communicate','Integrate'].map(f=>`<button type="button" data-filter="${f}" class="${this.filter===f?'active':''}" aria-pressed="${this.filter===f}">${f}</button>`).join('')}</div></details><div id="course-grid" class="course-grid"></div><p id="topic-count" class="muted" role="status" style="font-size:11px;margin-top:12px"></p></section>
      <div class="learning-tip"><span class="stat-icon" aria-hidden="true">✦</span><div><strong>Keep one question in mind: how many people live near a school?</strong><p>Follow the chapter links to build the answer step by step. Each picture and pause question helps you connect the new idea to the neighbourhood you already know.</p></div></div>`;
    main.insertAdjacentHTML('beforeend','<section class="phase-switch" aria-label="Continue to programmatic GIS"><span><strong>Phase 3:</strong> automate a checked flood-exposure and clinic-access study.</span><a class="button light" href="#phase3">Programmatic GIS →</a></section>');
    main.insertAdjacentHTML('beforeend','<section class="phase-switch" aria-label="Continue to spatial databases"><span><strong>Phase 4:</strong> query, index and version shared spatial data.</span><a class="button light" href="#phase4">Spatial databases →</a></section>');
    main.insertAdjacentHTML('beforeend','<section class="phase-switch" aria-label="Continue to web GIS"><span><strong>Phase 5:</strong> publish, style and securely edit a web map.</span><a class="button light" href="#phase5">Web GIS & mapping →</a></section><section class="phase-switch" aria-label="Continue to spatial analysis"><span><strong>Phase 6:</strong> analyse imagery, terrain and 3D data with spatially valid ML.</span><a class="button light" href="#phase6">Analysis & remote sensing →</a></section>');
    this.cards();
    main.querySelector('#topic-search').addEventListener('input',event=>{this.search=event.target.value;this.cards();});
    main.querySelector('#topic-filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;this.filter=button.dataset.filter;main.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===this.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});this.cards();});
  },
  cards() {
    const query=this.search.toLowerCase().trim();
    const topics=TOPICS.filter(t=>(this.filter==='All topics'||t.group.endsWith(this.filter))&&`${t.title} ${t.short} ${t.summary} ${JSON.stringify(Beginner.lessons[t.id])} ${t.goals.join(' ')} ${t.sections.map(s=>s.join(' ')).join(' ')}`.toLowerCase().includes(query));
    document.getElementById('course-grid').innerHTML=topics.map(t=>{
      const index=TOPICS.indexOf(t);
      return `<article class="course-card"><a class="card-art" href="#lesson/${t.id}" aria-label="Read ${t.title}"><img src="assets/figures/${Beginner.figureInfo(t).file}" alt="" loading="lazy"><span class="lesson-tag">CHAPTER ${String(index+1).padStart(2,'0')}</span></a><div class="card-body"><div class="card-meta"><span class="pill green">${Beginner.group(t.id).split(' · ')[1]}</span></div><h3><a href="#lesson/${t.id}">${t.title}</a></h3><p>${Beginner.inline(t.summary)}</p><div class="card-bottom"><span>Same project · next step</span><a href="#lesson/${t.id}">Read chapter →</a></div></div></article>`;
    }).join('')||'<div class="empty-state">No topics match. Try “CRS”, “raster” or a different filter.</div>';
    document.getElementById('topic-count').textContent=`${topics.length} of ${TOPICS.length} topics shown`;
  },
  lesson(main,t) {
    this.state.lastTopic=t.id;this.save();
    const index=TOPICS.indexOf(t),base=`#lesson/${t.id}`;
    main.innerHTML=`<header class="lesson-header sequential-header"><div class="eyebrow">${Beginner.group(t.id)} / CHAPTER ${index+1} OF ${TOPICS.length}</div><h1>${t.title}</h1><p>${Beginner.inline(t.summary)}</p><nav class="lesson-quick-nav" aria-label="Jump to lesson section"><a href="${base}/understand">Read this chapter ↓</a><a href="${base}/practice">Programming exercise ↓</a><a href="${base}/source">Full source detail ↓</a><a href="${base}/notes">My notes ↓</a><a href="${base}/deeper">Extra reference ↓</a></nav></header>
      <div class="lesson-layout sequential-layout"><div class="lesson-content">${Beginner.lessonHTML(t)}
      ${Beginner.transitionHTML(t)}
      ${Reference.lessonHTML(t)}
      <details id="section-notes" class="lesson-block optional-learning" tabindex="-1"><summary>Keep one sentence in your own words</summary><p>How does this chapter help answer our school question? Write an explanation or a question you want to revisit.</p><textarea class="notes-area" id="topic-notes" aria-label="Your notes about ${t.short}" placeholder="Before this chapter we knew…\nNow we can…\nI am still wondering…">${this.escape(this.state.notes[t.id]||'')}</textarea><small id="note-status" class="muted" role="status">${this.storageAvailable?'Stored only in this browser.':'Session only. Export to keep your notes.'}</small></details>
      <div class="reference-divider"><h2>Extra material for later</h2><p>The connected reading continues with the Next button above. These optional experiments and references explore the topic further and may use different examples.</p></div>
      <details id="section-visual" class="lesson-block optional-learning" tabindex="-1"><summary>Extra interactive experiment</summary><h2>${t.lab[0]}</h2>${Beginner.labHTML(t)}<div class="visual-lab"><div class="lab-stage"></div><div class="lab-controls"></div><div class="lab-output" role="status" aria-live="polite" aria-atomic="true"></div></div><p class="lab-caption">${t.lab[2]}</p><details class="optional-code"><summary>Optional: see how this looks in code</summary><pre><code>${this.escape(t.code)}</code></pre><p>These Python/SQL snippets run in your own tools, not inside this page. The deeper explanation below introduces the technical details.</p><div class="trap"><b>When you implement it.</b> ${t.trap}</div></details></details>
      <details id="section-deeper" class="lesson-block optional-learning" tabindex="-1"><summary>Go deeper: technical explanations & more diagrams</summary><p class="optional-intro">This is the fuller reference material. It introduces additional terminology, formulas and implementation details.</p><h2>${t.referenceTitle}</h2><div class="analogy"><strong>Another way to think about it · Bangladesh analogy</strong>${t.analogy}</div><ul class="goals">${t.goals.map(g=>`<li>${g}</li>`).join('')}</ul><nav class="subtopic-nav" aria-label="Deeper concepts in this lesson">${t.sections.map(([h],i)=>`<a href="${base}/sub-${i}">${h}</a>`).join('')}</nav>${t.sections.map(([h,p],i)=>`<section class="concept-section" id="section-sub-${i}" tabindex="-1"><h3>${h}</h3><div>${p}</div></section>`).join('')}</details>
      <details class="lesson-block optional-learning"><summary>Another example: connect it to Bangladesh</summary>${Bangladesh.sectionHTML(t)}</details>
      <details id="section-practice" class="lesson-block optional-learning" tabindex="-1"><summary>Programming exercise · Python or Go</summary><h2>Build this chapter’s idea</h2>${Coding.intro()}<div id="lesson-exercises">${Coding.html(t)}</div></details>
      <details id="section-fieldwork" class="lesson-block optional-learning" tabindex="-1"><summary>Optional projects: use your own tools</summary><h2>Build something with it</h2><p>These are next-stage tasks, some requiring Python, SQL or QGIS. Review your work against the success criteria; a checked box records your own assessment.</p>${t.tasks.map((task,i)=>this.taskHTML(t,task,i)).join('')}</details>
      <details class="lesson-block optional-learning"><summary>Reading & references</summary><p>Full reference note sections: ${t.reference}. Use the beginner guide for a first reading and the technical note for formulas and extended exercises.</p><div class="resource-links"><a href="beginner-geospatial-guide.md">Plain-English beginner guide ↗</a><a href="core-geospatial-concepts.md">Full technical note ↗</a>${t.links.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</div></details>
      </div></div>`;
    Visuals.mount(t,main.querySelector('.visual-lab'));
    Coding.bind(main);
    main.querySelectorAll('[data-task]').forEach(input=>input.addEventListener('change',()=>{this.state.tasks[input.dataset.task]=input.checked;this.save();}));
    main.querySelector('#topic-notes').addEventListener('input',event=>{this.state.notes[t.id]=event.target.value;this.save();main.querySelector('#note-status').textContent=this.storageAvailable?'Saved in this browser.':'Session only. Export to keep your notes.';});
  },
  taskHTML(t,task,i) {
    const id=`${t.id}-${i}`;
    return `<article class="self-task"><span class="pill orange">Field task ${i+1} · self-assessed</span><h3 style="margin-top:12px">${task.title}</h3><p>${task.prompt}</p><details><summary>Review against the success criteria</summary><p style="margin-top:10px">${task.rubric}</p></details><label class="task-check"><input type="checkbox" data-task="${id}" ${this.state.tasks[id]?'checked':''}> I completed the task and reviewed my result.</label></article>`;
  },
  shuffle(values) {
    const result=[...values];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  },
  practice(main) {
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">LEARN BY WRITING CODE</div><h1>The programming workshop.</h1><p>${Coding.count()} hands-on challenges, one for every chapter. Start with bounding boxes, then build toward counting school coverage. Choose Python or Go for any exercise.</p></header><details class="lesson-block coding-setup" open><summary>How to work through an exercise</summary>${Coding.intro()}</details><div class="toolbar"><label>Topic <select id="practice-topic"><option value="all">All ${TOPICS.length} topics</option>${TOPICS.map(t=>`<option value="${t.id}">${t.short}</option>`).join('')}</select></label><label>Show <select id="practice-status"><option value="all">All exercises</option><option value="unfinished">Not yet completed</option><option value="completed">Completed (self-reported)</option></select></label><label>Skill <select id="practice-level"><option value="all">All skills</option><option>Start</option><option>Build</option><option>Debug</option></select></label><button id="draw-practice">Pick 3 challenges ↻</button><button id="all-practice" class="primary">Show all matches</button></div><p id="practice-count" class="muted" role="status" style="font-size:12px"></p><div id="practice-questions"></div>`;
    const render=(all=false)=>{
      const topicId=main.querySelector('#practice-topic').value,status=main.querySelector('#practice-status').value,level=main.querySelector('#practice-level').value;
      const candidates=TOPICS.filter(t=>(topicId==='all'||topicId===t.id)&&(level==='all'||Programming.lessons[t.id].level===level)&&(status==='all'||status==='unfinished'&&!Coding.completed(t.id)||status==='completed'&&Coding.completed(t.id)));
      this.practiceSet=all?candidates:this.shuffle(candidates).slice(0,3);
      main.querySelector('#practice-count').textContent=`Showing ${this.practiceSet.length} of ${candidates.length} matching programming exercises. Change filters to refresh the set.`;
      const container=main.querySelector('#practice-questions');
      container.innerHTML=this.practiceSet.map(t=>Coding.html(t)).join('')||'<div class="empty-state">No exercises in this selection. Change a filter or try another topic.</div>';
      Coding.bind(container);
    };
    main.querySelectorAll('.toolbar select').forEach(select=>select.addEventListener('change',()=>render(true)));
    main.querySelector('#draw-practice').addEventListener('click',()=>render());
    main.querySelector('#all-practice').addEventListener('click',()=>render(true));
    render(true);
  },
  notebook(main) {
    const totals=this.totals(),taskCount=TOPICS.reduce((sum,t)=>sum+t.tasks.length,0);
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">THE THINGS THAT STUCK</div><h1>Your field notebook.</h1><p>Your explanations, programming drafts and completed field tasks. Saved locally, never sent to a server.</p></header><div class="progress-summary"><h2>${totals.coding} / ${Coding.count()} programming exercises completed</h2><p>${totals.tasks} / ${taskCount} field tasks self-assessed.</p><div class="thin-progress"><span style="width:${totals.coding/Coding.count()*100}%"></span></div><small>Completion is self-reported after running the code locally. Finishing either language counts once per chapter. Editing a saved file clears that language’s completion until you re-run its checks.</small></div><div class="toolbar"><button id="export-notes" class="primary">Export notebook (.md) ↓</button><button id="print-notes">Print notebook</button><button id="reset-progress">Reset local progress</button></div><div class="notebook-grid">${TOPICS.map(t=>`<article class="notebook-card"><div class="eyebrow">${Beginner.group(t.id)}</div><h3><a href="#lesson/${t.id}">${t.title} ↗</a></h3><small class="muted">${Coding.completed(t.id)?'Program completed (self-reported)':'Program not yet completed'} · ${t.tasks.filter((_,i)=>this.state.tasks[`${t.id}-${i}`]).length}/${t.tasks.length} field tasks</small><p style="margin-top:14px">${this.escape(this.state.notes[t.id]||'No field notes yet. Use the link below to add your own explanation of this chapter.')}</p><p><a href="#lesson/${t.id}/practice">Open code & saved drafts →</a></p><a class="text-link" href="#lesson/${t.id}/notes">${this.state.notes[t.id]?'Edit notes':'Write a field note'} →</a></article>`).join('')}</div>`;
    main.querySelector('#export-notes').addEventListener('click',()=>this.exportNotes());
    main.insertAdjacentHTML('beforeend',Phase2.notebookHTML());
    main.insertAdjacentHTML('beforeend',Phase3.notebookHTML());
    main.insertAdjacentHTML('beforeend',Phase4.notebookHTML());
    main.insertAdjacentHTML('beforeend',Phase5.notebookHTML()+Phase6.notebookHTML());
    main.querySelector('#print-notes').addEventListener('click',()=>window.print());
    main.querySelector('#reset-progress').addEventListener('click',()=>{
      if(!confirm('Reset all saved code drafts, progress, field tasks and notes for this site? Export your notebook first if you want to keep it.'))return;
      this.state={checks:{},coding:{},tasks:{},notes:{},phase2:{},phase3:{},phase4:{},phase5:{},phase6:{},lastTopic:'geometry'};this.save();this.notebook(main);this.updateNav();this.toast('Local progress and notes reset.');
    });
  },
  download(name,content,type='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  exportNotes() {
    const fence=text=>'`'.repeat(Math.max(3,...(text.match(/`+/g)||[]).map(run=>run.length+1)));
    const content=`# My GIS field notebook\n\nExported ${new Date().toLocaleDateString()}\n\n${this.totals().coding}/${Coding.count()} programming exercises completed (self-reported); ${this.totals().tasks}/${TOPICS.reduce((sum,t)=>sum+t.tasks.length,0)} field tasks self-assessed.\n\n`+TOPICS.map(t=>{
      const record=this.state.coding[Programming.id(t.id)]||{};
      const drafts=Object.entries(Programming.languages).filter(([key])=>record[key]).map(([key,spec])=>{
        const saved=record[key],code=saved.code??Programming.file(t.id,key),delimiter=fence(code),output=saved.output||'';
        return `### ${spec.label} · ${saved.complete?'completed (self-reported)':'in progress'}\n\n${delimiter}${key}\n${code}\n${delimiter}\n\nLocal output / notes:\n\n${fence(output)}text\n${output}\n${fence(output)}\n`;
      }).join('\n');
      return `## ${t.title}\n\nSource sections: ${t.reference}.\n\n${this.state.notes[t.id]||'_No notes yet._'}\n\n### Programming exercise: ${Programming.lessons[t.id].title}\n\n${drafts||'_No saved code yet._'}\n\n### Field tasks\n${t.tasks.map((task,i)=>`- [${this.state.tasks[`${t.id}-${i}`]?'x':' '}] ${task.title}`).join('\n')}\n`;
    }).join('\n')+(Object.keys(this.state.checks).length?`\n## Archived quiz records\n\nThese prior records do not count toward programming completion.\n\n\`\`\`json\n${JSON.stringify(this.state.checks,null,2)}\n\`\`\`\n`:'');
    this.download('my-gis-fieldnotes.md',content+Phase2.exportNotes()+Phase3.exportNotes()+Phase4.exportNotes()+Phase5.exportNotes()+Phase6.exportNotes(),'text/markdown;charset=utf-8');
  },
  resources(main) {
    // The shared shelf links to Phase 2 without replacing Phase 1 downloads.
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">READ AT YOUR OWN PACE</div><h1>Your notes, files and next steps.</h1><p>Start with the beginner guide. Come back for tools and technical references when you need them.</p></header>
      <section class="lesson-block"><h2>Choose your reading</h2><p><b>First reading:</b> follow one neighbourhood project through 18 connected chapters. Each chapter recalls what we know, explains the next idea, and introduces the reason for continuing.</p><div class="resource-links"><a href="#lesson/geometry">Read from chapter 1 →</a><a href="beginner-geospatial-guide.md" download>Download the connected guide ↓</a></div><p style="margin-top:20px"><b>For a deeper study:</b> the technical note includes formulas, Python/SQL examples, progressive exercises and worked solutions. Its reference datasets are separate from the neighbourhood story.</p><div class="resource-links"><a href="core-geospatial-concepts.md">Read the technical note ↗</a><a href="core-geospatial-concepts.md" download>Download technical note ↓</a></div></section>
      <section class="lesson-block"><h2>Keep the thread while reading</h2><ol><li>Start with “Where we left off” to recall the previous step.</li><li>Read the three short sections in order; terms are explained when used.</li><li>Follow the same neighbourhood in the picture and answer the pause question.</li><li>Implement the chapter’s programming exercise in Python or Go.</li><li>Read “Why we continue”, then use Next to continue the story.</li></ol><p><a href="#practice">Open all 18 coding exercises →</a> · <a href="exercises/README.md">Downloadable starters, checks and solutions →</a></p></section>
      <section class="lesson-block"><h2>The file used in our story</h2><p><code>neighbourhood-school.csv</code> contains our invented School A. Its fields are <code>name</code>, <code>lon</code> (longitude) and <code>lat</code> (latitude). The documented source CRS is <code>EPSG:4326</code>. Use this file in chapter 17.</p><div class="resource-links"><a href="data/neighbourhood-school.csv" download>Download School A ↓</a><a href="#lesson/qgis">Open our QGIS chapter →</a></div></section>
      <details class="lesson-block optional-learning"><summary>Separate station data for the technical exercises</summary><p>These files describe the Dutch station examples in the full reference note, rather than the invented neighbourhood.</p><div class="resource-links"><a href="data/stations.csv" download>stations.csv ↓</a><a href="data/stations_mixed.csv" download>stations_mixed.csv ↓</a><a href="data/stations_raw.csv" download>stations_raw.csv ↓</a></div></details>
      <details class="lesson-block optional-learning"><summary>Later: tools for the full-note Python/QGIS projects</summary><p>The 18 chapter programming challenges use only the Python or Go standard library. The larger projects in the full technical note use Python 3.10+ and additional packages. QGIS is a separate desktop application; PostGIS is a database extension for spatial data.</p><pre><code>python -m venv .venv\n# Activate using your operating system’s instructions, then:\npython -m pip install numpy matplotlib pyproj shapely geopandas rasterio</code></pre><p>Check results against the note’s expected values with a sensible tolerance rather than requiring exactly identical numbers.</p></details>
      <details class="lesson-block optional-learning"><summary>Later: official documentation & technical references</summary><div class="resource-links">${[['EPSG registry','https://epsg.org/'],['PROJ','https://proj.org/'],['GDAL','https://gdal.org/'],['pyproj','https://pyproj4.github.io/pyproj/'],['Shapely','https://shapely.readthedocs.io/'],['GeoPandas','https://geopandas.org/'],['PostGIS','https://postgis.net/docs/'],['QGIS training','https://docs.qgis.org/latest/en/docs/training_manual/'],['GeoJSON RFC 7946','https://www.rfc-editor.org/rfc/rfc7946'],['GeoPackage','https://www.geopackage.org/'],['ColorBrewer','https://colorbrewer2.org/'],['USGS projection manual','https://pubs.usgs.gov/publication/pp1395']].map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${name} ↗</a>`).join('')}</div></details>`;
    main.insertAdjacentHTML('beforeend',`<section class="lesson-block"><h2>Every detail of the original note</h2><p>The complete reader includes all ${ReferenceData.counts.sections} source sections, formulas, tables, code listings, exercises, solutions and Appendix A. Each section is also available under Full source detail in the relevant chapter.</p><div class="resource-links"><a href="#reference">Explore the coverage index →</a><a href="#reference/overview">Read the full note in order →</a><a href="SOURCE-COVERAGE.md" download>Download coverage index ↓</a><a href="data/geolib.py" download>Download geolib.py ↓</a></div></section>`+Teaching.creditsHTML());
    main.insertAdjacentHTML('afterbegin','<section class="lesson-block"><h2>Phase 2 — Data formats and standards</h2><p>Continue with the Amsterdam publishing project, complete source note, five progressive exercises and corrected local helpers.</p><div class="resource-links"><a href="#phase2">Start Phase 2 →</a><a href="#phase2/reference">Complete Phase 2 note →</a><a href="exercises/phase2/README.md">Phase 2 files and setup →</a></div></section>');
    main.insertAdjacentHTML('beforeend','<section class="lesson-block"><h2>Phase 3 — Programmatic GIS</h2><p>Automate a synthetic flood study with GDAL, PROJ, GEOS, Python and JavaScript. Ten connected chapters, the complete source note and four progressive exercises.</p><div class="resource-links"><a href="#phase3">Start Phase 3 →</a><a href="#phase3/reference">Complete Phase 3 note →</a><a href="gis-note-phase3.md" download>Download original note ↓</a><a href="exercises/phase3/README.md">Phase 3 files and setup →</a></div></section>');
    main.insertAdjacentHTML('beforeend','<section class="lesson-block"><h2>Phase 4 — Spatial databases</h2><p>Build a synthetic emergency-response database with PostGIS, spatial SQL, query plans, pgRouting and valid-time history. Nine connected chapters and four progressive SQL exercises.</p><div class="resource-links"><a href="#phase4">Start Phase 4 →</a><a href="#phase4/reference">Complete Phase 4 note →</a><a href="phase-4-spatial-databases.md" download>Download original note ↓</a><a href="exercises/phase4/README.md">Phase 4 files and setup →</a></div></section>');
    for(const phase of [Phase5,Phase6])main.insertAdjacentHTML('beforeend',`<section class="lesson-block"><h2>Phase ${phase.number} — ${this.escape(phase.course.short)}</h2><p>${this.escape(phase.course.intro)} ${phase.course.lessons.length} chapters with a visual in every step.</p><div class="resource-links"><a href="#${phase.key}">Start Phase ${phase.number} →</a><a href="#${phase.key}/reference">Complete source reader →</a><a href="${phase.data.source}" download>Original note ↓</a><a href="exercises/${phase.key}/README.md">Exercise setup →</a></div></section>`);
  }
};

App.init();
