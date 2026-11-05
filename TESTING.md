# Verification notes

## Scope and risks

Local verification of a static teaching website. Success means every source detail is included, every topic is navigable, visuals and source images load, programming checks execute correctly, and saved learning work survives reload. The highest risks are omitted source content, misleading GIS calculations, silent loss of notes/code drafts, misleading completion labels, and broken topic/mobile navigation.

No existing application or test suite was present before implementation. The supplied technical Markdown provides the original numerical expectations. The connected beginner story adds independently checkable school distances, a coordinate conversion and whole-cell population totals. Invented neighbourhood and Bangladesh examples are labelled teaching data.

## Verified

- **17 calculation/content tests pass:** chapter/challenge coverage, all 72 generated program files, numerical teaching checkpoints, exact source reconstruction and hashes, source chapter/reader mappings, complete code/equation/table/diagram retention, and the full guide/Appendix A downloads.
- **72 actual program runs verified:** all 36 Python/Go solutions pass their supplied checks; all 36 untouched starters fail at the TODO. Python 3.14.4 and Go 1.27.1 were used. Exercise contracts cover boundaries, empty inputs where supported, axis ambiguity, UTM exceptions, population conservation, overlap deduplication, numeric tolerances and JSON escaping.
- Content checks require a Bangladesh analogy, limitations, a regional challenge and relevant schematic for every topic, without a photo-filler gallery. All instructional PNGs have valid signatures. Figure rendering requires source links, reading guides and concept questions; geometry requires the expected 13 figures and correct distinctions between open/closed LineStrings and coordinate/topological dimensions.
- **304 real-browser checks pass** in isolated headless Chromium: all 18 coding challenges and absence of radio quizzes; separate Python/Go drafts, language switching, code downloads, explicit self-reported completion, edit invalidation, migration, output notes and notebook export; all 72 program downloads; workshop filters; all 71 source sections and images/navigation; equations/MathML; connected readings; desktop/mobile reflow; direct file opening; storage-denied fallback; no observed JavaScript exceptions.
- All topics were checked for horizontal overflow at 390 px; selected longer topics were also checked at 320 px. Desktop checks use a 1440 px viewport. Browser tests block web fonts, exercising the system-font fallback.
- QGIS and Shapely documentation figure URLs and licence statements were checked. The user-provided topology diagram is included with an explicit unknown-general-reuse-licence warning, not an invented open licence. Credits are in `assets/figures/CREDITS.md` and beside each displayed figure. Superseded context photographs were removed.

## Verification history

### Phase 1–4 per-step visuals · 5 November 2026

- **Coverage:** all 147 reading steps across the 49 early-phase chapters now contain illustrations. Added 126 local SVGs, retaining the existing Phase 1 step figures and all chapter/source diagrams. The six-phase app now illustrates all 219 reading steps.
- **Build:** `npm run build:early-steps` succeeds and rejects missing step mappings or duplicate replacements of existing Phase 1 illustrations. The shared SVG renderer still reproduces all 72 Phase 5–6 step assets exactly.
- **Browser:** 959 Edge/CDP checks pass. Every early-phase step has a loaded image, descriptive alt text, caption and full-size link. All 49 chapters fit 320 px; wide figures have keyboard-focusable internal scrolling. Representative pages also load directly from disk. All 198 generated step SVGs parse and every text label fits its viewBox. Navigation, source readers, progress, notes, export and storage-denied behaviour pass across all six phases, with no JavaScript exceptions.
- **Visual inspection:** inspected the mobile school-road plot, DEM coordinate table, synthetic flood overlay and incident-on-district-boundary map. Screenshots are in `C:\Users\HDSL 72\AppData\Local\Temp\opencode\gis-browser-2hnJwf`.
- **Node suite:** 50/51 pass. The existing Go geometry download mismatch remains: the tracked learner implementation differs from the generated TODO starter. The old projection test now expects the new step-3 illustration while still requiring both original step-1 images.
- **Content:** the source notes and existing diagrams are preserved. New captions identify synthetic fixtures, schematic drawings, coordinate offsets, units and interpretation limits. This verification concerns the learning app, not execution of external GIS services or databases.

### Phase 5–6 app extension · 5 November 2026

