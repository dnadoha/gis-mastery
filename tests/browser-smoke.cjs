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
  check('Homepage renders 18 topic cards',await evaluate('document.querySelectorAll(".course-card").length'),18);
  check('Sidebar provides 18 topic links',await evaluate('document.querySelectorAll("[data-topic]").length'),18);
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
    check(`${id}: 8 exercises, 3 field tasks and visual output`,await evaluate('document.querySelectorAll("[data-exercise]").length===8 && document.querySelectorAll("[data-task]").length===3 && document.querySelector(".lab-output").textContent.length>20'));
    check(`${id}: relevant local schematic, inline explanations and visible regional analogy`,await evaluate('document.querySelectorAll(".story-figure svg").length===1 && document.querySelectorAll(".reference-image").length===0 && document.querySelector(".analogy strong").textContent.includes("Bangladesh") && document.querySelectorAll(".concept-section").length>=3'));
    await evaluate('Promise.all([...document.querySelectorAll(".concept-figure img")].map(image=>{image.loading="eager";return image.decode();}))');
    check(`${id}: instructional figures decode and have reading guides`,await evaluate('[...document.querySelectorAll(".concept-figure")].every(f=>f.querySelector("img").naturalWidth>0 && f.textContent.includes("How to read it.") && f.querySelector(".figure-check"))'));
    check(`${id}: topic and previous/next navigation`,await evaluate('document.querySelectorAll(".lesson-pagination a").length===2 && document.querySelectorAll("[data-topic][aria-current=page]").length===1'));
    // Exercise each native visual control, including all select states.
    await evaluate(`(() => { const selects=document.querySelectorAll('.lab-controls select');selects.forEach(s=>{[...s.options].forEach(o=>{s.value=o.value;s.dispatchEvent(new Event('input',{bubbles:true}));});});document.querySelectorAll('.lab-controls input[type=range]').forEach(r=>{r.value=r.max;r.dispatchEvent(new Event('input',{bubbles:true}));});document.querySelector('[data-cell="23"]')?.click(); })()`);
    check(`${id}: visual remains finite after interaction`,await evaluate('!document.querySelector(".visual-lab").innerHTML.includes("NaN")'));
  }

  await route('#lesson/topology/connections');
  const connectionShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'bangladesh-connections-desktop.png'),Buffer.from(connectionShot.data,'base64'));
  await route('#lesson/topology/sub-0');
  await evaluate('document.querySelector(".concept-figure").scrollIntoView({block:"start"})');
  const photoShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'credited-reference-images.png'),Buffer.from(photoShot.data,'base64'));
  await route('#lesson/geometry/sub-1');
  check('Geometry is a step-by-step lesson with 13 directly relevant diagrams',await evaluate('document.querySelectorAll(".concept-figure").length===13 && document.querySelectorAll(".subtopic-nav a").length===12'));
  const geometryShot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(artifacts,'geometry-point-explanation.png'),Buffer.from(geometryShot.data,'base64'));
  await route('#lesson/earth/practice');
  check('Lesson jump navigates directly to exercises',await evaluate('document.querySelector("#section-practice").getBoundingClientRect().top<30'));
  await evaluate(`document.querySelector('[data-exercise="earth-0"] [value="0"]').click();document.querySelector('[data-exercise="earth-0"] form').requestSubmit()`);
  check('Wrong answer is not passed',await evaluate('!App.state.checks["earth-0"].mastered && document.querySelector("[data-exercise=earth-0] .feedback").classList.contains("wrong")'));
  await evaluate(`document.querySelector('[data-exercise="earth-0"] [data-reveal]').click();document.querySelector('[data-exercise="earth-0"] [value="1"]').click();document.querySelector('[data-exercise="earth-0"] form').requestSubmit()`);
  check('Revealed answer cannot earn a pass',await evaluate('!App.state.checks["earth-0"].mastered'));
  await evaluate(`document.querySelector('[data-exercise="earth-0"] [data-retry]').click();document.querySelector('[data-exercise="earth-0"] [value="1"]').click();document.querySelector('[data-exercise="earth-0"] form').requestSubmit()`);
  check('Fresh correct answer earns one pass',await evaluate('App.state.checks["earth-0"].mastered && App.totals().checks===1'));
  await evaluate('let input=document.querySelector("[data-exercise=earth-3] input");input.value="1";document.querySelector("[data-exercise=earth-3] form").requestSubmit()');
  check('Numeric answer is graded in the browser',await evaluate('App.state.checks["earth-3"].mastered'));
  await evaluate('document.querySelector("#topic-notes").value="Test note <script>unsafe</script> & literal text";document.querySelector("#topic-notes").dispatchEvent(new Event("input"));document.querySelector("[data-task=earth-0]").click()');
  const reloaded=once('Page.loadEventFired');await send('Page.reload');await reloaded;
  check('Checks, task and notes survive reload',await evaluate('App.totals().checks===2 && document.querySelector("[data-task=earth-0]").checked && document.querySelector("#topic-notes").value.includes("<script>unsafe</script>")'));
  await route('#notebook');
  check('Notebook escapes saved markup',await evaluate('document.querySelector(".notebook-card").textContent.includes("<script>unsafe</script>") && !document.querySelector(".notebook-card script")'));
  await evaluate('App.download=(name,content)=>{window.exportedNotebook={name,content};};document.querySelector("#export-notes").click()');
  check('Notebook export includes progress and literal notes',await evaluate('exportedNotebook.name==="my-gis-fieldnotes.md" && exportedNotebook.content.includes("2/144 checks") && exportedNotebook.content.includes("<script>unsafe</script>")'));
  await evaluate('window.confirm=()=>false;document.querySelector("#reset-progress").click()');
  check('Cancelling reset preserves notes and progress',await evaluate('App.totals().checks===2 && App.state.notes.earth.includes("Test note")'));
  await route('#lesson/geotransform/visual');
  await evaluate('document.querySelectorAll("[data-cell]")[23].focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  check('Cell-grid visual is keyboard operable',await evaluate('document.querySelector(".lab-output").textContent.includes("col=5, row=3")'));
  await route('#practice');
  check('Practice starts with ten questions',await evaluate('document.querySelectorAll("[data-exercise]").length'),10);
  await evaluate('let filter=document.querySelector("#practice-topic");filter.value="earth";filter.dispatchEvent(new Event("change"))');
  check('Practice topic filter shows eight questions',await evaluate('document.querySelectorAll("[data-exercise]").length'),8);
  await evaluate('let status=document.querySelector("#practice-status");status.value="passed";status.dispatchEvent(new Event("change"))');
  check('Practice progress filter finds two passed questions',await evaluate('document.querySelectorAll("[data-exercise]").length'),2);
  await route('#lesson/coverage');
  await evaluate('document.querySelector("[data-default]").click()');
  check('Coverage browser lab shows exact default totals',await evaluate('document.querySelector(".lab-output").textContent.includes("270,955") && document.querySelector(".lab-output").textContent.includes("22,497")'));
  await route('#resources');
  for(const file of ['data/stations.csv','data/stations_mixed.csv','data/stations_raw.csv','core-geospatial-concepts.md']) check(`Download exists: ${file}`,(await fetch(url+file)).status,200);

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
  check('Mobile lesson exposes section navigation',await evaluate('document.querySelectorAll(".lesson-quick-nav a").length'),5);
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
  await route('#lesson/nonexistent');
  check('Unknown topic has a recovery link',await evaluate('document.querySelector("main a").getAttribute("href")==="#home"'));
  await navigate(pathToFileURL(path.join(root,'index.html')).href+'#lesson/resampling');
  check('Direct file opening works without a server',await evaluate('document.querySelectorAll("[data-exercise]").length===8 && document.querySelector(".lab-output").textContent.includes("22.50")'));
  const denied=await send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("Simulated storage denial");}});'});
  await navigate(url+'#lesson/earth');
  check('Storage denial leaves lessons and exercise session usable',await evaluate('!App.storageAvailable && document.querySelector(".storage-warning")!==null && document.querySelectorAll("[data-exercise]").length===8'));
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:denied.identifier});
  check('No browser JavaScript exceptions',errors,[]);
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks:checks.length,errors},null,2));
  console.log(`\n${checks.length} browser checks passed. Screenshots: ${artifacts}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(socket?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}socket.close();}
  if(browser && !browser.killed)browser.kill();
  if(server)server.close();
});
