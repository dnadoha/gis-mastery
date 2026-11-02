# Fieldnotes — the geospatial field guide

A dependency-free HTML/CSS/JavaScript learning website based on `core-geospatial-concepts.md` (left unchanged).

## Open it

Open **index.html** in a modern browser. No build step or npm installation is required.

For consistent local storage across sessions, serve the folder on a fixed origin:

```bash
python -m http.server 8000
```

Visit **http://localhost:8000**. The browser exercises need no Python packages or backend. Web fonts are optional and fall back to system fonts offline.

## Explore

- 18 topic pages, reached through unique URLs such as `index.html#lesson/axes`.
- Persistent topic sidebar, lesson cards, Previous/Next navigation and per-lesson section links.
- Step-by-step explanations, an interactive lab, a relevant local schematic, and instructional figures placed beside the concept they explain. Figures are not added to meet an image quota.
- Bangladeshi analogies throughout: Dhaka addresses, Tangail paddy plots, shared aal boundaries, Khulna height references, Sylhet floods, Kamalapur access and cyclone-shelter coverage.
- 29 instructional source figures from QGIS, the Shapely manual and the user-provided GIS for Land Administration topology reference. Each displayed figure has a reading guide, concept question, full-size view, source and rights information. No scenic/historical photo gallery. See `assets/figures/CREDITS.md`.
- Geometry is a 12-part walkthrough: individual types, rings, multipart shapes, collections, dimensions, boundary/interior/exterior, validity, repair and dataset topology, illustrated with 13 directly relevant figures.
- 144 auto-checked questions with hints, solutions, retries, numeric tolerances and shuffled choices.
- 54 self-assessed field tasks, including 18 Bangladesh challenges and the source’s progressive Python/QGIS projects (198 checks/tasks in total).
- Practice bank filtered by topic, skill and progress; draw 10 questions or show all matches.
- Local progress and editable notes; export to Markdown, print, or explicitly reset.
- Source references, tool links and downloadable station CSVs on the reference shelf.

Revealing a solution does **not** award a pass. Retry starts a fresh unassisted attempt. A passed check records that it was answered correctly at least once; later mistakes do not erase that history. Field-task checkboxes are self-assessment, not code execution or grading. Notes/progress are local to the browser and origin; clearing browser storage removes them. Export before switching browsers/origins.

## Files

- `index.html`: accessible application shell.
- `styles.css`: responsive styling and print layout.
- `course.js`: lesson explanations, source mappings, questions and task rubrics.
- `geo.js`: reference calculations and numeric grading.
- `bangladesh.js`: local analogies, relevant problem schematics and regional challenges.
- `teaching.js`: inline instructional figures, reading guides, micro-checks and the expanded geometry walkthrough.
- `visuals.js`: offline illustrations and interactive labs.
- `app.js`: navigation, practice, local persistence and notebook export.
- `data/`: CSV inputs for the external exercises.
- `tests/`: dependency-free Node tests.

Run the calculation/content tests with:

```bash
node --test tests/course.test.cjs
```

Real-browser smoke checks (Windows Edge, or set `EDGE_PATH`):

```bash
node tests/browser-smoke.cjs
```

This script starts an isolated headless Edge profile and a temporary local server, then closes both. It uses the browser’s DevTools protocol without Playwright or npm dependencies. Screenshots and results go to the approved OpenCode temporary directory.

Bangladesh material is an explicitly labelled teaching adaptation. Approximate Dhaka city coordinates are not a surveyed Kamalapur location. Dhaka and Rajshahi fall in different standard UTM zones; do not assume one UTM CRS fits all of Bangladesh. The Dutch station reference dataset is retained unchanged so the original numerical exercises remain reproducible. Synthetic shelter examples are not operational evacuation plans.

The GIS for Land Administration image was supplied by the user; no explicit general reuse licence was found in its repository. Its caption and credit manifest flag that uncertainty. Obtain permission or replace that figure before publicly redistributing if required. The QGIS and Shapely figures retain their documented licences; attribution is displayed alongside them.

The website’s population lab computes the source’s synthetic 45 × 40 raster and 64-vertex buffers, rather than substituting fixed totals when the radius changes. Its default 15 km checkpoints match the supplied note. Its colours use fixed reference breaks; this interactive preview is not the external exercise’s final map deliverable. Projection distortion diagrams use a labelled spherical approximation; all schematic visuals are identified as such. Python/SQL snippets and QGIS tasks run in external tools, not in the browser.
