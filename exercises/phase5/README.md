# Phase 5 workshop

Open [the illustrated learning path](../../index.html#phase5), then work through the four exercises in order: tile math → polygon publication → million-point delivery → secure editable inventory.

- Each `exercise-N.md` preserves the original task, inputs and acceptance criteria.
- Each `solutions/exercise-N.md` preserves the complete solution, including code blocks and explanations. These are reference implementations or sketches, not executed-server evidence.
- Run the tile helpers with Python; use a scratch Docker/PostGIS stack for services and edits. The source identifies extra dependencies per exercise. Keep API secrets local and use dedicated database roles.
- Follow the full source reader's separate clarifications: buffer-aware candidate queries, `tile_math` import naming, camera versus tile zoom, transaction-local identity, required JWT claims and CORS `If-Match`/`ETag` handling.
- Record decoded tile contents, query plans, actual timing, status codes and security checks in the app's evidence box. Completion is self-reported and editing evidence clears it.

Download the [complete source note](../../phase-5-note.md) for the worked stack and setup snippets. Rebuild these source extracts with `npm run build:phase56`; the original notes are never rewritten by that command.
