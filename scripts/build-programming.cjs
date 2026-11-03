/* The browser and downloads share the same exercise definitions and check cases. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const {programming,order}=vm.runInNewContext(['course.js','beginner.js','programming.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n')+'\n({programming:Programming,order:Beginner.path})');
for(const id of order) {
  if(!programming.lessons[id])throw Error(`Missing programming exercise: ${id}`);
  for(const language of Object.keys(programming.languages))for(const solution of [false,true]) {
    const file=path.join(root,'exercises',solution?'solutions':'',language,programming.filepath(id,language));
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,programming.file(id,language,solution));
  }
}
const readme=`# GIS programming exercises — Python or Go

One challenge for each chapter of the connected neighbourhood story. Choose either language, or solve both. All 36 versions use only their language's standard library. No GIS packages, npm packages, API keys or network access are needed to run a downloaded exercise.

## Start here

1. Install [Python 3.10+](https://www.python.org/downloads/) or [Go 1.18+](https://go.dev/dl/). Check with \`python3 --version\` (on Windows, \`py --version\`) or \`go version\`.
2. Download a starter below and open it in your editor. A function is a named block of code: it receives the inputs in its parentheses and returns a result. Replace the TODO body with your own implementation.
3. Open a terminal in the downloaded file's folder. Run \`python3 geometry.py\` (Windows: \`py geometry.py\`) or \`go run geometry.go\`. Substitute the filename for your chapter. In this repository, each Go exercise has its own package directory: from \`exercises/go\`, run \`go run ./geometry\`. Keep separately downloaded Go exercises in separate folders too, so their helpers and \`main\` functions do not collide.
4. Keep the supplied checks. Each \`check(actual, expected)\` call compares your result to a known answer; a mismatch raises an error. The unimplemented starter intentionally fails. Floating-point comparisons allow an absolute tolerance of 0.000001 or a relative tolerance of 0.000000001, whichever is larger.
5. When you see \`All checks passed\`, add at least one extra case, run again, then record completion on the website. Use the hints and solutions after attempting the problem.

The [programming workshop](../index.html#practice) saves a separate draft, local-output note and self-reported completion for each language. It does not execute code. Download your edited file to run it locally. After editing in your own editor, paste your finished file back into the website if you want it included in your notebook export. Editing a browser draft clears that language's completion. Completing either language counts once per chapter.

## Chapters and files

| Chapter | Challenge | Python starter | Go starter | Worked solutions |
|---|---|---|---|---|
${order.map((id,i)=>`| ${i+1} | [${programming.lessons[id].title}](../index.html#lesson/${id}/practice) | [${programming.filename(id,'python')}](python/${programming.filepath(id,'python')}) | [${programming.filename(id,'go')}](go/${programming.filepath(id,'go')}) | [Python](solutions/python/${programming.filepath(id,'python')}) · [Go](solutions/go/${programming.filepath(id,'go')}) |`).join('\n')}

These challenges use explicit input contracts and small teaching datasets. Read each contract before implementing it. The [complete technical note](../core-geospatial-concepts.md) includes the larger Python/QGIS station projects and full mathematical detail.

## Rebuild / verify (maintainers)

Edit \`programming.js\`, then run \`node scripts/build-programming.cjs\`. The generated files are complete standalone programs, including the same check cases displayed on the website. Run \`npm run test:programming\` with Python and Go installed to execute all worked solutions and confirm all untouched starters fail at their TODO rather than passing accidentally.
`;
fs.writeFileSync(path.join(root,'exercises/README.md'),readme);
console.log(`Built ${order.length} challenges in Python and Go: 36 starters and 36 runnable solutions.`);
