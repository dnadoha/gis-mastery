const App = {
  storageKey: 'gis-fieldnotes-v1',
  state: { checks: {}, tasks: {}, notes: {}, lastTopic: 'earth' },
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
        for (const key of ['checks','tasks','notes']) if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) this.state[key] = saved[key];
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
  mastered(topic) {
    return topic.exercises.filter((_,i) => this.state.checks[`${topic.id}-${i}`]?.mastered).length;
  },
  totals() {
    return { checks: TOPICS.reduce((s,t) => s+this.mastered(t),0), tasks: TOPICS.reduce((s,t) => s+t.tasks.filter((_,i)=>this.state.tasks[`${t.id}-${i}`]).length,0) };
  },
  updateNav() {
    let group = '';
    document.getElementById('lesson-nav').innerHTML = TOPICS.map((t,i) => {
      let label = '';
      if (group !== t.group) { group = t.group; label = `<div class="nav-group">${group}</div>`; }
      return `${label}<a href="#lesson/${t.id}" data-topic="${t.id}"><span class="nav-num">${String(i+1).padStart(2,'0')}</span>${t.short}${this.mastered(t)===t.exercises.length?'<span class="nav-check" aria-label="All checks passed">✓</span>':''}</a>`;
    }).join('');
    document.getElementById('total-progress').textContent = `${this.totals().checks} / 144 checks`;
    const lessonId = location.hash.split('/')[1];
    document.querySelectorAll('[data-topic]').forEach(a => { const active = a.dataset.topic===lessonId; a.classList.toggle('active',active); if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
    const page = (location.hash.slice(1).split('/')[0] || 'home');
    document.querySelectorAll('[data-page]').forEach(a => { const active=a.dataset.page===page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
    document.querySelectorAll('[data-lesson-score]').forEach(node => { const topic=TOPICS.find(t=>t.id===node.dataset.lessonScore);if(topic)node.textContent=`${this.mastered(topic)} / ${topic.exercises.length} checks passed`; });
    document.querySelectorAll('[data-lesson-progress]').forEach(node=>{const topic=TOPICS.find(t=>t.id===node.dataset.lessonProgress);if(topic)node.style.width=`${this.mastered(topic)/topic.exercises.length*100}%`;});
  },
  route(moveFocus) {
    const parts = location.hash.slice(1).split('/');
    let page = parts[0] || 'home';
    const topic = TOPICS.find(t => t.id === parts[1]);
    if (page==='lesson' && !topic) page='missing';
    if (!['home','lesson','practice','notebook','resources','missing'].includes(page)) page='missing';
    const key = page==='lesson'?`lesson/${topic.id}`:page;
    if (this.activePage!==key || page==='notebook') {
      this.activePage=key;
      const main=document.getElementById('main');
      if(page==='home') this.home(main);
      if(page==='lesson') this.lesson(main,topic);
      if(page==='practice') this.practice(main);
      if(page==='notebook') this.notebook(main);
      if(page==='resources') this.resources(main);
      if(page==='missing') main.innerHTML='<div class="empty-state"><h1>That trail isn’t on the map.</h1><p>Choose a topic from the sidebar or return to the learning path.</p><a class="button primary" href="#home">Back to the learning path</a></div>';
      if(!this.storageAvailable) main.insertAdjacentHTML('afterbegin','<div class="storage-warning">Browser storage is unavailable. Progress works for this session; export your notebook before closing the page.</div>');
      window.scrollTo(0,0);
      if(moveFocus) main.focus({preventScroll:true});
    }
    this.updateNav();
    const title = topic && page==='lesson'?topic.short:{home:'Learning path',practice:'Practice ground',notebook:'My field notebook',resources:'Reference shelf',missing:'Not found'}[page];
    document.getElementById('breadcrumb').textContent=title;
    document.title=`${title} — Fieldnotes`;
    if(page==='lesson' && parts[2]) {
      const section=document.getElementById(`section-${parts[2]}`);
      if(section){section.scrollIntoView({behavior:'instant',block:'start'});if(moveFocus)section.focus({preventScroll:true});}
    } else if(moveFocus) {
      window.scrollTo(0,0);
    }
  },
  home(main) {
    const progress=this.totals(), resume=TOPICS.find(t=>t.id===this.state.lastTopic)||TOPICS[0];
    main.innerHTML=`<section class="welcome"><div><div class="eyebrow">A LITTLE CURIOSITY. A LOT OF EXPLORING.</div><h1>Your journey into geospatial.</h1><p>From “what’s a CRS?” to “I can build that.” One experiment at a time.</p></div><span class="pill phase-badge"><span class="live-dot"></span> PHASE 01 · THE FOUNDATIONS</span></section>
      <section class="hero"><div class="hero-copy"><div class="eyebrow">LESS THEORY-ONLY. MORE HANDS-ON.</div><h2>Don’t just read the map.<br>Learn how it works.</h2><p>Small explanations. Visual experiments. Plenty of practice. Build a feel for GIS, not just a collection of notes.</p><div class="hero-actions"><a class="button primary" href="#lesson/${resume.id}">${progress.checks?'Continue learning':'Start exploring'} <span aria-hidden="true">→</span></a><a class="button light" href="#practice">Try an exercise ↗</a></div></div><div class="hero-art">${Visuals.hero()}<span class="hero-foot">EVERY COORDINATE TELLS A STORY.</span></div></section>
      <div class="stats"><div class="stat"><span class="stat-icon" aria-hidden="true">◫</span><div><strong>18</strong><small>visual topics · local analogies</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">✎</span><div><strong>${TOPICS.reduce((sum,t)=>sum+t.exercises.length+t.tasks.length,0)}</strong><small>questions & hands-on tasks</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">◷</span><div><strong>2–4 weeks</strong><small>at your own pace</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">↗</span><div><strong>${Math.round(progress.checks/144*100)}%</strong><small>checks passed · ${progress.checks}/144</small></div></div></div>
      <section aria-labelledby="path-title"><div class="section-heading"><div><h2 id="path-title">Your learning path</h2><p>Follow the trail, or jump to whatever you’re curious about.</p></div><div class="course-tools"><input id="topic-search" type="search" placeholder="Search a topic…" aria-label="Search topics" value="${this.escape(this.search)}"></div></div><div class="filter-chips" id="topic-filters">${['All topics','Locate','Analyse','Represent','Communicate','Integrate'].map(f=>`<button type="button" data-filter="${f}" class="${this.filter===f?'active':''}" aria-pressed="${this.filter===f}">${f}</button>`).join('')}</div><div id="course-grid" class="course-grid"></div><p id="topic-count" class="muted" role="status" style="font-size:11px;margin-top:12px"></p></section>
      <div class="learning-tip"><span class="stat-icon" aria-hidden="true">✦</span><div><strong>The fieldnotes method: predict → experiment → explain.</strong><p>Try each question before opening its solution. Then change something in the visual and explain what happened in your own words.</p></div></div>`;
    this.cards();
    main.querySelector('#topic-search').addEventListener('input',event=>{this.search=event.target.value;this.cards();});
    main.querySelector('#topic-filters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;this.filter=button.dataset.filter;main.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===this.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});this.cards();});
  },
  cards() {
    const query=this.search.toLowerCase().trim();
    const topics=TOPICS.filter(t=>(this.filter==='All topics'||t.group.endsWith(this.filter))&&`${t.title} ${t.short} ${t.summary} ${t.goals.join(' ')} ${t.sections.map(s=>s.join(' ')).join(' ')}`.toLowerCase().includes(query));
    document.getElementById('course-grid').innerHTML=topics.map(t=>{
      const index=TOPICS.indexOf(t),score=this.mastered(t);
      return `<article class="course-card"><a class="card-art" href="#lesson/${t.id}" aria-label="Explore ${t.title}">${Visuals.thumbnail(t.id,index)}<span class="lesson-tag">FIELDNOTE ${String(index+1).padStart(2,'0')}</span></a><div class="card-body"><div class="card-meta"><span class="pill ${t.level==='Foundation'?'green':t.level==='Field lab'?'orange':'blue'}">${t.level}</span><span>${t.time} MIN · ${t.group.split(' · ')[1].toUpperCase()}</span></div><h3><a href="#lesson/${t.id}">${t.title}</a></h3><p>${t.summary}</p><div class="card-bottom"><span>${score?`${score}/8 checks passed`:`8 checks + ${t.tasks.length} field tasks`}</span><a href="#lesson/${t.id}">${score?'Keep exploring':'Explore topic'} →</a></div><div class="thin-progress" aria-label="${score} of 8 checks passed"><span style="width:${score/8*100}%"></span></div></div></article>`;
    }).join('')||'<div class="empty-state">No topics match. Try “CRS”, “raster” or a different filter.</div>';
    document.getElementById('topic-count').textContent=`${topics.length} of ${TOPICS.length} topics shown`;
  },
  lesson(main,t) {
    this.state.lastTopic=t.id;this.save();
    const index=TOPICS.indexOf(t),base=`#lesson/${t.id}`;
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">${t.group} / FIELDNOTE ${String(index+1).padStart(2,'0')}</div><h1>${t.title}</h1><p>${t.summary}</p><div class="lesson-meta"><span class="pill green">${t.level}</span><span class="pill">${t.time} min + practice</span><span class="pill">8 checks · ${t.tasks.length} field tasks</span><span class="pill" data-lesson-score="${t.id}">${this.mastered(t)} / 8 checks passed</span></div><nav class="lesson-quick-nav" aria-label="Jump to lesson section"><a href="${base}/connections">Bangladesh visuals ↓</a><a href="${base}/visual">Visual lab ↓</a><a href="${base}/practice">Exercises ↓</a><a href="${base}/fieldwork">Field tasks ↓</a><a href="${base}/notes">My notes ↓</a></nav></header>
      <div class="lesson-layout"><div class="lesson-content"><section id="section-understand" class="lesson-block" tabindex="-1"><div class="eyebrow">01 / GET THE IDEA</div><h2>The simple version</h2><div class="analogy"><strong>Think of it this way · Bangladesh analogy</strong>${t.analogy}</div><ul class="goals">${t.goals.map(g=>`<li>${g}</li>`).join('')}</ul><nav class="subtopic-nav" aria-label="Concepts in this lesson">${t.sections.map(([h],i)=>`<a href="${base}/sub-${i}">${h}</a>`).join('')}</nav>${t.sections.map(([h,p],i)=>`<section class="concept-section" id="section-sub-${i}" tabindex="-1"><h3>${h}</h3><div>${p}</div></section>`).join('')}</section>
      ${Bangladesh.sectionHTML(t)}
      <section id="section-visual" class="lesson-block" tabindex="-1"><div class="eyebrow">02 / SEE IT, CHANGE IT</div><h2>${t.lab[0]}</h2><p class="try-it">${t.lab[1]}</p><div class="visual-lab"><div class="lab-stage"></div><div class="lab-controls"></div><div class="lab-output" role="status" aria-live="polite" aria-atomic="true"></div></div><p class="lab-caption">${t.lab[2]}</p><h3>Connect it to code</h3><pre><code>${this.escape(t.code)}</code></pre><p class="muted" style="font-size:11px">Python/SQL snippets are for your local tools; they are not executed in this website. Install the corresponding packages first.</p><div class="trap"><b>Watch out.</b> ${t.trap}</div></section>
      <section id="section-practice" class="lesson-block" tabindex="-1"><div class="eyebrow">03 / PROVE IT TO YOURSELF</div><h2>Less scrolling. More solving.</h2><p>Answer first, then check. Hints are welcome. Revealed answers don’t earn a pass—retry without the solution to check your recall.</p><div id="lesson-exercises">${t.exercises.map((q,i)=>this.exerciseHTML(t,i)).join('')}</div></section>
      <section id="section-fieldwork" class="lesson-block" tabindex="-1"><div class="eyebrow">04 / TAKE IT INTO THE FIELD</div><h2>Build something with it</h2><p>These are self-assessed tasks in your own tools. Use the success criteria to review your work; checking the box is not automatic code verification.</p>${t.tasks.map((task,i)=>this.taskHTML(t,task,i)).join('')}</section>
      <section id="section-notes" class="lesson-block" tabindex="-1"><div class="eyebrow">05 / MAKE IT YOURS</div><h2>Your field notes</h2><p>Explain this topic to future-you. What surprised you? Which mistake will you watch for?</p><textarea class="notes-area" id="topic-notes" aria-label="Your notes about ${t.short}" placeholder="My explanation, an example, and one thing I still want to test…">${this.escape(this.state.notes[t.id]||'')}</textarea><small id="note-status" class="muted" role="status">${this.storageAvailable?'Stored only in this browser.':'Session only. Export to keep your notes.'}</small></section>
      <section class="lesson-block"><h3>Go back to the source</h3><p>Source note sections: ${t.reference}. Browser visuals and extra questions are teaching additions; external tool results should be checked in your installed version.</p><div class="resource-links"><a href="core-geospatial-concepts.md">Original study note ↗</a>${t.links.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</div></section>
      <nav class="lesson-pagination" aria-label="Previous and next topics">${index?`<a class="button light" href="#lesson/${TOPICS[index-1].id}">← ${TOPICS[index-1].short}</a>`:'<a class="button light" href="#home">← Learning path</a>'}${index<TOPICS.length-1?`<a class="button primary" href="#lesson/${TOPICS[index+1].id}">${TOPICS[index+1].short} →</a>`:'<a class="button primary" href="#practice">Mixed practice →</a>'}</nav></div>
      <aside class="lesson-toc"><div class="eyebrow">ON THIS FIELDNOTE</div><a href="${base}/understand">01 · Get the idea</a><a href="${base}/connections">↳ Bangladesh visuals</a><a href="${base}/visual">02 · Visual experiment</a><a href="${base}/practice">03 · Check your learning</a><a href="${base}/fieldwork">04 · Field tasks</a><a href="${base}/notes">05 · Your notes</a><div class="thin-progress"><span data-lesson-progress="${t.id}" style="width:${this.mastered(t)/8*100}%"></span></div><strong data-lesson-score="${t.id}" style="font-size:13px">${this.mastered(t)} / 8 checks passed</strong><a class="button primary" href="${base}/practice">Jump to exercises ↓</a><a href="#home" style="margin-top:18px">← All 18 topics</a></aside></div>`;
    Visuals.mount(t,main.querySelector('.visual-lab'));
    this.bindExercises(main);
    main.querySelectorAll('[data-task]').forEach(input=>input.addEventListener('change',()=>{this.state.tasks[input.dataset.task]=input.checked;this.save();}));
    main.querySelector('#topic-notes').addEventListener('input',event=>{this.state.notes[t.id]=event.target.value;this.save();main.querySelector('#note-status').textContent=this.storageAvailable?'Saved in this browser.':'Session only. Export to keep your notes.';});
  },
  exerciseHTML(t,i) {
    const q=t.exercises[i],id=`${t.id}-${i}`,record=this.state.checks[id]||{};
    const options=q.type==='choice'?this.shuffle(q.options.map((text,index)=>({text,index}))).map(({text,index})=>`<label class="answer-option"><input type="radio" name="${id}" value="${index}" ${String(record.answer)===String(index)?'checked':''}>${this.escape(text)}</label>`).join(''): `<label><input class="number-input" name="${id}" type="number" step="any" placeholder="Your numeric answer" value="${this.escape(record.answer??'')}" aria-label="Numeric answer in ${q.unit}"><span class="unit-label">${q.unit} · tolerance ±${q.tolerance}</span></label>`;
    return `<article class="exercise" data-exercise="${id}"><div class="exercise-index">${t.short.toUpperCase()} · ${i+1}/8 <span class="pill">${q.level}</span>${record.mastered?' <span class="pill green">✓ Passed</span>':''}</div><form><fieldset aria-describedby="feedback-${id}"><legend>${this.escape(q.prompt)}</legend><div class="answers">${options}</div></fieldset><div class="exercise-actions"><button type="submit" class="primary">Check answer</button><button type="button" data-reveal>Show solution</button><button type="button" data-retry>Retry</button><details><summary>Need a hint?</summary><div class="hint">${this.escape(q.hint)}</div></details></div><div id="feedback-${id}" class="feedback ${record.result||''}" role="status" aria-live="polite">${this.feedback(q,record)}</div></form></article>`;
  },
  feedback(q,record) {
    if(!record.result)return '';
    const correctAnswer=q.type==='choice'?q.options[q.answer]:`${q.answer} ${q.unit}`;
    if(record.result==='revealed')return `<b>Solution: ${this.escape(correctAnswer)}.</b> ${this.escape(q.explanation)}<br>No pass awarded. Use Retry to start a fresh, unassisted attempt.`;
    if(record.result==='wrong')return '<b>Not quite yet.</b> Revisit the hint or experiment, then change your answer and check again. Use Show solution for a worked explanation.';
    if(record.result==='correct')return `<b>${record.assisted?'Correct, with the solution open—no new pass awarded.':'That’s right.'}</b> ${this.escape(q.explanation)}${record.assisted?'<br>Use Retry before checking your recall.':''}`;
    return '';
  },
  bindExercises(root) {
    root.querySelectorAll('[data-exercise]').forEach(article=>{
      const id=article.dataset.exercise,split=id.lastIndexOf('-'),t=TOPICS.find(t=>t.id===id.slice(0,split)),q=t.exercises[Number(id.slice(split+1))];
      const form=article.querySelector('form');
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const raw=new FormData(form).get(id);
        if(raw===null||String(raw).trim()==='') {const node=article.querySelector('.feedback');node.className='feedback wrong';node.textContent='Choose an answer or enter a finite number first.';return;}
        const record=this.state.checks[id]||{attempts:0};
        const correct=Geo.grade(q,raw);
        Object.assign(record,{answer:raw,attempts:(record.attempts||0)+1,result:correct?'correct':'wrong'});
        if(correct&&!record.assisted)record.mastered=true;
        this.state.checks[id]=record;this.save();
        const node=article.querySelector('.feedback');node.className=`feedback ${record.result}`;node.innerHTML=this.feedback(q,record);
        this.updateNav();
        if(record.mastered&&!article.querySelector('.exercise-index .green'))article.querySelector('.exercise-index').insertAdjacentHTML('beforeend',' <span class="pill green">✓ Passed</span>');
      });
      article.querySelector('[data-reveal]').addEventListener('click',()=>{
        const record=this.state.checks[id]||{attempts:0};
        record.assisted=true;record.result='revealed';this.state.checks[id]=record;this.save();
        const node=article.querySelector('.feedback');node.className='feedback revealed';node.innerHTML=this.feedback(q,record);
      });
      article.querySelector('[data-retry]').addEventListener('click',()=>{
        const record=this.state.checks[id]||{attempts:0};
        delete record.answer;delete record.result;record.assisted=false;this.state.checks[id]=record;this.save();
        form.querySelectorAll('input').forEach(input=>{if(input.type==='radio')input.checked=false;else input.value='';});
        const node=article.querySelector('.feedback');node.className='feedback';node.textContent='';
        form.querySelector('input')?.focus();
      });
    });
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
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">A SAFE PLACE TO GET IT WRONG</div><h1>The practice ground.</h1><p>144 checks. No timer. Select a topic, revisit your misses, or draw a mixed set. Passing here also updates your lesson progress.</p></header><div class="toolbar"><label>Topic <select id="practice-topic"><option value="all">All 18 topics</option>${TOPICS.map(t=>`<option value="${t.id}">${t.short}</option>`).join('')}</select></label><label>Show <select id="practice-status"><option value="all">All checks</option><option value="unpassed">Not yet passed</option><option value="missed">Last checked incorrectly</option><option value="passed">Passed checks</option></select></label><label>Skill <select id="practice-level"><option value="all">All skills</option><option>Recall</option><option>Apply</option><option>Diagnose</option></select></label><button id="draw-practice" class="primary">Draw 10 questions ↻</button><button id="all-practice">Show all matches</button></div><p id="practice-count" class="muted" role="status" style="font-size:12px"></p><div id="practice-questions"></div>`;
    const render=(all=false)=>{
      const topicId=main.querySelector('#practice-topic').value,status=main.querySelector('#practice-status').value,level=main.querySelector('#practice-level').value;
      const candidates=TOPICS.flatMap(t=>t.exercises.map((q,i)=>({t,q,i,id:`${t.id}-${i}`}))).filter(({t,q,id})=>{
        const r=this.state.checks[id]||{};
        return (topicId==='all'||topicId===t.id)&&(level==='all'||q.level===level)&&(status==='all'||status==='unpassed'&&!r.mastered||status==='passed'&&r.mastered||status==='missed'&&r.result==='wrong');
      });
      this.practiceSet=all?candidates:this.shuffle(candidates).slice(0,10);
      main.querySelector('#practice-count').textContent=`Showing ${this.practiceSet.length} of ${candidates.length} matching checks. Re-draw or change filters to refresh the set.`;
      const container=main.querySelector('#practice-questions');
      container.innerHTML=this.practiceSet.map(({t,i})=>this.exerciseHTML(t,i)).join('')||'<div class="empty-state">No checks in this selection. Change a filter or try another topic.</div>';
      this.bindExercises(container);
    };
    main.querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>render()));
    main.querySelector('#draw-practice').addEventListener('click',()=>render());
    main.querySelector('#all-practice').addEventListener('click',()=>render(true));
    render();
  },
  notebook(main) {
    const totals=this.totals(),taskCount=TOPICS.reduce((sum,t)=>sum+t.tasks.length,0);
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">THE THINGS THAT STUCK</div><h1>Your field notebook.</h1><p>Your explanations, solved checks and completed field tasks. Saved locally, never sent to a server.</p></header><div class="progress-summary"><h2>${totals.checks} / 144 checks passed</h2><p>${totals.tasks} / ${taskCount} field tasks self-assessed · ${TOPICS.filter(t=>this.mastered(t)===8).length} / 18 topics with all checks passed.</p><div class="thin-progress"><span style="width:${totals.checks/144*100}%"></span></div><small>Passing means at least one correct, unassisted check—not a professional competency certification. Retry revealed solutions to practise recall.</small></div><div class="toolbar"><button id="export-notes" class="primary">Export notebook (.md) ↓</button><button id="print-notes">Print notebook</button><button id="reset-progress">Reset local progress</button></div><div class="notebook-grid">${TOPICS.map(t=>`<article class="notebook-card"><div class="eyebrow">${t.group}</div><h3><a href="#lesson/${t.id}">${t.title} ↗</a></h3><small class="muted">${this.mastered(t)}/8 checks passed · ${t.tasks.filter((_,i)=>this.state.tasks[`${t.id}-${i}`]).length}/${t.tasks.length} field tasks</small><p style="margin-top:14px">${this.escape(this.state.notes[t.id]||'No field notes yet. Add your own explanation at the bottom of this lesson.')}</p><a class="text-link" href="#lesson/${t.id}/notes">${this.state.notes[t.id]?'Edit notes':'Write a field note'} →</a></article>`).join('')}</div>`;
    main.querySelector('#export-notes').addEventListener('click',()=>this.exportNotes());
    main.querySelector('#print-notes').addEventListener('click',()=>window.print());
    main.querySelector('#reset-progress').addEventListener('click',()=>{
      if(!confirm('Reset all saved checks, field tasks and notes for this site? Export your notebook first if you want to keep it.'))return;
      this.state={checks:{},tasks:{},notes:{},lastTopic:'earth'};this.save();this.notebook(main);this.updateNav();this.toast('Local progress and notes reset.');
    });
  },
  download(name,content,type='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  exportNotes() {
    const content=`# My GIS field notebook\n\nExported ${new Date().toLocaleDateString()}\n\n${this.totals().checks}/144 checks passed; ${this.totals().tasks}/${TOPICS.reduce((sum,t)=>sum+t.tasks.length,0)} field tasks self-assessed.\n\n`+TOPICS.map(t=>`## ${t.title}\n\n${this.mastered(t)}/8 checks passed. Source sections: ${t.reference}.\n\n${this.state.notes[t.id]||'_No notes yet._'}\n\n### Field tasks\n${t.tasks.map((task,i)=>`- [${this.state.tasks[`${t.id}-${i}`]?'x':' '}] ${task.title}`).join('\n')}\n`).join('\n');
    this.download('my-gis-fieldnotes.md',content,'text/markdown;charset=utf-8');
  },
  resources(main) {
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">TOOLS FOR THE NEXT STRETCH</div><h1>The reference shelf.</h1><p>The original source, reusable station data and a few authoritative places to dig deeper. The course itself works offline; external links and optional web fonts need internet.</p></header><section class="lesson-block"><h2>Your source & starter datasets</h2><p>The supplied note remains unchanged. Its four progressive exercises and solutions provide the full project specification and reference implementation.</p><div class="resource-links"><a href="core-geospatial-concepts.md">Read original Markdown ↗</a><a href="core-geospatial-concepts.md" download>Download source note ↓</a><a href="data/stations.csv" download>stations.csv ↓</a><a href="data/stations_mixed.csv" download>stations_mixed.csv ↓</a><a href="data/stations_raw.csv" download>stations_raw.csv ↓</a></div></section><section class="lesson-block"><h2>A four-week trail</h2><div class="table-wrap"><table><tr><th>Week</th><th>Topics</th><th>Make something</th></tr><tr><td>1</td><td>Earth, CRS, axes, projections, transforms</td><td>CRS cheat sheet and correct station import</td></tr><tr><td>2</td><td>Distances, geometry, topology, algorithms</td><td>Reprojection script and geometry toolkit</td></tr><tr><td>3</td><td>Raster/vector, geotransform, resampling, accuracy</td><td>Synthetic raster and checked cell locations</td></tr><tr><td>4</td><td>Cartography, formats, QGIS, debugging, coverage</td><td>Coverage audit, map and one-page report</td></tr></table></div><p>No experience in geodesy is required. The explanations and browser checks stand alone. Coding tasks assume Python functions, basic SQL and high-school maths.</p></section><section class="lesson-block"><h2>Tools for the external labs</h2><p>Browser exercises need only this website. For Python labs use Python 3.10+ and an isolated environment; install NumPy, Matplotlib, pyproj, Shapely, GeoPandas and Rasterio as needed. QGIS includes its own Python environment. PostGIS and GDAL command-line examples are optional.</p><pre><code>python -m venv .venv\n# Activate using your operating system’s instructions, then:\npython -m pip install numpy matplotlib pyproj shapely geopandas rasterio</code></pre><p>Expected third-party outputs depend on tool versions and operations/grids. Compare coordinates and measurements with suitable tolerances, not exact equality.</p></section><section class="lesson-block"><h2>Primary documentation</h2><div class="resource-links">${[['EPSG registry','https://epsg.org/'],['PROJ','https://proj.org/'],['GDAL','https://gdal.org/'],['pyproj','https://pyproj4.github.io/pyproj/'],['Shapely','https://shapely.readthedocs.io/'],['GeoPandas','https://geopandas.org/'],['PostGIS','https://postgis.net/docs/'],['QGIS training','https://docs.qgis.org/latest/en/docs/training_manual/'],['GeoJSON RFC 7946','https://www.rfc-editor.org/rfc/rfc7946'],['GeoPackage','https://www.geopackage.org/'],['ColorBrewer','https://colorbrewer2.org/'],['USGS projection manual','https://pubs.usgs.gov/publication/pp1395']].map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${name} ↗</a>`).join('')}</div></section><section class="lesson-block"><h2>A few words worth keeping</h2><dl>${[['Datum','The reference frame tying an ellipsoid to the real Earth.'],['CRS','A datum plus axes, units and, for projected systems, a projection.'],['Geodesic','A shortest surface path between positions on an ellipsoid or sphere.'],['Topology','Connectivity and adjacency independent of exact shape.'],['NoData','Missing/invalid raster measurement, not automatically zero.'],['Geotransform','An affine mapping from grid indices to map coordinates.'],['Choropleth','A thematic map shading areas by a variable, usually a rate or density.'],['GVF','Goodness of Variance Fit: classification fit for the same numeric data.'],['Accuracy','Closeness to truth; not the same as stored digits.']].map(([term,definition])=>`<dt><b>${term}</b></dt><dd style="margin:0 0 16px;color:#65746d;font-size:13px">${definition}</dd>`).join('')}</dl></section>`;
    main.insertAdjacentHTML('beforeend',Teaching.creditsHTML());
  }
};

App.init();
