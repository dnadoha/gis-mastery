# Phase 6 workshop

Open [the illustrated learning path](../../index.html#phase6). Exercises 1–3 share the note's 4×4, 30 m scene; the separate worked Sentinel-2 example has 10 m pixels. Keep these fixtures distinct.

- Exercise 1: physical reflectance, NDVI, cloud masks and class areas.
- Exercise 2: change thresholds, confusion matrices and omission/commission trade-offs.
- Exercise 3: masked spatial weights, permutation inference, semivariograms and spatial CV.
- Exercise 4: real STAC imagery, independently assessed change area, hotspots and a spatially validated model.

The original tasks and full solutions are downloadable Markdown files with their code blocks intact. Begin with NumPy for the small fixtures; the ML part also uses SciPy and scikit-learn. Native PDAL and a LAZ tile are required for the optional CHM workflow; the browser does not execute those tools.

Read the app's separate clarifications before using source sketches: metadata-dependent offsets, matching raster origins/CRS/NoData masks, directed versus symmetric kNN weights, train/test distance across block boundaries, and the applied-solution variable-name typo. Reference output numbers depend on software versions and are not evidence of execution in this app.

Keep the final accuracy reference sample separate from training and threshold tuning. Save actual inputs, parameters, outputs and checks in the evidence box, then self-assess completion. Export the notebook to retain a copy.

The [complete note](../../phase-6-note.md) contains the shared setup and all four tracks. `npm run build:phase56` rebuilds source extracts without modifying the note.