- **Built:** ten Phase 5 chapters and fourteen Phase 6 chapters, with an original labeled SVG and caption inside all 72 reading steps. The source readers retain all 65 + 81 sections, 54 tables, 92 code/text listings, eleven Mermaid diagrams and 21 displayed Phase 6 equations, plus inline MathML. All eight original exercises and full Markdown solutions are downloadable.
- **Source integrity:** SHA-256 comparisons against the pre-edit copies confirm both supplied notes are byte-for-byte unchanged. The build reads them without writing them. LF-canonical source slices reconstruct every source character and have explicit unique chapter mappings.
- **Passed:** 28/28 Phase 2–6 Node checks, including nine new source/visual/record checks. The complete Node suite passes 50/51; the sole failure is the previously documented Phase 1 Go geometry starter containing a learner implementation rather than the generated TODO. That file was preserved.
- **Passed:** 856 real-browser checks using the existing headless Edge/CDP runner across all six phases. New checks cover every chapter’s three loaded visuals, all 146 source routes at 320 px, source search and empty results, step/source deep links, Next navigation, downloads, independent progress, evidence-edit invalidation, reload persistence, escaped notes, six-phase export/reset, direct-file images and storage-denied sessions. No JavaScript exceptions were observed.
- **Visual inspection:** every new step SVG parses as XML and every text label fits its viewBox, measured in the browser. Inspected desktop overviews, the inventory coordinate plot, hydrology matrices and narrow-screen NDVI reading. Narrow figures scroll within their own focusable region and have a full-size link. Screenshots: `C:\Users\HDSL 72\AppData\Local\Temp\opencode\gis-browser-rt7oGs`. Overview captures wait for lazy image decoding; mobile captures wait for navigation transitions.
- **Scope:** source outputs are teaching checkpoints. This run validates the static learning app and selected independent arithmetic, not live PostGIS/tile/edit servers, PDAL, external STAC acquisitions or model-training pipelines.

### Phase 4 integration · 4 November 2026

- **Verified:** nine connected chapters and all **60 source sections**, 25 tables, 37 code/text blocks and five offline Mermaid diagrams. Formulas and ASCII schematics remain complete preformatted text. The imported note matches the shared-folder original exactly after LF canonicalisation. The Phase 4 build succeeded with the existing pinned dependencies, Node 24.11 and headless Chromium 153 on Termux; no application dependencies were added.
- **Verified:** all six new Phase 4 tests pass; the combined Phase 2–4 suite passes **19/19**. Checks cover exact source reconstruction and hashes, unique mappings, complete listings/figures, original tasks and SQL downloads, independently calculated radius/nearest/history/graph checkpoints, separate clarifications, escaped notes and safely fenced notebook export.
- **Verified:** **622 real-browser checks pass** across all four phases, including nine Phase 4 chapters, all 60 source routes at 320 px, desktop overview, expanded capstone layout, source search/empty results, Next and source deep-link navigation, original task/solution disclosures, all SQL/Markdown downloads, independent completion, edit invalidation, reload persistence, combined export, confirmed/cancelled reset, direct-file diagrams and storage-denied session use. No JavaScript exceptions were observed. Desktop overview and mobile workshop screenshots were inspected. Artifacts: `/data/data/com.termux/files/usr/tmp/opencode/gis-browser-RedQSx`.
- **Existing unrelated failure retained:** the full Node suite passes **41/42**. The Phase 1 generated-download equality test still rejects the already-implemented `exercises/go/geometry/geometry.go` instead of its expected TODO starter, as documented in the Phase 3 entry. The learner file was preserved.
- **Source clarifications:** inclusive versus strict distance thresholds, projected-to-geography casts, version-dependent planner/function behaviour, MVT buffer candidate bounds, actual fixture tile addresses, graph contraction versus hierarchy preprocessing, polygon bbox overlap versus containment, incomplete hole-only gap audits, expected-error transaction handling, NULL/non-finite effective dates, range conventions, concurrent relocation and as-of index limitations. Original source and SQL downloads remain unchanged.
- **Not executed:** PostgreSQL/PostGIS, pgRouting, registry concurrency tests or an HTTP tile service. Numerical checks independently verify synthetic arithmetic; they do not replace local database execution. The setup guide explains extension requirements, shared-table execution order, expected failures/savepoints and the evidence learners should keep.

### Phase 3 integration · 3 November 2026

