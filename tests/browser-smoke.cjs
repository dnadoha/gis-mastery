/* Real Edge smoke tests via the Chrome DevTools Protocol; no npm dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname,'..');
const edge = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const temp = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA,'Temp','opencode') : process.env.TEMP;
const artifacts = fs.mkdtempSync(path.join(temp,'gis-browser-'));
let browser, socket, server;
const pending = new Map(), listeners = new Map(), errors = [];
let nextId=0;
const checks=[];
function check(name, actual, expected=true) { assert.deepEqual(actual,expected,name);checks.push(name);console.log(`PASS ${name}`); }
function once(event) { return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{listeners.delete(event);reject(new Error(`Event timeout: ${event}`));},20000);listeners.set(event,value=>{clearTimeout(timer);resolve(value);});}); }
function send(method,params={}) {
  return new Promise((resolve,reject)=>{
    const id=++nextId;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},20000);
    pending.set(id,{resolve:result=>{clearTimeout(timer);resolve(result);},reject:error=>{clearTimeout(timer);reject(error);}});
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
}
async function route(hash) {
  await evaluate(`location.hash=${JSON.stringify(hash)};new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
}
async function navigate(url) { const loaded=once('Page.loadEventFired');await send('Page.navigate',{url});await loaded; }

(async()=>{
  server=http.createServer((req,res)=>{
    const name=new URL(req.url,'http://localhost').pathname;
    const file=path.resolve(root,'.'+(name==='/'?'/index.html':decodeURIComponent(name)));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    fs.readFile(file,(error,buffer)=>{
      if(error){res.writeHead(404);res.end();return;}
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.csv':'text/csv','.md':'text/markdown'};
      res.writeHead(200,{'Content-Type':`${types[path.extname(file)]||'application/octet-stream'}; charset=utf-8`});res.end(buffer);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const wsURL=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Edge did not start DevTools within 20 seconds')),20000);
    browser=spawn(edge,['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${path.join(artifacts,'profile')}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
    browser.on('error',error=>{clearTimeout(timer);reject(error);});
    browser.stderr.on('data',chunk=>{const match=chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  });
  const endpoint=new URL(wsURL);
  const target=await fetch(`http://${endpoint.host}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json());
  socket=new WebSocket(target.webSocketDebuggerUrl);
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.id && pending.has(message.id)){const task=pending.get(message.id);pending.delete(message.id);if(message.error)task.reject(new Error(message.error.message));else task.resolve(message.result);}
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
    if(listeners.has(message.method)){const callback=listeners.get(message.method);listeners.delete(message.method);callback(message.params);}
  });
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  await send('Page.enable');await send('Page.bringToFront');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Runtime.enable');await send('Network.enable');
  await send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate(url);
  await evaluate('localStorage.setItem(App.storageKey,JSON.stringify({checks:{"earth-0":{mastered:true}},notes:{geometry:"Existing learner note"},tasks:{},lastTopic:"geometry"}))');
  await navigate(url);
  check('Existing notes and quiz history survive migration without granting coding completion',await evaluate('App.state.notes.geometry==="Existing learner note" && App.state.checks["earth-0"].mastered && App.totals().coding===0'));
  check('Homepage renders 18 topic cards',await evaluate('document.querySelectorAll(".course-card").length'),18);
  check('Sidebar provides 18 topic links',await evaluate('document.querySelectorAll("[data-topic]").length'),18);
  check('New readers start with drawing the map, and all navigation uses the chapter order',await evaluate('document.querySelector(".hero-actions a").hash==="#lesson/geometry" && [...document.querySelectorAll("[data-topic]")].map(a=>a.dataset.topic).join()===Beginner.path.join()'));
  check('Home has no horizontal overflow',await evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await evaluate('document.querySelector("[data-filter=Represent]").click()');
  check('Topic filter narrows to four raster/precision lessons',await evaluate('document.querySelectorAll(".course-card").length'),4);
  await evaluate('document.querySelectorAll("[data-filter]")[0].click();let s=document.querySelector("#topic-search");s.value="half-pixel";s.dispatchEvent(new Event("input"))');
  check('Search finds relevant source terms',await evaluate('document.querySelectorAll(".course-card").length>0 && document.querySelectorAll(".course-card").length<18'));
  await evaluate('document.querySelector("#topic-search").value="";document.querySelector("#topic-search").dispatchEvent(new Event("input"))');
  const homeShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'home-desktop.png'),Buffer.from(homeShot.data,'base64'));

  const ids=await evaluate('TOPICS.map(t=>t.id)');
  for(const id of ids) {
    await route(`#lesson/${id}`);
    check(`${id}: programming challenge, 3 field tasks and visual output`,await evaluate('document.querySelectorAll("[data-coding-topic]").length===1 && !document.querySelector("input[type=radio]") && document.querySelectorAll("[data-task]").length===3 && document.querySelector(".lab-output").textContent.length>20'));
    check(`${id}: executable starters and solutions are linked`,await evaluate('[...document.querySelectorAll(".coding-exercise a[download]")].every(a=>a.getAttribute("href").startsWith("exercises/")) && document.querySelector("[data-code]").value.includes("Implement this function")'));
    check(`${id}: retains local schematic, deeper explanations and regional analogy`,await evaluate('document.querySelectorAll(".story-figure svg").length===1 && document.querySelectorAll(".reference-image").length===0 && document.querySelector(".analogy strong").textContent.includes("Bangladesh") && document.querySelectorAll(".concept-section").length>=3'));
    check(`${id}: connected reading has a recap, three linked steps and a next-step explanation`,await evaluate('document.querySelector(".beginner-guide").getBoundingClientRect().height>0 && document.querySelectorAll(".reading-step").length===3 && document.querySelector(".reading-context").textContent.length>80 && document.querySelector(".chapter-transition>p").textContent.length>60 && !document.querySelector("#section-visual").open && !document.querySelector("#section-deeper").open && !document.querySelector("#section-practice").open && !document.querySelector("#section-fieldwork").open'));
    await evaluate('Promise.all([...document.querySelectorAll(".concept-figure img,.journey-figure img")].map(image=>{image.loading="eager";return image.decode();}))');
    check(`${id}: shared-story diagram loads and inline formatting renders`,await evaluate('document.querySelector(".journey-figure img").naturalWidth>0 && !document.querySelector(".beginner-guide").textContent.includes(String.fromCharCode(96))'));
    check(`${id}: instructional figures decode and have reading guides`,await evaluate('[...document.querySelectorAll(".concept-figure")].every(f=>f.querySelector("img").naturalWidth>0 && f.textContent.includes("How to read it.") && f.querySelector(".figure-check"))'));
    check(`${id}: topic and previous/next navigation`,await evaluate('document.querySelectorAll(".lesson-pagination a").length===2 && document.querySelectorAll("[data-topic][aria-current=page]").length===1'));
    // Exercise each native visual control, including all select states.
    await evaluate(`(() => { const selects=document.querySelectorAll('.lab-controls select');selects.forEach(s=>{[...s.options].forEach(o=>{s.value=o.value;s.dispatchEvent(new Event('input',{bubbles:true}));});});document.querySelectorAll('.lab-controls input[type=range]').forEach(r=>{r.value=r.max;r.dispatchEvent(new Event('input',{bubbles:true}));});document.querySelector('[data-cell="23"]')?.click(); })()`);
    check(`${id}: visual remains finite after interaction`,await evaluate('!document.querySelector(".visual-lab").innerHTML.includes("NaN")'));
  }

  await route('#lesson/geometry');
  await evaluate('document.querySelector(".chapter-transition .primary").click();new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  check('Next chapter continues from geometry to named coordinates',await evaluate('location.hash==="#lesson/axes" && document.querySelector(".reading-context").textContent.includes("School A") && document.querySelector("[data-topic][aria-current=page]").dataset.topic==="axes"'));
  await evaluate('new Promise(resolve=>{addEventListener("hashchange",()=>requestAnimationFrame(resolve),{once:true});history.back();})');
  check('Browser Back restores the preceding chapter',await evaluate('location.hash==="#lesson/geometry" && document.querySelector(".chapter-transition .primary").hash==="#lesson/axes"'));

  await route('#lesson/topology/connections');
  const connectionShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'bangladesh-connections-desktop.png'),Buffer.from(connectionShot.data,'base64'));
  await route('#lesson/topology/sub-0');
  await evaluate('document.querySelector("#section-sub-0 .concept-figure").scrollIntoView({block:"start"})');
  const photoShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'credited-reference-images.png'),Buffer.from(photoShot.data,'base64'));
  await route('#lesson/geometry/sub-1');
  check('Geometry retains its 13 deeper diagrams and opens deep-linked content',await evaluate('document.querySelectorAll("#section-deeper .concept-figure").length===13 && document.querySelectorAll(".subtopic-nav a").length===12 && document.querySelector("#section-deeper").open && document.querySelector("#section-sub-1").getBoundingClientRect().top<30'));
  const geometryShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'geometry-point-explanation.png'),Buffer.from(geometryShot.data,'base64'));
  await route('#lesson/earth');
  await evaluate('document.querySelector(".beginner-check summary").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  check('Beginner quick check is keyboard accessible and does not award programming completion',await evaluate('document.querySelector(".beginner-check").open && App.totals().coding===0'));
  await route('#lesson/earth/understand');
  const beginnerShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'beginner-reading-desktop.png'),Buffer.from(beginnerShot.data,'base64'));
  await route('#lesson/earth/practice');
  check('Lesson jump opens optional practice and navigates directly to exercises',await evaluate('document.querySelector("#section-practice").open && document.querySelector("#section-practice").getBoundingClientRect().top<30'));
  await evaluate('document.querySelector(".coding-solution summary").click()');
  check('Opening a solution does not mark a program complete',await evaluate('App.totals().coding===0 && !document.querySelector("[data-code-complete]").checked'));
  await evaluate('var editor=document.querySelector("[data-code]");editor.value=Programming.file("earth","python",true)+"\\n# saved draft </textarea><script>unsafe</script>";editor.dispatchEvent(new Event("input"));var output=document.querySelector("[data-code-output]");output.value="All checks passed; added negative-height test";output.dispatchEvent(new Event("input"));document.querySelector("[data-code-complete]").click()');
  check('Local completion is explicitly self-reported',await evaluate('App.totals().coding===1 && document.querySelector(".coding-badge").textContent.includes("self-reported")'));
  await evaluate('var language=document.querySelector("[data-language]");language.value="go";language.dispatchEvent(new Event("change"))');
  check('Go has its own starter, command and completion',await evaluate('document.querySelector("[data-code]").value.includes("package main") && document.querySelector(".coding-exercise").textContent.includes("go run earth.go") && !document.querySelector("[data-code-complete]").checked'));
  await evaluate('var editor=document.querySelector("[data-code]");editor.value=Programming.file("earth","go",true);editor.dispatchEvent(new Event("input"));document.querySelector("[data-code-complete]").click()');
  check('Finishing both languages counts once per chapter',await evaluate('App.totals().coding===1'));
  await evaluate('var language=document.querySelector("[data-language]");language.value="python";language.dispatchEvent(new Event("change"))');
  check('Switching languages restores draft, output and completion with literal markup',await evaluate('document.querySelector("[data-code]").value.includes("</textarea><script>unsafe</script>") && !document.querySelector(".coding-exercise script") && document.querySelector("[data-code-output]").value.includes("negative-height") && document.querySelector("[data-code-complete]").checked'));
  await evaluate('var editor=document.querySelector("[data-code]");editor.value+="\\n# one more edit";editor.dispatchEvent(new Event("input"))');
  check('Editing clears only the current language completion',await evaluate('!document.querySelector("[data-code-complete]").checked && App.state.coding["earth-coding-v1"].go.complete && App.totals().coding===1'));
  await evaluate('window.confirm=()=>false;document.querySelector("[data-restore-code]").click()');
  check('Cancelling starter restoration preserves the draft',await evaluate('document.querySelector("[data-code]").value.includes("one more edit")'));
  await evaluate('App.download=(name,content)=>{window.downloadedCode={name,content};};document.querySelector("[data-download-code]").click()');
  check('Code download contains the edited runnable file',await evaluate('downloadedCode.name==="earth.py" && downloadedCode.content.includes("one more edit") && downloadedCode.content.includes("def orthometric_height")'));
  fs.writeFileSync(path.join(artifacts,'coding-desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await route('#lesson/earth/fieldwork');
  check('Fieldwork deep link reveals the optional tasks',await evaluate('document.querySelector("#section-fieldwork").open'));
  await evaluate('document.querySelector("#topic-notes").value="Test note <script>unsafe</script> & literal text";document.querySelector("#topic-notes").dispatchEvent(new Event("input"));document.querySelector("[data-task=earth-0]").click()');
  const reloaded=once('Page.loadEventFired');await send('Page.reload');await reloaded;
  check('Code drafts, completion, task and notes survive reload',await evaluate('App.totals().coding===1 && App.state.coding["earth-coding-v1"].python.code.includes("one more edit") && document.querySelector("[data-task=earth-0]").checked && document.querySelector("#topic-notes").value.includes("<script>unsafe</script>")'));
  await route('#notebook');
  check('Notebook escapes saved markup in the saved topic after chapter reordering',await evaluate('document.querySelector(\'.notebook-card a[href="#lesson/earth"]\').closest(".notebook-card").textContent.includes("<script>unsafe</script>") && !document.querySelector(".notebook-card script")'));
  await evaluate('App.download=(name,content)=>{window.exportedNotebook={name,content};};document.querySelector("#export-notes").click()');
  check('Notebook exports both language drafts, local output, progress and literal notes',await evaluate('exportedNotebook.name==="my-gis-fieldnotes.md" && exportedNotebook.content.includes("1/18 programming exercises completed (self-reported)") && exportedNotebook.content.includes("one more edit") && exportedNotebook.content.includes("package main") && exportedNotebook.content.includes("negative-height") && exportedNotebook.content.includes("<script>unsafe</script>") && exportedNotebook.content.includes("Archived quiz records")'));
  await evaluate('window.confirm=()=>false;document.querySelector("#reset-progress").click()');
  check('Cancelling reset preserves notes and progress',await evaluate('App.totals().coding===1 && App.state.notes.earth.includes("Test note")'));
  await route('#lesson/geotransform/visual');
  await evaluate('document.querySelectorAll("[data-cell]")[23].focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  check('Cell-grid visual is keyboard operable',await evaluate('document.querySelector(".lab-output").textContent.includes("col=5, row=3")'));
  await route('#practice');
  check('Workshop starts with all 18 programming exercises in chapter order',await evaluate('document.querySelectorAll("[data-coding-topic]").length===18 && document.querySelector("[data-coding-topic]").dataset.codingTopic==="geometry" && !document.querySelector("input[type=radio]")'));
  await evaluate('let filter=document.querySelector("#practice-topic");filter.value="earth";filter.dispatchEvent(new Event("change"))');
  check('Workshop topic filter restores the saved chapter draft',await evaluate('document.querySelectorAll("[data-coding-topic]").length===1 && document.querySelector("[data-code]").value.includes("one more edit")'));
  await evaluate('let status=document.querySelector("#practice-status");status.value="completed";status.dispatchEvent(new Event("change"))');
  check('Workshop progress filter finds the completed exercise',await evaluate('document.querySelectorAll("[data-coding-topic]").length'),1);
  await evaluate('const skill=document.querySelector("#practice-level");skill.value="Debug";skill.dispatchEvent(new Event("change"))');
  check('Workshop filters combine and show a recoverable empty state',await evaluate('document.querySelectorAll("[data-coding-topic]").length===0 && document.querySelector(".empty-state")!==null'));
  await evaluate('for(const select of document.querySelectorAll(".toolbar select"))select.value="all";document.querySelector("#draw-practice").click()');
  check('Mixed practice draws three distinct challenges',await evaluate('document.querySelectorAll("[data-coding-topic]").length===3 && new Set([...document.querySelectorAll("[data-coding-topic]")].map(e=>e.dataset.codingTopic)).size===3'));
  await route('#lesson/coverage');
  await evaluate('document.querySelector("[data-default]").click()');
  check('Coverage browser lab shows exact default totals',await evaluate('document.querySelector(".lab-output").textContent.includes("270,955") && document.querySelector(".lab-output").textContent.includes("22,497")'));
  await route('#resources');
  for(const file of ['data/neighbourhood-school.csv','data/stations.csv','data/stations_mixed.csv','data/stations_raw.csv','data/geolib.py','core-geospatial-concepts.md','beginner-geospatial-guide.md','SOURCE-COVERAGE.md']) check(`Download exists: ${file}`,(await fetch(url+file)).status,200);
  const programFiles=await evaluate('Object.keys(Programming.lessons).flatMap(id=>Object.keys(Programming.languages).flatMap(language=>["exercises/"+language+"/"+Programming.filepath(id,language),"exercises/solutions/"+language+"/"+Programming.filepath(id,language)]))');
  for(const file of programFiles){const response=await fetch(url+file);assert.equal(response.status,200,file);assert.ok((await response.text()).includes('All checks passed'),file);}
  check('All 72 starter/solution downloads are served with their runnable checks',true);

  await route('#reference');
  check('Complete-note index exposes all 71 original sections',await evaluate('document.querySelectorAll("[data-source-index]").length'),71);
  await evaluate('const sourceSearch=document.querySelector("#source-search");sourceSearch.value="Helmert";sourceSearch.dispatchEvent(new Event("input"))');
  check('Full-source search finds details inside sections',await evaluate('document.querySelectorAll("[data-source-index]").length>0 && document.querySelectorAll("[data-source-index]").length<71 && document.querySelector(\'[data-source-index="4-3"]\')!==null'));
  const sourceIDs=await evaluate('ReferenceData.sections.map(s=>s.id)');
  for(const id of sourceIDs){
    await route(`#reference/${id}`);
    await evaluate('Promise.all([...document.querySelectorAll(".source-text img")].map(image=>{image.loading="eager";return image.decode();}))');
    check(`${id}: complete source section, images and next navigation render`,await evaluate(`document.querySelector('.source-text').dataset.sourceId===${JSON.stringify(id)} && document.querySelector('.source-text h2')!==null && [...document.querySelectorAll('.source-text img')].every(i=>i.naturalWidth>0) && document.querySelectorAll('.lesson-pagination a').length===2 && document.documentElement.scrollWidth<=innerWidth`));
  }
  await route('#reference/4-3');
  await evaluate('document.fonts.ready');
  check('Helmert equation renders mathematical notation and an accessible MathML equivalent',await evaluate('document.querySelector(".source-equation .katex")!==null && document.querySelector(".source-equation math")!==null && !document.querySelector(".katex-error")'));
  await evaluate('document.querySelector(".source-equation").scrollIntoView({block:"center"})');
  fs.writeFileSync(path.join(artifacts,'full-detail-equation.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await route('#reference/3-5');
  await evaluate('document.querySelector(".source-diagram").scrollIntoView({block:"start"})');
  fs.writeFileSync(path.join(artifacts,'full-detail-schema.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await route('#lesson/transformations/source-4-3');
  check('Source-section deep link opens the relevant full chapter reading',await evaluate('document.querySelector("#section-source").open && document.querySelector("#section-source-4-3").open && document.querySelector("#section-source-4-3 .source-equation")!==null'));
  await route('#reference/exercise-4');
  check('Full project includes every deliverable, tolerance and source input',await evaluate('document.querySelector(".source-text").textContent.includes("coverage_report.md") && document.querySelector(".source-text").textContent.includes("±5 %") && document.querySelector(".source-text").textContent.includes("Amplitudes")'));
  await route('#reference/solution-4');
  check('Complete solution retains computation, plotting and GeoTIFF code',await evaluate('document.querySelector(".source-text").textContent.includes("dst.write") && document.querySelector(".source-text").textContent.includes("fig.savefig") && document.querySelector(".source-text").textContent.includes("stack.any(axis=0)")'));

  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await route('#home');
  check('Mobile navigation starts collapsed',await evaluate('!document.querySelector("#sidebar").classList.contains("open")'));
  await evaluate('document.querySelector("#menu").click()');
  check('Mobile navigation opens',await evaluate('document.querySelector("#menu").getAttribute("aria-expanded")==="true"'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  check('Escape closes mobile navigation and restores trigger focus',await evaluate('document.querySelector("#sidebar").inert && document.activeElement.id==="menu"'));
  await evaluate('document.querySelector("#menu").click()');
  await evaluate('document.querySelector("[data-topic=axes]").click()');
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  check('Choosing a mobile topic closes navigation',await evaluate('!document.querySelector("#sidebar").classList.contains("open") && location.hash==="#lesson/axes"'));
  check('Mobile lesson exposes programming, reading, full source, notes and optional reference',await evaluate('document.querySelectorAll(".lesson-quick-nav a").length'),5);
  for(const id of ids) {
    await route(`#lesson/${id}`);
    check(`${id}: mobile has no horizontal overflow`,await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  }
  const mobileShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'lesson-mobile.png'),Buffer.from(mobileShot.data,'base64'));
  await route('#lesson/topology/connections');
  const localMobileShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'bangladesh-connections-mobile.png'),Buffer.from(localMobileShot.data,'base64'));
  await route('#home');
  check('Mobile home has no horizontal overflow',await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:720,deviceScaleFactor:1,mobile:true});
  for(const id of ['crs','transformations','cartography','coverage']) {
    await route(`#lesson/${id}`);
    check(`${id}: 320px narrow layout reflows`,await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  }
  await route('#lesson/coverage/practice');
  await evaluate('document.querySelector(".coding-checks").open=true;document.querySelector(".coding-solution").open=true');
  check('Expanded coding task and long code fit 320px without widening the page',await evaluate('document.documentElement.scrollWidth<=innerWidth && document.querySelector("[data-code]").clientWidth<320'));
  await evaluate('document.querySelector("[data-code]").scrollIntoView({block:"center"})');
  fs.writeFileSync(path.join(artifacts,'coding-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  for(const id of ['2-3','3-5','4-3','4-4-4','4-9','solution-4','appendix-a']) {
    await route(`#reference/${id}`);
    check(`${id}: complete tables, formulas and code fit the 320px reading column`,await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  }
  await route('#reference/4-3');
  await evaluate('document.querySelector(".source-equation").scrollIntoView({block:"center"})');
  fs.writeFileSync(path.join(artifacts,'full-detail-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await route('#lesson/nonexistent');
  check('Unknown topic has a recovery link',await evaluate('document.querySelector("main a").getAttribute("href")==="#home"'));
  await navigate(pathToFileURL(path.join(root,'index.html')).href+'#lesson/resampling');
  check('Direct file opening works without a server',await evaluate('document.querySelectorAll("[data-coding-topic]").length===1 && document.querySelector("[data-code]").value.includes("def block_sum") && document.querySelector(".lab-output").textContent.includes("22.50")'));
  await route('#reference/4-3');
  check('Complete source and equations also work when opened directly from disk',await evaluate('document.querySelector(".source-equation math")!==null && document.querySelector(".source-text").textContent.includes("TransformerGroup")'));
  const denied=await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("Simulated storage denial");}});'});
  await navigate(url+'#lesson/earth');
  check('Storage denial leaves lessons and exercise session usable',await evaluate('!App.storageAvailable && document.querySelector(".storage-warning")!==null && document.querySelectorAll("[data-coding-topic]").length===1'));
  await evaluate('var editor=document.querySelector("[data-code]");editor.value+="\\n# session draft";editor.dispatchEvent(new Event("input"));document.querySelector("[data-code-complete]").click()');
  check('Storage-denied code and completion remain available for this session',await evaluate('App.state.coding["earth-coding-v1"].python.code.includes("session draft") && App.totals().coding===1'));
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:denied.identifier});
  check('No browser JavaScript exceptions',errors,[]);
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks:checks.length,errors},null,2));
  console.log(`\n${checks.length} browser checks passed. Screenshots: ${artifacts}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(socket?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}socket.close();}
  if(browser && !browser.killed)browser.kill();
  if(server)server.close();
});
