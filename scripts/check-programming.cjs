/* Execute the actual downloadable teaching programs, not a JavaScript reimplementation. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const programming=vm.runInNewContext(fs.readFileSync(path.join(root,'programming.js'),'utf8')+';Programming');
let passed=0;
for(const [id] of Object.entries(programming.lessons))for(const language of Object.keys(programming.languages))for(const solution of [true,false]) {
  const file=path.join(root,'exercises',solution?'solutions':'',language,programming.filename(id,language));
  assert.equal(fs.readFileSync(file,'utf8'),programming.file(id,language,solution),`Stale download: ${file}`);
  const command=language==='python'?(process.env.PYTHON||'python3'):'go';
  const args=language==='python'?[file]:['run',file];
  const result=spawnSync(command,args,{encoding:'utf8',timeout:60000,cwd:root});
  if(result.error)throw result.error;
  if(solution){assert.equal(result.status,0,`${file}\n${result.stderr}`);assert.match(result.stdout,/All checks passed/);}
  else {assert.notEqual(result.status,0,`Starter already passes: ${file}`);assert.match(result.stderr,/Implement this function/,`${file}\n${result.stderr}`);}
  passed++;
  console.log(`PASS ${id} / ${language} / ${solution?'solution checks':'starter fails at TODO'}`);
}
console.log(`${passed} program runs verified.`);