- **Verified:** ten connected chapters, all **53 source sections**, 23 tables, 33 code/text blocks (including the complete ASCII schematics), four KaTeX/MathML equations and five offline Mermaid diagrams. `npm run build:phase3` succeeded with installed Edge via `PUPPETEER_EXECUTABLE_PATH`; no new npm dependencies were added.
- **Verified:** all seven new Phase 3 Node tests pass; the combined Phase 2/3 suite passes **13/13**. Checks require exact LF-canonical source reconstruction and hashes, unique explicit chapter mappings, complete code/equation retention, original tasks/solutions, exact downloadable-code equality, assembled road fixtures, separate clarifications, escaped notes, fenced export and application integration.
- **Verified:** **530 real-browser checks pass** in the existing isolated Edge/CDP runner, covering all three phases. Phase 3 adds checks for ten chapters, 53 source routes at 320 px, five diagrams, all workshop/overview downloads, source search and empty results, original task/solution disclosures, Next navigation, source-section deep links, reload persistence, independent completion, evidence-edit invalidation, live progress, literal-note escaping, combined export, confirmed/cancelled reset, direct file opening and storage-denied session use. No JavaScript exceptions were observed. Desktop overview and mobile workshop screenshots were inspected. Artifacts: `C:\Users\HDSL 72\AppData\Local\Temp\opencode\gis-browser-pftVwV`.
- **Verified:** all eight generated Phase 3 Python files parse with Python's AST parser. This is syntax checking, not execution of GIS operations.
- **Existing unrelated failure retained:** the full Node suite passes **35/36**. The Phase 1 generated-download equality test rejects the already-edited `exercises/go/geometry/geometry.go`, which contains a learner implementation instead of the generated TODO starter. Existing geometry/axes work was not overwritten; the full build and programming-download generator were deliberately not run.
- **Source limitations remain explicit:** the `pyproj.transformer.TransformerGroup` import, differing buffer defaults, projected versus metre units, validity masks and class 0, concave-feature tile ownership, shared geocoder rate limits, positive-length versus point-only flood touches, reachable vertices versus isochrones, and host population versus cut-off residents. Source downloads are preserved, not silently repaired. The capstone report writer supplies only its table; learners must add assumptions and limitations.
- **Not verified:** NumPy, Shapely, GeoPandas, Rasterio, pyproj, NetworkX and pytest are not installed in the available Python environment. No native GIS pipeline, live geocoder/router, pgRouting SQL, COG hosting, real hazard dataset or third-party API correctness is claimed. Outputs are generated by learners locally, not supplied as fabricated execution evidence.

### Phase 1 build consistency repair · 3 November 2026

- Reproduced three failures in the original Phase 1 suite. Read-only comparisons established that LF canonicalisation restores the original source hash and Appendix A equality, and all 72 program contents agree after LF/Go-format canonicalisation. No changed exercise logic was found.
- Reused Phase 2's LF handling in the Phase 1 reference and guide builders. Source, guide, Appendix A and program comparisons still require exact content equality after normalising CRLF only; no assertions were skipped and no content checks were removed.
- Regenerated downloads using the existing builder, with user approval. This removes formatting drift in the geometry Go starter while preserving all separate Go package directories and download links. The shared definitions remain the source of truth.
- **Verified:** the full build succeeds, **all 27 Node tests pass**, **18 Python helper tests pass**, and **430 browser checks pass** after rebuilding both phases. Added regression checks for identical complete programs from LF/CRLF JavaScript checkouts and all 36 beginner-guide starter download targets. Browser artifacts: `C:\Users\HDSL 72\AppData\Local\Temp\opencode\gis-browser-UcP0U5`.
- **Verified:** **72 actual program runs** with Python 3.15.2 and Go 1.27.3: all 36 worked Python/Go solutions pass, and all 36 untouched starters fail at their intended TODO. Command: `PYTHON=python npm run test:programming`. Formatting-canonical comparison also confirms the regenerated Go geometry starter has unchanged code semantics.
- The three initial Phase 1 baseline failures listed in the integration entry below are now resolved. External GDAL/PMTiles execution remains outside this environment's verified coverage.

### Phase 2 integration · 3 November 2026

