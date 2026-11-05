### Exercise 4 — Applied challenge: a secure, editable inventory

**Task.** Combine everything into a small production-style system for the Exercise 3 POI data:
1. **Public view:** vector tiles that never expose non-public rows (dynamic or pre-generated, behind a caching reverse proxy).
2. **Editor API:** JWT authentication; `owner_org` from the token; PostgreSQL RLS; optimistic concurrency with `ETag`/`If-Match`; audit trail. Shape the routes like OGC API – Features Part 4: `POST /collections/poi/items`, `PUT|PATCH|DELETE /collections/poi/items/{id}` with GeoJSON bodies.
3. **Editor UI:** add, move and delete points, and edit attributes, using either OpenLayers (`Draw`/`Modify`/`Snap`) or MapLibre with a drawing plugin of your choice (for example Terra Draw or Mapbox GL Draw).
4. **Freshness:** after each successful edit, make affected tiles fresh using your `tiles_to_purge` (purge, versioned URL or short TTL — justify the choice).
5. **Tests and threat model:** automated tests for the security rules and a one-page threat model.

**Prerequisites.** Exercises 1–3; Sections 4.9, 5.6 and 6.4.

**Sample input.** Two organisations (`parks`, `harbor`), two users each (JWTs with `sub`, `org`, `exp`), 1 000 000 POIs split roughly evenly between organisations with 10 % flagged non-public.

**Expected deliverable.** A repository with `docker-compose.yml`, SQL migrations, the API, the web client, a test suite (`pytest`), and `README.md` containing the threat model and a results table.

**Success criteria.**
- Anonymous requests to every public endpoint (tiles, features) never return a non-public POI (test on at least three tiles that contain one).
- A `parks` token can never read, update or delete a `harbor` row through any route; the response is `404`, identical to a missing id.
- Two concurrent `PATCH` requests with the same `ETag`: exactly one succeeds, the other gets `412`/`409`.
- With the caching proxy enabled, requesting an editor-only tile or feature response as user A and then as user B never returns A's data.
- After an edit, the edited feature appears in a fresh tile within the freshness target you defined.
- At least 8 automated tests pass in CI; the threat model lists at least five threats with mitigations.

**Hint.** Reuse the `session()` pattern from Section 5.6 (transaction-local `set_config`), keep tile endpoints public-only, and serve everything user-specific from `Cache-Control: private` API routes.

---

