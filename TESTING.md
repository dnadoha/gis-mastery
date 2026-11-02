# Verification notes

## Scope and risks

Quick, local verification of a dependency-free teaching website. Success means every topic is navigable, visuals and source images load, exercises give appropriate feedback, and saved learning work survives reload. The highest risks are misleading GIS calculations, silent loss of notes, awarding progress after revealing a solution, and broken topic/mobile navigation.

No existing application or test suite was present before implementation. The supplied Markdown is the source for numerical expectations; Bangladesh adaptations are labelled teaching examples, not official local geospatial data.

## Verified

- **12 calculation/content tests pass:** 18 unique topics; 144 graded checks; 54 field tasks; valid question definitions and numeric tolerances; WGS 84 degree lengths; UTM station checkpoints; polygon area and inclusion; cell centres; bilinear interpolation; classification/GVF; synthetic population and union/overlap checkpoints.
- Content checks require a Bangladesh analogy, limitations, a regional challenge and relevant schematic for every topic, without a photo-filler gallery. All instructional PNGs have valid signatures. Figure rendering requires source links, reading guides and concept questions; geometry requires the expected 13 figures and correct distinctions between open/closed LineStrings and coordinate/topological dimensions.
- **146 real-browser checks pass** in isolated headless Microsoft Edge: all topics render with the expected exercises/visuals; inline instructional figures decode and have reading guides; geometry has its 12 subtopic links and 13 relevant diagrams; visual controls update; topic/section navigation; wrong/revealed/retried answers; numeric grading; notes/task/progress persistence; literal markup escaping; notebook export content; cancel-reset safety; keyboard grid interaction; filtered practice; download responses; coverage totals; collapsed/open mobile menu and Escape; responsive reflow; direct file opening; storage-denied fallback; no observed JavaScript exceptions.
- All topics were checked for horizontal overflow at 390 px; selected longer topics were also checked at 320 px. Desktop checks use a 1440 px viewport. Browser tests block web fonts, exercising the system-font fallback.
- QGIS and Shapely documentation figure URLs and licence statements were checked. The user-provided topology diagram is included with an explicit unknown-general-reuse-licence warning, not an invented open licence. Credits are in `assets/figures/CREDITS.md` and beside each displayed figure. Superseded context photographs were removed.

## Commands

```bash
node --test tests/course.test.cjs
node tests/browser-smoke.cjs
```

The browser test uses Edge’s DevTools protocol, not Playwright. Set `EDGE_PATH` to another compatible installed browser executable if necessary. It runs its own local server and isolated temporary browser profile, then closes them. Screenshots and a results manifest are saved in the approved OpenCode temporary directory; the path is printed on completion.

## Not verified

- External QGIS, Python-package, GDAL or PostGIS exercises were not executed. They are learner tasks, not browser functionality.
- No Safari/Firefox, real touchscreen, screen-reader, full WCAG conformance or exhaustive colour-contrast audit was performed.
- External source links may change after verification; cached teaching images remain available offline. Source metadata and licences are recorded as checked on 2 November 2026.
- Self-assessed field-task completion does not verify a learner’s code, survey accuracy or professional competency.

**Verdict:** ready for local learning use within the verified scope. Real planning, cadastral or hazard decisions require authoritative datasets, validated tools and appropriate domain review.