- **Verified:** 12 connected chapters and all **81 source sections**, including 30 tables, 44 code/text blocks and six offline Mermaid diagrams. Six new Node tests pass for LF-canonical source reconstruction, explicit mappings, rendered code/tables/diagrams, five complete tasks/solutions, downloads, axis-specific request templates and independent notebook export. `npm run build:phase2` succeeded with installed Edge as Chromium.
- **Verified:** **18 Python helper tests pass** with Python 3.15.2. Coverage includes original and promoted MultiPolygon winding, holes, malformed/zero-area rings, 3-D positions, tile boundaries and eight-address cover, separate GeoPackage/WKB endianness, malformed headers/commands, square MVT decoding and +400 area, actual generated DEM statistics, missing tools/artifacts, incomplete XML, attribute/null preservation and immediate SQLite cleanup on Windows.
- **Verified:** **430 real-browser checks pass** using the existing Edge/CDP runner, covering both phases. Phase 2 checks all 12 chapters, all 81 full-source routes at 320 px, six diagram downloads, all workshop downloads, five task/solution disclosures, source search, Next navigation, source deep links, reload persistence, independent completion, evidence-edit invalidation, live progress, escaped notes, combined export, direct file opening and storage-denied session behaviour. No JavaScript exceptions were observed. Desktop and narrow-mobile screenshots were inspected.
- **Fixed during QA:** workshop progress did not update after editing/checking evidence; missing metadata extent could crash verification without writing a report; SQLite transaction context managers did not close connections. Regression checks now cover these cases. The browser test also needed an explicit reload rather than waiting for a load event on same-document navigation.
- **Source corrections remain separate:** MultiPolygon support; `-a_nodata none` for the intentionally broken comparison; documented COG `PREDICTOR=FLOATING_POINT` versus GTiff numeric `3`; theoretical bbox-cover versus actual tile addresses; real release paths and actual COG inspection rather than source-only facts. Current driver options were checked against [GDAL COG documentation](https://gdal.org/en/stable/drivers/raster/cog.html); Features Part 3/CQL2 terminology against [OGC 19-079r2](https://docs.ogc.org/is/19-079r2/19-079r2.html).
- **Initial baseline failures (subsequently resolved; see entry above):** the older Phase 1 Node suite had three failures in generated program equality, source hash and Appendix A byte equality. CRLF checkout differences affected source/download equality; the Go geometry starter also differed in formatting from the generator after the separate `fixed golang locations` commit. The initial integration retained those files pending approval to repair the baseline. The full browser regression passed.
- **Not verified:** GDAL is unavailable (`gdalinfo: command not found`), so no actual vector/raster conversion chain or complete publishing package was executed here. No PMTiles, COG/INSPIRE conformance, live OGC endpoint, hosted Range/CORS, screen-reader, Firefox or Safari validation is claimed. The verifier deliberately fails unsupported PMTiles archive checks and missing required tools instead of marking them PASS.
- **Verdict:** GO for the static course within this tested scope; actual GDAL/PMTiles releases require local tool execution and separate conformance evidence. Screenshots/results: `C:\Users\HDSL 72\AppData\Local\Temp\opencode\gis-browser-njoWFc`.

### Programming exercises replace quizzes · 2 November 2026

- Removed the 144-question quiz data and browser answer grading. Added one substantive programming challenge per chapter, each with Python and Go starters, runnable checks, a hint, acceptance criteria and a worked solution.
- Ran every generated program: 36 passing solutions and 36 deliberately failing TODO starters. All 17 Node tests and 304 browser checks passed.
- Verified independent language drafts, completion counted once per chapter, editing invalidation, cancel-restore protection, literal code/notes escaping, export of both languages and local output, and storage-denied session behaviour. Prior quiz records are archived and exported, while notes and field tasks retain their keys.
- Visually inspected the programming exercise at desktop width and the expanded code editor/checks at 320 px. Long code scrolls within its container. The regenerated beginner guide links each chapter to its coding exercise and both starter downloads while still ending with the exact original technical note.
- Browser-test implementation initially reused a top-level constant in the DevTools session; scoped the reused test variables appropriately and reran successfully.

### Complete source coverage · 2 November 2026

- Audited every heading and retained every source character in 71 generated sections. The report maps each section to its complete reading and relevant chapter(s).
- Rendered all 34 tables, 33 code/text blocks, 9 displayed equations, 6 Mermaid definitions and 16 source images. Code and TeX definitions remain available verbatim. The complete beginner download ends with the unabridged source; `data/geolib.py` matches Appendix A exactly.
- **17 Node tests and 276 browser checks passed.** Source changes, missing mappings, shortened listings and missing diagram files are covered by explicit completeness checks.
- Inspected desktop equation/schema screenshots and 320 px equation scrolling. Tested long tables, matrix notation, full solutions and Appendix A at 320 px without widening the page. Mathematical fonts and generated diagrams are local assets; full readings also work through `file://`.
- Final rebuild and all 17 Node tests passed. Inspected the remaining five source diagrams; all six have no labels outside their SVG bounds. Validated all 35 SVGs as XML and 432 local Markdown links across seven documents, including appended-guide anchors and vendor licences. Confirmed the current reference scripts, coverage report, six diagrams, rendering assets and `geolib.py` are served byte-for-byte at `http://192.168.0.100:8000/`.
- Full source passages retain their original wording. Separate reading clarifications cover representation versus repeatability precision, projection approximations, the equal-interval empty-class count, raster versus vector styling, class-boundary conventions, and unsupported teaching-helper inputs.

### Connected neighbourhood story · 2 November 2026

- Reordered all 18 chapters into one project: draw → locate → measure → add population → count once → explain and share. The homepage, sidebar, Next/Previous links, notebook and generated guide follow that order. Existing topic IDs and persisted exercise keys are retained.
- **13 content/calculation tests and 189 browser checks passed.** The notebook check now finds the saved topic explicitly; its old “first card” assumption no longer matched the new chapter order.
- Checked the story’s 100 m home-to-school distance and School A’s EPSG:32646 coordinates. The 24-cell raster has 240 people; each school selects 12 cells, with 4 shared; counting 20 distinct cells gives 200 people.
- Generated and inspected all 16 neighbourhood SVGs at full size. Corrected a cell-centre marker covering its value, protected grid labels where circle outlines cross them, and aligned the conversion arrow. Browser-measured text bounds fit every SVG. The distance triangle uses equal axis scales.
- Inspected desktop and 390 px mobile screenshots. All chapters pass horizontal-overflow checks at 390 px; longer selected chapters also pass at 320 px.
- Validated 123 local Markdown links and parsed all 28 original SVGs, including accessible titles/descriptions and finite coordinates. Regenerated `beginner-geospatial-guide.md` from the same content used on the website.
- Confirmed the existing LAN server responds with HTTP 200 at `http://192.168.0.100:8000/`, including the new story script, diagram and School A CSV. Chapter 1 is `/#lesson/geometry`.

### Beginner-first reading verification · 2 November 2026

- All 18 lessons now provide a visible plain-language first reading, an everyday example, defined terms, three worked steps, an explained figure, a three-step lab walkthrough and an unscored warm-up. The homepage introduces GIS, features, layers, attributes and coordinates.
- **12 calculation/content tests and 167 browser checks passed.** Browser checks cover default collapsed technical sections, deep links revealing optional content, keyboard-operated warm-up disclosure, existing grading and persistence, all lesson images, downloadable beginner notes and mobile layouts.
- Inspected desktop and mobile screenshots of the new first-reading layout. Confirmed the existing LAN server serves the updated page, new script and beginner guide with HTTP 200.
- `beginner-geospatial-guide.md` is generated from `beginner.js` with `node scripts/build-beginner-guide.cjs`, keeping the website and standalone explanations aligned. Technical questions retain their original grading keys and persisted progress IDs.

### Visual enrichment verification · 2 November 2026

- Rebuilt all 12 original study SVGs with `node scripts/build-study-figures.cjs` and visually inspected a full-size browser-rendered contact sheet for labels, geometry and clipping.
- All **12 calculation/content tests** and **146 browser checks** passed after integration. This run used installed Chromium on Linux via `EDGE_PATH`; the isolated local test browser needed `--no-sandbox` because this environment disables unprivileged browser sandboxing.
- SVG checks cover accessible titles/descriptions, finite coordinates and local source links. Existing browser checks decoded every lesson image and verified responsive layouts at 390 px and selected 320 px pages.
- The Markdown note now embeds 12 original SVGs and four existing source figures with reading guides and attribution; diagram scale assumptions and synthetic values are explicit.

### Test commands

```bash
npm run build
node --test tests/*.test.cjs
npm run test:programming
node tests/browser-smoke.cjs
```

The browser test uses Edge’s DevTools protocol, not Playwright. Set `EDGE_PATH` to another compatible installed browser executable if necessary. It runs its own local server and isolated temporary browser profile, then closes them. Screenshots and a results manifest are saved in the approved OpenCode temporary directory; the path is printed on completion.

The connected-story run on this Linux environment used `TEMP=/tmp/opencode EDGE_PATH=/tmp/opencode/gis-chromium node tests/browser-smoke.cjs`. The local wrapper enables Chromium’s `--no-sandbox` mode for this environment’s sandbox restriction.

## Not verified

- The full technical note’s external QGIS, third-party Python-package, GDAL and PostGIS projects were not executed. The 36 standard-library Python/Go chapter solutions were executed separately as described above.
- No Safari/Firefox, real touchscreen, screen-reader, full WCAG conformance or exhaustive colour-contrast audit was performed.
- External source links may change after verification; cached teaching images remain available offline. Source metadata and licences are recorded as checked on 2 November 2026.
- Self-assessed field-task completion does not verify a learner’s code, survey accuracy or professional competency.

**Verdict:** ready for local learning use within the verified scope. Real planning, cadastral or hazard decisions require authoritative datasets, validated tools and appropriate domain review.
