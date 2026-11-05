/* Phases 5–6 reuse the established guided-reading, source and notebook layout. */
class StudyPhase {
  constructor(course,data){this.course=course;this.data=data;this.number=course.number;this.key=`phase${this.number}`;}
  escape(value){return Beginner.escape(value);}
  inline(value){return Beginner.inline(value);}
  lesson(id){return this.course.lessons.find(l=>l.id===id);}
  section(id){return this.data.sections.find(s=>s.id===id);}
  record(id){return App.state[this.key][id]||{};}
  completed(){return this.course.exercises.filter(e=>this.record(`exercise-${e.number}`).complete).length;}
  figurePath(lesson,index){return `assets/figures/${this.key}-${lesson.id}-step-${index+1}.svg`;}
  navHTML(){return `<div class="nav-group">Phase ${this.number} · ${this.escape(this.course.short)}</div><a href="#${this.key}">Overview & downloads →</a>`+this.course.lessons.map((l,i)=>`<a href="#${this.key}/lesson/${l.id}" data-study-phase="${this.key}" data-study-topic="${l.id}"><span class="nav-num">${String(i+1).padStart(2,'0')}</span>${this.escape(l.short)}${this.record(l.id).read?'<span class="nav-check" aria-label="Read (self-reported)">✓</span>':''}</a>`).join('');}
  content(section){
    const note=this.course.clarifications[section.key];
    return `${note?`<aside class="source-clarification"><strong>Reading clarification</strong><p>${this.escape(note)}</p></aside>`:''}<div class="source-text" data-study-source="${section.id}">${section.html}</div>`;
  }
  figure(lesson,index){
    const visual=lesson.steps[index].visual,file=this.figurePath(lesson,index);
    return `<figure class="journey-figure step-figure"><div class="figure-viewport" role="region" tabindex="0" aria-label="${this.escape(visual.title)}; scroll horizontally on narrow screens"><a href="${file}" target="_blank" rel="noopener noreferrer"><img src="${file}" alt="${this.escape(visual.title+'. '+visual.caption)}" loading="lazy" decoding="async"></a></div><figcaption><strong>Follow the picture.</strong> ${this.escape(visual.caption)} <a href="${file}" target="_blank" rel="noopener noreferrer">Enlarge ↗</a></figcaption></figure>`;
  }
  render(main,parts){
    const [page,id,anchor]=parts;
    if(!page)this.home(main);
    else if(page==='lesson'&&this.lesson(id))this.renderLesson(main,this.lesson(id));
    else if(page==='reference'&&(!id||this.section(id)))this.reference(main,id);
    else if(page==='exercises'&&(!id||this.course.exercises.some(e=>String(e.number)===id)))this.exercises(main,id);
    else{main.innerHTML=`<section class="lesson-block"><h1>Phase ${this.number} page not found</h1><a href="#${this.key}">Return to the learning path →</a></section>`;return;}
    this.bind(main);
    if(anchor){const node=document.getElementById(`${this.key}-${anchor}`);if(node){for(let p=node;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;node.scrollIntoView({block:'start'});}}
  }
  home(main){
    const c=this.course,resume=this.lesson(App.state[this.key].lastLesson)||c.lessons[0];
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">PHASE ${this.number} / ${this.escape(c.pace)} / VISUAL LEARNING PATH</div><h1>${this.escape(c.title)}</h1><p>${this.escape(c.intro)}</p><div class="resource-links"><a class="button primary" href="#${this.key}/lesson/${resume.id}">${resume===c.lessons[0]?'Start':'Continue'} Phase ${this.number} →</a><a class="button light" href="#${this.key}/exercises">Four progressive exercises</a><a href="#phase${c.previous}">← Phase ${c.previous}</a>${c.next?`<a href="#phase${c.next}">Phase ${c.next} →</a>`:''}</div></header>
      <section class="lesson-block"><h2>What you bring</h2><p>${this.escape(c.prerequisites)}</p><p>Every reading step has a labeled visual and a reading guide. On narrow screens, scroll a figure or use Enlarge. Follow the chapter sequence, pause at the concept check, then open the full source for code, formulas and detailed examples.</p></section>
      <div class="section-heading"><div><h2>Read these chapters in order</h2><p>${c.lessons.length} chapters · ${this.data.counts.stepVisuals} step visuals · ${this.completed()} / 4 exercises completed (self-reported)</p></div></div><div class="course-grid phase2-grid">${c.lessons.map((l,i)=>`<article class="course-card phase2-card"><a class="card-art study-card-art" href="#${this.key}/lesson/${l.id}" aria-label="Read ${this.escape(l.title)}"><img src="${this.figurePath(l,0)}" alt="" loading="lazy"></a><div class="card-body"><div class="eyebrow">PHASE ${this.number} · CHAPTER ${i+1}</div><h3><a href="#${this.key}/lesson/${l.id}">${this.escape(l.title)}</a></h3><p>${this.escape(l.purpose)}</p><div class="card-bottom"><span>${this.record(l.id).read?'Read (self-reported)':'Three illustrated steps'}</span><a href="#${this.key}/lesson/${l.id}">Read →</a></div></div></article>`).join('')}</div>
      <section class="lesson-block"><h2>Tools, complete reading and downloads</h2><p>${this.escape(c.tools)}</p><div class="resource-links"><a href="#${this.key}/reference">Search the full source →</a><a href="${this.data.source}" download>Original note ↓</a><a href="PHASE${this.number}-COVERAGE.md">Source and visual coverage ↗</a><a href="exercises/${this.key}/README.md">Exercise setup →</a></div><p>Expected outputs are checkpoints to reproduce. Mark completion after running the required checks locally; save evidence in your field notebook.</p></section>`;
  }
  renderLesson(main,lesson){
    App.state[this.key].lastLesson=lesson.id;App.save();
    const lessons=this.course.lessons,index=lessons.indexOf(lesson),previous=lessons[index-1],next=lessons[index+1],record=this.record(lesson.id);
    const sections=this.data.sections.filter(s=>s.topics.includes(lesson.id)),base=`#${this.key}/lesson/${lesson.id}`;
    main.innerHTML=`<header class="lesson-header sequential-header"><div class="eyebrow">PHASE ${this.number} / CHAPTER ${index+1} OF ${lessons.length}</div><h1>${this.escape(lesson.title)}</h1><p>${this.escape(lesson.purpose)}</p><nav class="lesson-quick-nav" aria-label="Chapter sections"><a href="#${this.key}">Learning path</a>${lesson.steps.map((s,i)=>`<a href="${base}/step-${i+1}">Step ${i+1}</a>`).join('')}<a href="${base}/source">Full source ↓</a><a href="${base}/notes">My notes ↓</a></nav></header><div class="sequential-layout">
      <article class="lesson-block beginner-guide sequential-reading"><div class="reading-context"><div class="eyebrow">THE CONNECTED STUDY</div><p><strong>Where we left off.</strong> ${this.inline(lesson.before)}</p></div>${lesson.steps.map((step,i)=>`<section class="reading-step" id="${this.key}-step-${i+1}" tabindex="-1"><div class="eyebrow">STEP ${i+1} OF ${lesson.steps.length}</div><h2>${this.escape(step.title)}</h2><p>${this.inline(step.text)}</p>${this.figure(lesson,i)}</section>`).join('')}<div class="beginner-takeaway"><strong>What we can now say</strong><p>${this.escape(lesson.takeaway)}</p></div><details class="beginner-check"><summary>Pause here: ${this.escape(lesson.check[0])}</summary><p>${this.escape(lesson.check[1])}</p></details><label class="task-check"><input type="checkbox" data-study-read="${lesson.id}" ${record.read?'checked':''}> I read this chapter and can explain its takeaway (self-reported).</label></article>
      <section class="lesson-block chapter-transition"><div class="eyebrow">${next?'WHY WE CONTINUE':'THE COMPLETE PICTURE'}</div><p>${this.escape(lesson.after)}</p><nav class="lesson-pagination" aria-label="Previous and next chapters"><a class="button light" href="${previous?'#'+this.key+'/lesson/'+previous.id:'#'+this.key}">← ${previous?this.escape(previous.short):'Learning path'}</a><a class="button primary" href="${next?'#'+this.key+'/lesson/'+next.id:'#'+this.key+'/exercises'}">${next?'Next: '+this.escape(next.short):'Complete the exercises'} →</a></nav></section>
      ${lesson.exercise?`<section class="lesson-block"><h2>Apply this chapter</h2><p>Keep the inputs, outputs and checks you actually ran.</p><a class="button primary" href="#${this.key}/exercises/${lesson.exercise}">Open Exercise ${lesson.exercise} →</a></section>`:''}
      <details class="lesson-block optional-learning full-source" id="${this.key}-source" tabindex="-1"><summary>Full detail from the original note · ${sections.length} sections</summary><p class="source-bridge">Complete source readings, with clarifications kept separate. Open individual sections for formulas, code and worked results.</p>${sections.map(s=>`<details class="source-entry" id="${this.key}-source-${s.id}" tabindex="-1"><summary>${this.escape(s.title)}</summary><div class="source-entry-body">${this.content(s)}<a href="#${this.key}/reference/${s.id}">Read this section on its own →</a></div></details>`).join('')}</details>
      <section class="lesson-block" id="${this.key}-notes" tabindex="-1"><h2>Keep the thread in your own words</h2><label class="coding-label" for="${this.key}-note">What did the visuals help you understand, and what will you check?</label><textarea id="${this.key}-note" class="notes-area" data-study-note="${lesson.id}">${this.escape(record.notes||'')}</textarea><p class="muted" data-study-save role="status">${this.storageMessage()}</p></section></div>`;
  }
  storageMessage(){return App.storageAvailable?'Saved only in this browser; included in notebook export.':'Session only. Export before closing.';}
  reference(main,id){
    if(id){
      const section=this.section(id),index=this.data.sections.indexOf(section),previous=this.data.sections[index-1],next=this.data.sections[index+1];
      const children=[];
      for(let i=index+1;i<this.data.sections.length&&this.data.sections[i].depth>section.depth;i++)children.push(this.data.sections[i]);
      main.innerHTML=`<div class="reference-reader"><header class="lesson-header"><div class="eyebrow">PHASE ${this.number} / FULL SOURCE / ${index+1} OF ${this.data.sections.length}</div><h1>${this.escape(section.title)}</h1><p><a href="#${this.key}/reference">← Source index</a> · <a href="#${this.key}/lesson/${section.topics[0]}">Illustrated chapter →</a></p></header><article class="lesson-block">${this.content(section)}</article>${children.length?`<section class="lesson-block"><h2>Continue inside this section</h2><ol>${children.map(s=>`<li><a href="#${this.key}/reference/${s.id}">${this.escape(s.title)}</a></li>`).join('')}</ol></section>`:''}<nav class="lesson-pagination" aria-label="Previous and next source sections"><a class="button light" href="${previous?'#'+this.key+'/reference/'+previous.id:'#'+this.key+'/reference'}">← ${previous?this.escape(previous.title):'Source index'}</a><a class="button primary" href="${next?'#'+this.key+'/reference/'+next.id:'#'+this.key}">${next?'Next: '+this.escape(next.title):'Review the learning path'} →</a></nav><p class="source-location">Original source lines ${section.lineStart}–${section.lineEnd} · <a href="${this.data.source}" download>Download source ↓</a></p></div>`;
      return;
    }
    const counts=this.data.counts;
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">PHASE ${this.number} / EVERY SOURCE SECTION</div><h1>${this.escape(this.course.short)}, in full.</h1><p>${counts.sections} sections · ${counts.tables} tables · ${counts.codeBlocks} code/text blocks · ${counts.diagrams} offline source diagrams · ${counts.equations} displayed equations.</p><div class="resource-links"><a href="#${this.key}">Guided path →</a><a href="#${this.key}/reference/overview">Read in source order →</a><a href="${this.data.source}" download>Original Markdown ↓</a></div></header><section class="lesson-block"><h2>Find a section</h2><label for="study-search">Search headings and complete source text</label><input id="study-search" type="search" placeholder="Search the full note…"><p id="study-search-count" role="status"></p><div id="study-source-index" class="source-index"></div></section>`;
    const render=()=>{
      const query=main.querySelector('#study-search').value.trim().toLowerCase(),sections=this.data.sections.filter(s=>s.markdown.toLowerCase().includes(query));
      main.querySelector('#study-search-count').textContent=`${sections.length} of ${counts.sections} sections shown`;
      main.querySelector('#study-source-index').innerHTML=sections.map(s=>`<article class="source-index-entry"><h3><a href="#${this.key}/reference/${s.id}">${this.escape(s.title)}</a></h3><a href="#${this.key}/lesson/${s.topics[0]}">${this.escape(this.lesson(s.topics[0]).short)} →</a><p>Full source · lines ${s.lineStart}–${s.lineEnd}</p></article>`).join('')||'<p>No matching section. Try another word.</p>';
    };
    main.querySelector('#study-search').addEventListener('input',render);render();
  }
  exercises(main,id){
    const exercises=this.course.exercises.filter(e=>!id||String(e.number)===id);
    main.innerHTML=`<header class="lesson-header"><div class="eyebrow">PHASE ${this.number} / FOUR PROGRESSIVE EXERCISES</div><h1>${this.escape(this.course.short)} workshop.</h1><p>Work in order and keep actual results. Solutions open only when you choose; opening one never awards completion.</p><p data-study-progress role="status">${this.completed()} / 4 completed (self-reported).</p><div class="resource-links"><a href="#${this.key}">Learning path →</a><a href="#${this.key}/exercises">All exercises →</a><a href="exercises/${this.key}/README.md">Setup and source guidance →</a></div></header>${exercises.map(e=>{
      const task=this.section(`exercise-${e.number}`),solution=this.section(`solution-${e.number}`),record=this.record(`exercise-${e.number}`),lesson=this.lesson(e.lesson);
      return `<article class="lesson-block phase2-exercise study-exercise" data-study-exercise="${e.number}"><div class="eyebrow">EXERCISE ${e.number} OF 4</div><h2>${this.escape(e.title)}</h2><p><a href="#${this.key}/lesson/${e.lesson}">Revisit all three illustrated steps →</a> · <a href="exercises/${this.key}/exercise-${e.number}.md" download>Original task ↓</a></p>${this.figure(lesson,0)}${this.content(task)}<aside class="source-clarification"><strong>Evidence to keep</strong><p>${this.escape(e.evidence)}</p></aside><label class="coding-label" for="study-evidence-${e.number}">Your code, outputs, checks or questions</label><textarea id="study-evidence-${e.number}" class="notes-area" data-study-note="exercise-${e.number}">${this.escape(record.notes||'')}</textarea><p class="muted" data-study-save role="status">${this.storageMessage()} Editing evidence clears completion.</p><label class="task-check"><input type="checkbox" data-study-complete="exercise-${e.number}" ${record.complete?'checked':''}> I ran the checks locally and reviewed every success criterion (self-reported).</label><details class="coding-solution"><summary>Open the complete source solution after trying</summary>${this.content(solution)}<a href="exercises/${this.key}/solutions/exercise-${e.number}.md" download>Download complete solution and explanation ↓</a></details><nav class="lesson-pagination" aria-label="Previous and next exercises"><a class="button light" href="${e.number>1?'#'+this.key+'/exercises/'+(e.number-1):'#'+this.key}">← ${e.number>1?'Exercise '+(e.number-1):'Learning path'}</a><a class="button primary" href="${e.number<4?'#'+this.key+'/exercises/'+(e.number+1):'#'+this.key}">${e.number<4?'Exercise '+(e.number+1):'Review the learning path'} →</a></nav></article>`;
    }).join('')}`;
  }
  bind(main){
    const save=(id,change)=>{App.state[this.key][id]={...this.record(id),...change};App.save();App.updateNav();const progress=main.querySelector('[data-study-progress]');if(progress)progress.textContent=`${this.completed()} / 4 completed (self-reported).`;};
    main.querySelectorAll('[data-study-read]').forEach(input=>input.addEventListener('change',()=>save(input.dataset.studyRead,{read:input.checked})));
    main.querySelectorAll('[data-study-complete]').forEach(input=>input.addEventListener('change',()=>save(input.dataset.studyComplete,{complete:input.checked})));
    main.querySelectorAll('[data-study-note]').forEach(input=>input.addEventListener('input',()=>{
      const id=input.dataset.studyNote;save(id,{notes:input.value,...(id.startsWith('exercise-')?{complete:false}:{})});
      const container=input.closest('.study-exercise')||input.parentElement,checkbox=container.querySelector('[data-study-complete]');
      if(checkbox)checkbox.checked=false;
      container.querySelector('[data-study-save]').textContent=this.storageMessage();
    }));
  }
  entries(){return [...this.course.lessons.map(l=>({id:l.id,title:l.title,url:`#${this.key}/lesson/${l.id}`})),...this.course.exercises.map(e=>({id:`exercise-${e.number}`,title:`Exercise ${e.number}: ${e.title}`,url:`#${this.key}/exercises/${e.number}`}))];}
  notebookHTML(){return `<section class="lesson-block"><h2>Phase ${this.number} — ${this.escape(this.course.short)}</h2><p>${this.completed()} / 4 exercises completed (self-reported) · ${this.course.lessons.filter(l=>this.record(l.id).read).length} / ${this.course.lessons.length} chapters read (self-reported).</p><a href="#${this.key}">Continue Phase ${this.number} →</a></section><div class="notebook-grid">${this.entries().map(item=>`<article class="notebook-card"><div class="eyebrow">PHASE ${this.number}</div><h3><a href="${item.url}">${this.escape(item.title)}</a></h3><p>${this.escape(this.record(item.id).notes||'No notes yet.')}</p><small>${this.record(item.id).complete?'Completed (self-reported)':this.record(item.id).read?'Read (self-reported)':'Not marked complete'}</small></article>`).join('')}</div>`;}
  exportNotes(){
    const fence=value=>'`'.repeat(Math.max(3,...(value.match(/`+/g)||[]).map(s=>s.length+1)));
    return `\n# Phase ${this.number} — ${this.course.short}\n\n${this.completed()}/4 exercises completed (self-reported).\n\n`+this.entries().map(e=>{const r=this.record(e.id),notes=r.notes||'No notes yet.',delimiter=fence(notes);return `## ${e.title}\n\n${r.complete?'Completed (self-reported)':r.read?'Read (self-reported)':'Not marked complete'}\n\n${delimiter}text\n${notes}\n${delimiter}\n`;}).join('\n');
  }
}
const Phase5=new StudyPhase(Phase5Course,Phase5Data);
const Phase6=new StudyPhase(Phase6Course,Phase6Data);
