/* Reuse the Phase 5–6 SVG renderer, filling only steps without a Phase 1 illustration. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {render}=require('./phase56-figures.cjs');
const root=path.resolve(__dirname,'..');
const files=['course.js','beginner.js','phase2-course.js','phase3-course.js','phase4-course.js','early-steps.js'];
const {beginner,courses,figures}=vm.runInNewContext(files.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n')+'\n({beginner:Beginner,courses:[Phase2Course,Phase3Course,Phase4Course],figures:EarlySteps});');
let generated=0,covered=0;
for(let phase=1;phase<=4;phase++){
  const lessons=phase===1?beginner.path.map(id=>({id,...beginner.lessons[id]})):courses[phase-2].lessons;
  const definitions=figures[`phase${phase}`];
  if(Object.keys(definitions).length!==lessons.length)throw Error(`Phase ${phase}: unexpected lesson mapping`);
  for(const lesson of lessons){
    const steps=definitions[lesson.id];
    if(steps?.length!==lesson.steps.length)throw Error(`Missing visuals for ${phase}/${lesson.id}`);
    for(const [index,visual] of steps.entries()){
      const existing=phase===1&&[lesson.figure,...(lesson.stepFigures||[])].some(f=>f[1]===index);
      if(visual){
        if(existing)throw Error(`Duplicate step illustration: ${lesson.id}/${index+1}`);
        if(!visual.caption)throw Error(`Missing caption: ${lesson.id}/${index+1}`);
        fs.writeFileSync(path.join(root,figures.path(phase,lesson.id,index)),render(visual));
        generated++;
      }else if(!existing)throw Error(`Unillustrated step: ${phase}/${lesson.id}/${index+1}`);
      covered++;
    }
  }
}
console.log(`Built ${generated} new SVGs; all ${covered} Phase 1–4 reading steps have illustrations.`);
