/* Local-code workflow: drafts are saved here; Python and Go execute in the learner's terminal. */
const Coding = {
  count() { return Object.keys(Programming.lessons).length; },
  completed(topic) {
    const record=App.state.coding[Programming.id(topic)];
    return Object.keys(Programming.languages).some(language=>record?.[language]?.complete===true);
  },
  intro() {
    return `<div class="coding-intro"><p><strong>Write a program, run its checks, then explain the result.</strong> Choose Python 3.10+ or Go 1.18+. Both versions solve the same problem using only the standard library.</p><ol><li>Download the starter file and open it in your editor. Replace the TODO function with your implementation.</li><li>Open a terminal in the file’s folder and run the command shown below. A check compares your function’s result with an expected value. The starter deliberately fails until you implement it.</li><li>Fix failures until you see <code>All checks passed</code>. Add a case of your own, then save your finished code or output here and record completion.</li></ol><p class="muted">Code runs on your computer. This page saves drafts and self-reported completion; it does not execute or grade your Python or Go.</p><p><a href="exercises/README.md">Downloadable exercise catalogue & setup →</a></p></div>`;
  },
  html(topic) {
    const q=Programming.lessons[topic.id],id=Programming.id(topic.id),record=App.state.coding[id]||{};
    const language=Object.hasOwn(Programming.languages,record.language)?record.language:'python';
    const saved=record[language]||{},spec=Programming.languages[language],filename=Programming.filename(topic.id,language);
    const esc=value=>App.escape(value);
    return `<article class="exercise coding-exercise" data-exercise="${id}" data-coding-topic="${topic.id}"><div class="exercise-index">${esc(topic.short.toUpperCase())} <span class="pill">${q.level}</span><span class="coding-badge">${saved.complete?' · ✓ Completed (self-reported)':''}</span></div><h3>${esc(q.title)}</h3><p>${esc(q.prompt)}</p><h4>Acceptance criteria</h4><ul>${q.criteria.map(c=>`<li>${esc(c)}</li>`).join('')}<li>Keep the supplied checks and add at least one test case of your own.</li></ul><div class="coding-toolbar"><label for="language-${id}">Language</label><select id="language-${id}" data-language>${Object.entries(Programming.languages).map(([key,value])=>`<option value="${key}" ${key===language?'selected':''}>${value.label}</option>`).join('')}</select><a href="exercises/${language}/${filename}" download>Starter file ↓</a></div><p>Run in your terminal: <code>${spec.command} ${filename}</code></p><details class="coding-checks"><summary>Inputs and expected results · runnable checks</summary><p><code>check(actual, expected)</code> fails when the results differ. Floating-point results use a small tolerance; these same checks are included in the downloaded file.</p><pre><code>${esc(q[language].tests)}</code></pre></details><label class="coding-label" for="code-${id}">Your ${spec.label} file · editable, saved in this browser</label><textarea id="code-${id}" data-code class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" rows="14">${esc(saved.code??Programming.file(topic.id,language))}</textarea><div class="exercise-actions"><button type="button" class="primary" data-download-code>Download my code ↓</button><button type="button" data-restore-code>Restore starter</button><details><summary>Need a hint?</summary><p class="hint">${esc(q.hint)}</p></details></div><p class="coding-save-status muted" role="status">${App.storageAvailable?'Drafts stay in this browser. Export your notebook to keep a backup.':'Session only. Download your code or export your notebook before closing.'}</p><label class="coding-label" for="output-${id}">Your local test output or debugging notes (optional)</label><textarea id="output-${id}" data-code-output rows="3" placeholder="Paste terminal output, a failing case, or what you changed…">${esc(saved.output||'')}</textarea><label class="task-check"><input type="checkbox" data-code-complete ${saved.complete?'checked':''}> I ran my ${spec.label} implementation locally and all checks passed, including my extra case.</label><details class="coding-solution"><summary>Compare with the worked ${spec.label} solution</summary><p>${esc(q.explanation)}</p><pre><code>${esc(Programming.implementation(topic.id,language,true))}</code></pre><a href="exercises/solutions/${language}/${filename}" download>Download runnable solution with checks ↓</a></details></article>`;
  },
  bind(root) {
    root.querySelectorAll('[data-coding-topic]').forEach(article=>this.bindArticle(article));
  },
  bindArticle(article) {
    const topic=TOPICS.find(t=>t.id===article.dataset.codingTopic),id=Programming.id(topic.id);
    const record=()=>App.state.coding[id]??(App.state.coding[id]={});
    const language=()=>article.querySelector('[data-language]').value;
    const draft=()=>{const r=record(),key=language();return r[key]??(r[key]={});};
    article.querySelector('[data-language]').addEventListener('change',()=>{
      const key=language();record().language=key;App.save();
      const template=document.createElement('template');template.innerHTML=this.html(topic);
      const replacement=template.content.firstElementChild;article.replaceWith(replacement);this.bindArticle(replacement);
      replacement.querySelector('[data-language]').focus();
    });
    article.querySelector('[data-code]').addEventListener('input',event=>{
      Object.assign(draft(),{code:event.target.value,complete:false});App.save();
      article.querySelector('[data-code-complete]').checked=false;
      article.querySelector('.coding-badge').textContent='';
      article.querySelector('.coding-save-status').textContent=App.storageAvailable?'Draft saved. Re-run checks after edits before recording completion.':'Session only. Download your code to keep it.';
      App.updateNav();
    });
    article.querySelector('[data-code-output]').addEventListener('input',event=>{draft().output=event.target.value;App.save();});
    article.querySelector('[data-code-complete]').addEventListener('change',event=>{
      draft().complete=event.target.checked;App.save();App.updateNav();
      article.querySelector('.coding-badge').textContent=event.target.checked?' · ✓ Completed (self-reported)':'';
    });
    article.querySelector('[data-download-code]').addEventListener('click',()=>App.download(Programming.filename(topic.id,language()),article.querySelector('[data-code]').value));
    article.querySelector('[data-restore-code]').addEventListener('click',()=>{
      if(!confirm(`Replace your ${Programming.languages[language()].label} draft with the starter and clear its completion?`))return;
      const editor=article.querySelector('[data-code]');editor.value=Programming.file(topic.id,language());editor.dispatchEvent(new Event('input'));editor.focus();
    });
  }
};
