# Fieldnotes — the geospatial field guide

A static HTML/CSS/JavaScript learning website with a connected beginner story and the complete technical reading from `core-geospatial-concepts.md`. All generated pages, equations, diagrams and font assets are included for offline use.

## Open it

Open **index.html** in a modern browser. No build step or npm installation is required.

For consistent local storage across sessions, serve the folder on a fixed origin:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Visit **http://localhost:8000** or use this computer’s local-network IP address from another device on the same network. Start at **http://localhost:8000/#lesson/geometry**. Interactive diagrams need no backend. Programming exercises run locally with Python or Go and need only the standard library. Web fonts are optional and fall back to system fonts offline.

## Explore

- **New to GIS?** Start at [chapter 1](index.html#lesson/geometry) or download [the connected beginner guide](beginner-geospatial-guide.md). Follow one invented neighbourhood near Dhaka to answer “How many people live near at least one school?” The same schools, homes and population grid connect all 18 chapters.
- Read in sequence: draw the places → locate them → measure carefully → add population → count people once → explain and share. Every chapter recalls the previous step, explains new terms as they appear, develops three short reading sections, includes an explained diagram and a pause question, and introduces the next step.
- **Complete source coverage:** [71 of 71 sections](index.html#reference), including 34 tables, 33 code/text listings, 9 rendered equations, 6 rendered Mermaid diagrams, 16 source illustrations, all four exercises and solutions, and Appendix A. Every chapter offers its mapped **Full detail from the original note**. [SOURCE-COVERAGE.md](SOURCE-COVERAGE.md) records exact locations and source line ranges.
- The complete-note reader has source-order Previous/Next links, full-text search and a glossary. Short clarifications identify terminology differences and source-code assumptions. The downloadable guide includes the entire technical note after the connected first reading.
- 18 topic pages, reached through unique URLs such as `index.html#lesson/axes`.
- Persistent topic sidebar, lesson cards, Previous/Next navigation and per-lesson section links.
- The main reading uses one column, with the Next link immediately after the chapter. Interactive experiments, programming exercises and technical explanations open separately below it; section links reveal their content automatically.
- 16 original neighbourhood diagrams share explicit geometry and population data. Both the website and downloadable guide use the same chapters and generated images. The 24-cell teaching grid contains 240 people; the two school areas select 200 people when shared cells are counted once.
- Optional Bangladeshi analogies include Dhaka addresses, Tangail paddy plots, shared aal boundaries, Khulna height references, Sylhet floods, Kamalapur access and cyclone-shelter coverage. These reference examples are separate from the connected story.
- 29 instructional source figures from QGIS, the Shapely manual and the user-provided GIS for Land Administration topology reference. Each displayed figure has a reading guide, concept question, full-size view, source and rights information. No scenic/historical photo gallery. See `assets/figures/CREDITS.md`.
- 12 original, scalable diagrams explain height references, axis swaps, distortion, reprojection, degree lengths, raster sampling, cell centres, interpolation, accuracy, classification, spatial predicates and coverage counting. Diagrams label their scale assumptions and synthetic examples; numerical graphics use the course reference calculations. The Markdown note includes these plus four relevant source figures.
- The optional geometry reference is a 12-part walkthrough: individual types, rings, multipart shapes, collections, dimensions, boundary/interior/exterior, validity, repair and dataset topology, illustrated with 13 directly relevant figures.
- **18 hands-on programming exercises**, each in **Python and Go**, replace the multiple-choice/numeric quiz bank. Each has a precise contract, acceptance criteria, starter code, runnable checks, a hint and a worked solution. [Open the workshop](index.html#practice) or [browse the downloadable files](exercises/README.md).
- Challenges progress from bounding boxes and coordinate guards to raster aggregation, polygon area, GeoJSON serialization and the 200-person school-coverage calculation.
- Separate editable Python/Go drafts, local test-output notes, code downloads and self-reported completion. The site does not execute Python or Go; run the downloaded file locally with `python3 file.py` or `go run file.go`.
- 54 self-assessed field tasks, including 18 Bangladesh challenges and the source’s progressive Python/QGIS projects.
- Workshop filters by topic, skill and completion; choose three mixed challenges or show all matches in chapter order.
- Local progress and editable notes; export to Markdown (including code drafts in both languages), print, or explicitly reset.
- Source references, tool links and downloadable CSVs on the reference shelf. Chapter 17 opens `data/neighbourhood-school.csv`, the same invented School A followed throughout the story; its documented CRS is EPSG:4326, with `lon` and `lat` fields.

Opening a solution does not mark an exercise complete. Completion is self-reported after running the supplied checks and an extra case locally. Completing either language counts once per chapter; editing a browser draft clears that language’s completion. Existing notes and field tasks are preserved. Old quiz records stay archived in storage and notebook exports, and do not count toward the new programming progress. Notes, drafts and progress are local to the browser and origin; export before switching browsers/origins or clearing storage.

## Files

- `index.html`: accessible application shell.
- `styles.css`: responsive styling and print layout.
- `course.js`: lesson explanations, source mappings and task rubrics.
- `programming.js`: challenge contracts, Python/Go implementations, runnable checks and standalone file generation.
- `coding.js`: language selection, draft editing, downloads and local-completion workflow.
- `exercises/`: 36 starter programs, 36 runnable solutions and the setup/catalogue README.
- `geo.js`: reference calculations for interactive diagrams.
- `bangladesh.js`: local analogies, relevant problem schematics and regional challenges.
- `teaching.js`: inline instructional figures, reading guides, micro-checks and the expanded geometry walkthrough.
- `beginner.js`: connected first readings, chapter order, recaps and transitions for all 18 topics. Existing topic IDs remain stable; programming drafts use independent versioned keys.
- `neighbourhood.js`: shared invented neighbourhood, population-cell selection and original story diagrams.
- `beginner-geospatial-guide.md`: connected reading with per-chapter detail links, followed by the full original technical note.
- `reference-data.js`: generated, complete source sections and rendered HTML, with source hashes and counts.
- `reference.js`: full-detail chapter disclosures, complete-note reader, search, glossary links and reading clarifications.
- `SOURCE-COVERAGE.md`: generated section-by-section coverage index.
- `visuals.js`: offline illustrations and interactive labs.
- `app.js`: navigation, practice, local persistence and notebook export.
- `data/`: the story’s School A CSV, station CSVs and complete `geolib.py` extracted from Appendix A.
- `tests/`: dependency-free Node tests.
- `scripts/build-study-figures.cjs`: rebuild the 12 original SVG illustrations with `node scripts/build-study-figures.cjs`.
- `scripts/build-beginner-guide.cjs`: rebuild the connected Markdown guide and 16 neighbourhood SVGs with `node scripts/build-beginner-guide.cjs` after changing the story or diagram source.
- `scripts/build-programming.cjs`: rebuild all downloadable programs and the exercise catalogue from the same definitions used in the browser.
- `scripts/build-reference.cjs` and `scripts/reference-map.cjs`: compile the full source into explicit chapter mappings, rendered equations/diagrams, downloadable code and the coverage report. A new unmapped heading fails the build.
- `assets/vendor/`: local KaTeX styles/fonts and rendering-tool licences. Build dependencies are pinned in `package-lock.json`; no Markdown, math or diagram engine runs in the browser.

## Deploy on Vercel

Import this repository with its root as the Vercel project root. `vercel.json` deploys the committed static files directly, skipping dependency installation and the build command. Vercel does not need Chromium or Puppeteer; running `npm run build` there can fail because the build image lacks Chrome's shared libraries (such as `libnspr4.so`).

After editing generated content, run the rebuild steps below locally, run `npm test`, and commit the regenerated files before deploying. Redeploy on Vercel after committing this configuration. The local `npm run build` command is unchanged.

## Rebuild after editing content

Node 22.13+ and Chromium are needed to rebuild the complete technical reading:

```bash
npm ci
npm run build
```

To use an already installed Chromium, set `PUPPETEER_SKIP_DOWNLOAD=true` during installation and `PUPPETEER_EXECUTABLE_PATH` during the build. In this environment the build uses `PUPPETEER_EXECUTABLE_PATH=/tmp/opencode/gis-chromium npm run build`. The prebuilt website itself still opens without installing dependencies.

The source slices must reconstruct the original document exactly. Tests verify every section's mapping, code and equation retention, image availability, and the complete guide/Appendix A download. Rebuild the full reference after changing `core-geospatial-concepts.md`; the guide generator rejects stale reference data.

Run the calculation/content tests with:

```bash
node --test tests/*.test.cjs
```

Verify all actual Python/Go solutions and confirm unimplemented starters fail at their TODO (requires both runtimes):

```bash
npm run test:programming
```

Real-browser smoke checks (Windows Edge, or set `EDGE_PATH`):

```bash
node tests/browser-smoke.cjs
```

This script starts an isolated headless Edge profile and a temporary local server, then closes both. It uses the browser’s DevTools protocol without Playwright or npm dependencies. Screenshots and results go to the approved OpenCode temporary directory.

Bangladesh material is an explicitly labelled teaching adaptation. Approximate Dhaka city coordinates are not a surveyed Kamalapur location. Dhaka and Rajshahi fall in different standard UTM zones; do not assume one UTM CRS fits all of Bangladesh. The Dutch station reference dataset is retained unchanged so the original numerical exercises remain reproducible. Synthetic shelter examples are not operational evacuation plans.

The GIS for Land Administration image was supplied by the user; no explicit general reuse licence was found in its repository. Its caption and credit manifest flag that uncertainty. Obtain permission or replace that figure before publicly redistributing if required. The QGIS and Shapely figures retain their documented licences; attribution is displayed alongside them.

The optional population lab computes the technical reference’s synthetic 45 × 40 raster and 64-vertex buffers. Its default 15 km checkpoints match that note. This is a separate dataset from the beginner story’s 6 × 4 grid and 200 m school rule. Its colours use fixed reference breaks. Projection distortion diagrams use a labelled spherical approximation; schematic visuals state their assumptions. Python/SQL snippets and QGIS tasks run in external tools, not in the browser.
