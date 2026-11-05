# Phase 5 — Web GIS and Mapping: From PostGIS to an Editable Web Map

> **Study note** · Level: developer who already knows CRS basics, data formats, GDAL/GeoPandas and PostGIS (Phases 1–4) · Estimated effort: 4–8 weeks

---

## 1. Title and learning objectives

### 1.1 Scope

This note covers the complete **web GIS stack**: how spatial data stored in PostGIS is turned into tiles and features, published through standard APIs, rendered in a browser, edited by users, and protected by authentication and authorization.

### 1.2 Prerequisites

| Area | You should already be able to… |
|---|---|
| CRS | Explain EPSG:4326 vs EPSG:3857, axis order, and reproject with `ST_Transform` |
| Formats | Distinguish GeoJSON, GeoPackage, MVT, PMTiles, XYZ vs TMS |
| Standards | Describe WMS, WMTS, WFS and OGC API Features/Tiles at a high level |
| Databases | Create geometry columns, GiST indexes, and write `ST_Intersects` / `&&` queries |
| Web | Read JavaScript (ES modules), JSON, HTTP headers; run Docker Compose |

### 1.3 Learning objectives

After working through this note you will be able to:

1. **Choose** a map library (OpenLayers, Leaflet, MapLibre GL JS, CesiumJS, deck.gl) for a given requirement and justify the choice.
2. **Compute** Web Mercator tile coordinates, tile bounds and ground resolution by hand and in code.
3. **Generate** Mapbox Vector Tiles (MVT) from PostGIS (`ST_TileEnvelope`, `ST_AsMVTGeom`, `ST_AsMVT`) and pre-generate them with Tippecanoe.
4. **Deploy** a tile server (pg_tileserv or Martin) and a feature server (pg_featureserv), and explain where GeoServer, MapServer, QGIS Server and GeoWebCache fit.
5. **Style** vector tiles with MapLibre expressions, and add clustering, heatmaps and drawing/editing tools.
6. **Optimise** delivery with simplification, level-of-detail (LOD) rules, tile-size budgets and caching.
7. **Expose** data through an OGC API – Features–style interface and build an **editing workflow** with validation and optimistic concurrency.
8. **Secure** spatial data with layer-level and row-level security (PostgreSQL RLS), and avoid tile-cache leaks.
9. **Deliver** the capstone: PostGIS → tile/feature server → web client → editing workflow.

### 1.4 Suggested 8-week plan (compress to 4 weeks by skipping the optional items)

| Week | Focus | Output |
|---|---|---|
| 1 | Tile math, Web Mercator, XYZ/TMS, OGC service families | `tile_math.py`, Exercise 1 |
| 2 | Map libraries: MapLibre GL JS first, then OpenLayers and Leaflet side by side | Same dataset in 2 libraries |
| 3 | MVT from PostGIS; pg_tileserv / Martin | Working vector-tile layer |
| 4 | Styling, clustering, heatmaps; feature server + OGC API Features | Exercise 2 |
| 5 | Performance: simplification, LOD, Tippecanoe, caching, GeoWebCache | Exercise 3 |
| 6 | Drawing/editing tools; WFS-T vs custom REST; optimistic concurrency | Editing prototype |
| 7 | AuthN/AuthZ, RLS, cache-safe security | Exercise 4 (part) |
| 8 | Integration, tests, documentation (optional: Cesium 3D, deck.gl) | Capstone |

---

## 2. Conceptual foundations

### 2.1 What "Web GIS" means

A **web GIS** is a GIS whose data, processing and presentation are delivered over HTTP. It is normally split into tiers:

- **Data tier** — a spatial database (PostGIS) or files (GeoPackage, GeoTIFF).
- **Service tier** — servers that translate database content into web-friendly responses: *tiles*, *features*, or *rendered map images*.
- **Client tier** — a browser application that renders responses with a map library and lets users interact and edit.
- **Cross-cutting concerns** — authentication (who are you?), authorization (what may you see/change?), caching, observability.

### 2.2 Three ways to ship geometry to a browser

| Approach | What travels over the wire | Rendering happens… | Typical protocols | Strengths | Weaknesses |
|---|---|---|---|---|---|
| **Rendered raster maps** | PNG/JPEG images of the map | On the server | WMS, WMTS, XYZ raster tiles | Server controls cartography; trivial client; huge datasets fine | Fixed styling; heavy server CPU; blurry on HiDPI/rotation |
| **Vector tiles** | Compressed binary geometry + attributes per tile | In the client (WebGL/Canvas) | MVT over XYZ, OGC API – Tiles, WMTS | Client-side styling, smooth zoom/rotate, small payloads | Needs tile generation; geometry is simplified/clipped per zoom |
| **Features (vector data)** | GeoJSON/GML/FlatGeobuf for features | In the client | WFS, OGC API – Features | Full geometry and attributes; query/edit friendly | Does not scale to millions of features without paging/filtering |

Rule of thumb: **tiles for display, features for query and edit.** Most production apps combine both: vector tiles draw the map; clicking an object calls a feature API to retrieve or modify the authoritative record.

### 2.3 Key terminology

- **Slippy map / XYZ scheme** — a pyramid of square tiles addressed by zoom `z`, column `x` and row `y`; origin at the **top-left** (north-west), `y` increasing southwards.
- **TMS (Tile Map Service) scheme** — same pyramid but `y` increases **northwards** (origin bottom-left). Mixing the two flips maps vertically: `y_tms = 2^z − 1 − y_xyz`.
- **Web Mercator (EPSG:3857)** — a spherical Mercator projection used by nearly all web basemaps. Units are metres; valid latitude is about ±85.0511287798066°.
- **MVT (Mapbox Vector Tile)** — a Protocol Buffers–encoded tile containing named layers of features with integer tile-local coordinates (default extent 4096).
- **Level of detail (LOD)** — showing less detail (fewer features, simpler geometry) at low zoom.
- **Clustering** — replacing nearby points by one aggregate marker with a count.
- **WFS-T** — WFS with *Transaction* operations (Insert/Update/Delete).
- **Row-level security (RLS)** — PostgreSQL policies that restrict which rows a role can read or write.
- **Conformance class** — a testable group of requirements a server declares it supports (used by OGC API standards via `/conformance`).

### 2.4 The OGC service families at a glance

| Family | Returns | Request style | Status / note |
|---|---|---|---|
| **WMS** | Rendered map image | `GetMap`, `GetFeatureInfo`, `GetCapabilities` (KVP/XML) | Ubiquitous; legacy but still widely required |
| **WMTS** | Pre-rendered tiles | KVP, RESTful URL templates | Tile-cache friendly |
| **WFS** (+T) | Features (GML/GeoJSON), transactions | `GetFeature`, `Transaction` | Rich filtering; XML heavy |
| **OGC API – Features** | Features as JSON/GeoJSON via REST | `/collections/{id}/items` | Part 1 (Core) and Part 2 (CRS by reference) are approved standards; Part 3 (Filtering, CQL2) has been adopted; Part 4 (Create, Replace, Update, Delete) has been developed as a draft/candidate standard — **verify its current status on ogc.org before relying on it** |
| **OGC API – Tiles** | Tiles in any tile matrix set | `/collections/{id}/tiles/{tms}/{z}/{row}/{col}` | Part 1 Core approved |

### 2.5 The map-library landscape

| Library | Rendering | Sweet spot | Notes |
|---|---|---|---|
| **Leaflet** | DOM/Canvas (raster-centric) | Simple maps, quick prototypes, rich plugin ecosystem | Vector tiles and rotation need plugins; no native WebGL |
| **OpenLayers** | Canvas / WebGL | Standards-heavy GIS apps: WMS/WMTS/WFS, many CRSs via proj4, editing interactions (`Draw`, `Modify`, `Snap`) | Steeper learning curve, extremely complete |
| **MapLibre GL JS** | WebGL | Vector tiles, smooth 60 fps maps, data-driven styling via the MapLibre style spec | Open-source continuation of Mapbox GL JS v1; Web Mercator-centred (recent versions add a globe view — check release notes) |
| **CesiumJS** | WebGL | 3D globe, terrain, 3D Tiles, time-dynamic data | WGS84 ellipsoid; heavier |
| **deck.gl** | WebGL (GPU layers) | Large-scale analytical visualisation (millions of points, arcs, hexbins) | Usually an **overlay** on MapLibre/Google Maps; not a full GIS client |

---

## 3. Visual explanations

> These diagrams are **schematics**, not scale-accurate maps.

### 3.1 Conceptual overview of the stack

```mermaid
flowchart LR
    subgraph SRC["Data sources"]
        S1["Field edits and apps"]
        S2["Open data: OSM, GeoPackage, GeoJSON"]
    end
    subgraph DB["Data tier"]
        PG[("PostGIS")]
    end
    subgraph SVC["Service tier"]
        TS["Tile server: pg_tileserv or Martin"]
        FS["Feature server: pg_featureserv"]
        MS["Map servers: GeoServer, MapServer, QGIS Server"]
        PRE["Pre-built tiles: Tippecanoe or tilemaker to MBTiles or PMTiles"]
        EDIT["Edit API: validation and transactions"]
    end
    subgraph EDGE["Edge"]
        GW["Reverse proxy: auth, CORS, cache or CDN"]
    end
    subgraph CLI["Client tier"]
        MAP["Web map: MapLibre, OpenLayers, Leaflet, Cesium, deck.gl"]
    end
    S1 --> EDIT --> PG
    S2 --> PG
    S2 --> PRE
    PG --> TS
    PG --> FS
    PG --> MS
    GW --> TS
    GW --> FS
    GW --> MS
    GW --> EDIT
    PRE --> GW
    MAP <--> GW
```

**How to read it:** reads flow from PostGIS through a server to the browser; writes flow through a dedicated *Edit API* so validation and authorization are enforced in one place. The gateway is where TLS, authentication, CORS and caching are applied.

### 3.2 Tile pyramid (ASCII schematic, XYZ scheme)

```
z=0   1 tile            z=1   4 tiles           z=2   16 tiles
+-------+               +---+---+               +--+--+--+--+
|       |               |0/0|1/0|   x →         |  |  |  |  |
| 0/0/0 |               +---+---+               +--+--+--+--+
|       |               |0/1|1/1|               |  |  |  |  |
+-------+               +---+---+               +--+--+--+--+
                          ↓ y increases south     ...
Tile count at zoom z = 4^z       Each tile splits into 4 children (quadtree)
Label format in this diagram: x/y     Full address: z/x/y
```

### 3.3 Sequence: lifecycle of a vector-tile request

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (MapLibre)
    participant G as Gateway / CDN
    participant T as Tile server
    participant P as PostGIS
    B->>G: GET /tiles/trees/12/2103/1346.pbf
    alt cache hit
        G-->>B: 200 MVT (Cache-Control, ETag)
    else cache miss
        G->>T: forward request (+ auth context)
        T->>P: SELECT trees_mvt(12, 2103, 1346)
        P-->>T: bytea (MVT)
        T-->>G: 200 application/vnd.mapbox-vector-tile
        G-->>B: 200 MVT (cached for next request)
    end
    B->>B: decode protobuf, style, draw
```

### 3.4 Sequence: editing workflow with optimistic concurrency

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Web client
    participant A as Edit API
    participant P as PostGIS (RLS on)
    U->>C: select feature, drag point, edit attributes
    C->>A: GET feature (id, version=3)
    A->>P: SELECT ... WHERE id = ?
    P-->>A: row (version 3)
    A-->>C: GeoJSON Feature with version 3
    U->>C: save
    C->>A: PATCH feature (version=3, new geometry)
    A->>P: UPDATE ... WHERE id=? AND version=3
    alt rows updated = 1
        P-->>A: version now 4
        A-->>C: 200 OK (new version)
        C->>C: refresh tile source
    else rows updated = 0
        A-->>C: 409 Conflict (someone else edited)
        C->>U: show conflict, offer reload
    end
```

### 3.5 Data model for the capstone project

```mermaid
erDiagram
    ORGANIZATION ||--o{ APP_USER : employs
    ORGANIZATION ||--o{ TREE : owns
    APP_USER ||--o{ EDIT_LOG : performs
    TREE ||--o{ EDIT_LOG : "is changed by"
    ORGANIZATION {
        text code PK
        text name
    }
    APP_USER {
        bigint id PK
        text email
        text org_code FK
        text role
    }
    TREE {
        bigint id PK
        text species
        numeric height_m
        text condition
        text owner_org FK
        boolean is_public
        int version
        timestamptz updated_at
        geometry geom "Point, EPSG:4326"
    }
    EDIT_LOG {
        bigint id PK
        bigint tree_id FK
        bigint user_id FK
        text action
        timestamptz at
    }
```

### 3.6 Decision flow: how should this layer be served?

```mermaid
flowchart TD
    Q["New layer to publish"] --> A{"Does the data change often?"}
    A -- "Rarely: daily or less" --> B{"More than about 100k features?"}
    A -- "Often: minutes or seconds" --> C["Dynamic MVT from PostGIS with short cache TTL"]
    B -- "Yes" --> D["Pre-generate with Tippecanoe or tilemaker, serve MBTiles or PMTiles"]
    B -- "No" --> E{"Need per-user filtering?"}
    E -- "No" --> F["GeoJSON or dynamic MVT plus CDN cache"]
    E -- "Yes" --> C
    C --> G{"Per-user data in tiles?"}
    G -- "Yes" --> H["Cache key must include role or skip shared cache"]
    G -- "No" --> I["Shared cache is safe"]
```

**Interpretation:** the two questions that matter most are *how often does the data change* and *does the response depend on who is asking?* The second question is the one most often forgotten — see Section 6.

---

## 4. Technical deep dive

### 4.1 Web Mercator and tile mathematics

Web Mercator (**EPSG:3857**) treats the Earth as a sphere of radius `R = 6 378 137 m`. Its square world extent is

```
circumference C = 2·π·R = 40 075 016.685578 m
X, Y ∈ [−20 037 508.342789 , +20 037 508.342789]   (metres, EPSG:3857)
latitude limit  φ_max = atan(sinh(π)) = 85.0511287798066°
```

A tile is addressed `(z, x, y)` with `n = 2^z` tiles per axis. Converting a WGS 84 coordinate `(λ, φ)` (longitude, latitude in **degrees**, EPSG:4326 / CRS:84 order lon,lat) to the XYZ tile that contains it:

```
n = 2^z
x = floor( (λ + 180) / 360 · n )
y = floor( (1 − asinh(tan φ) / π) / 2 · n )        # asinh(tan φ) = ln(tan φ + sec φ)
```

Inverse (north-west corner of tile `x, y`):

```
λ = x / n · 360 − 180
φ = atan( sinh( π · (1 − 2·y / n) ) )
```

Ground resolution for 256-pixel tiles (metres per pixel; multiply by `cos φ` for true ground distance at latitude φ):

```
res(z) = C / (256 · 2^z)  =  156 543.03392804097 / 2^z       (at the equator)
```

**Reference table** (computed with the script in the solution to Exercise 1; "res @52.37°" = `res(z)·cos(52.37°)`):

| z | Tiles (4^z) | Tile width (m, EPSG:3857) | res equator (m/px) | res @52.37° (m/px) |
|---:|---:|---:|---:|---:|
| 0 | 1 | 40 075 016.69 | 156 543.03 | 95 578.90 |
| 5 | 1 024 | 1 252 344.27 | 4 891.97 | 2 986.84 |
| 10 | 1 048 576 | 39 135.76 | 152.87 | 93.34 |
| 12 | 16 777 216 | 9 783.94 | 38.22 | 23.33 |
| 14 | 268 435 456 | 2 445.98 | 9.55 | 5.83 |
| 18 | 68 719 476 736 | 152.87 | 0.60 | 0.36 |

**Worked micro-example.** The point `(lon 4.9°, lat 52.37°)` at `z = 12` falls in tile **`12/2103/1346`**. That tile spans, in EPSG:4326, `W 4.833984°, S 52.321911°, E 4.921875°, N 52.375599°` and, in EPSG:3857, `minX 538 116.68, minY 6 858 541.67, maxX 547 900.62, maxY 6 868 325.61` (metres).

**Retina / 512-px tiles.** MapLibre GL JS uses 512-px tiles, so its *zoom level* is one lower than the 256-px zoom that has the same ground resolution: `zoom_maplibre = zoom_256 − 1`. If your raster basemap looks half-sized or blurry, check `tileSize`.

**XYZ vs TMS.** `y_tms = 2^z − 1 − y_xyz`. A map that renders but is mirrored north–south almost always has this mismatch.

### 4.2 The Mapbox Vector Tile (MVT) format

An MVT is a Protocol Buffers message (spec version 2.1) with this logical structure:

```
Tile
 └─ Layer[]            name, version=2, extent (default 4096), keys[], values[]
     └─ Feature[]      id (optional, unsigned int), type (POINT | LINESTRING | POLYGON),
                       tags[] (pairs of indexes into keys/values), geometry[] (commands)
```

Key properties:

- **Tile-local integer coordinates.** With `extent = 4096`, the tile is a 4096 × 4096 grid with the origin at the top-left and **y increasing downwards**. At z = 14 one unit ≈ `2 445.98 m / 4096 ≈ 0.597 m`, so coordinates are quantised to about 0.6 m at that zoom. This is why MVT geometry is not suitable as the authoritative store.
- **Geometry commands.** A command integer is `(id & 0x7) | (count << 3)` with `MoveTo = 1`, `LineTo = 2`, `ClosePath = 7`. Parameters are **zig-zag** encoded deltas: `zigzag(n) = (n << 1) ^ (n >> 31)`. A single point at (25, 17) is encoded `[9, 50, 34]` (`9 = 1 | 1<<3`, `50 = zigzag(25)`, `34 = zigzag(17)`).
- **Attributes are flat.** Values may be string, float, double, int, uint, sint or bool — **no nested objects or arrays**.
- **Buffer.** Geometries are usually clipped to the tile plus a small buffer (e.g. 64 units) so that line joins and polygon outlines do not show seams at tile edges.
- **Feature ids** must be unsigned integers if you want to use MapLibre `feature-state` (hover/selection) without `promoteId`.

### 4.3 Generating MVT in PostGIS

Three functions do the work (PostGIS ≥ 3.0 for `ST_TileEnvelope`):

| Function | Purpose |
|---|---|
| `ST_TileEnvelope(z, x, y)` | Returns the tile's bounding rectangle in EPSG:3857 (SRID 3857 polygon) |
| `ST_AsMVTGeom(geom, bounds, extent, buffer, clip_geom)` | Clips and snaps a geometry (already in the same SRS as `bounds`) to tile-local integer coordinates; returns `NULL` if the result is empty |
| `ST_AsMVT(row, layer_name, extent, geom_column, id_column)` | Aggregates rows into one MVT `bytea` |

**Points layer, stored in EPSG:4326**

```sql
CREATE OR REPLACE FUNCTION postgisftw.trees_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  WITH env AS (
    SELECT ST_TileEnvelope(z, x, y) AS g3857
  ),
  mvtgeom AS (
    SELECT t.id,
           t.species,
           t.height_m,
           t.condition,
           ST_AsMVTGeom(ST_Transform(t.geom, 3857), env.g3857, 4096, 64, true) AS geom
    FROM city.trees AS t, env
    WHERE t.geom && ST_Transform(env.g3857, 4326)      -- index-assisted bbox filter
  )
  SELECT COALESCE(ST_AsMVT(mvtgeom.*, 'trees', 4096, 'geom', 'id'), ''::bytea)
  FROM mvtgeom;
$$;
```

- The **layer name** (`'trees'`) becomes `source-layer` in the client style.
- The bbox filter is applied in EPSG:4326 so the GiST index on `geom` is used; transforming the *envelope* once is far cheaper than transforming every row.
- `COALESCE(..., ''::bytea)` returns an empty (but valid, zero-byte) tile when nothing intersects; servers then answer `200`/`204` depending on implementation.
- A rectangle in EPSG:3857 maps exactly to a rectangle in EPSG:4326 (meridians and parallels remain straight lines in both), so the transformed envelope is a safe filter.

**Polygons with simplification and LOD** (assumes a `city.parcels` table with `geom geometry(MultiPolygon,4326)` and `area_m2 double precision`):

```sql
CREATE OR REPLACE FUNCTION postgisftw.parcels_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  WITH env AS (
    SELECT ST_TileEnvelope(z, x, y)              AS g3857,
           156543.03392804097 / (2 ^ z)          AS res          -- metres per pixel, 256-px tiles
  ),
  mvtgeom AS (
    SELECT p.id, p.land_use,
           ST_AsMVTGeom(
             ST_SimplifyPreserveTopology(ST_Transform(p.geom, 3857), env.res),   -- tolerance ≈ 1 px
             env.g3857, 4096, 64, true) AS geom
    FROM city.parcels AS p, env
    WHERE p.geom && ST_Transform(env.g3857, 4326)
      AND (z >= 14 OR p.area_m2 >= env.res * env.res * 16)       -- drop objects below ~16 px²
  )
  SELECT COALESCE(ST_AsMVT(mvtgeom.*, 'parcels', 4096, 'geom', 'id'), ''::bytea) FROM mvtgeom;
$$;
```

Design rationale: below one pixel of separation, vertices are invisible, so simplifying with a tolerance of about one pixel (`res`) removes bytes without a visible change. Note that `area_m2` here is a *projected* area for illustration; for global data use `ST_Area(geom::geography)`.

> **Performance tip.** If tiles are the main workload, add a stored `geom_3857` column with its own GiST index and filter `geom_3857 && env.g3857`; this avoids `ST_Transform` entirely on the filter path. The trade-off is a second geometry copy to keep in sync (a generated column or trigger).

### 4.4 Servers: what each one is for

| Server | Language | Serves | Notes |
|---|---|---|---|
| **GeoServer** | Java | WMS, WMTS, WFS(-T), WCS, OGC API (Features, Tiles, others via modules), vector tiles (extension), embedded **GeoWebCache** | Full-featured, admin GUI + REST config; heavy but very capable; data security rules per workspace/layer |
| **MapServer** | C | WMS, WFS, WCS, OGC API – Features, WMTS-like tiling | Config via *mapfile*; fast, minimal footprint |
| **QGIS Server** | C++/Python | WMS, WFS, WMTS, WCS, OGC API – Features | Renders a **QGIS project** (`.qgs/.qgz`): your desktop styling becomes the web style |
| **pg_tileserv** | Go | MVT for PostGIS **tables and SQL functions** | Function layers have signature `(z int, x int, y int [, params...]) → bytea`; URL `/{schema}.{function}/{z}/{x}/{y}.pbf` (default port 7800) |
| **pg_featureserv** | Go | OGC API – Features for PostGIS tables/views/functions | **Read-oriented**: upstream pg_featureserv has no merged write support (write support exists only as an open pull request) and its maintainers recommend a read-only DB user when it is not used for updates |
| **Martin** | Rust | MVT from PostGIS tables/functions, plus MBTiles and PMTiles files, sprites, fonts | Auto-discovers sources; `/catalog` lists them; function sources take `(z, x, y, query_params json)` |
| **GeoWebCache** | Java | Tile cache/proxy in front of WMS (WMTS, TMS, XYZ endpoints) | Standalone or embedded in GeoServer; metatiling, seeding, truncation, disk quotas |

> **pg_tileserv naming rule.** By default pg_tileserv publishes *function* layers only from the `postgisftw` schema (this is configurable), and *table* layers as `{schema}.{table}`. That is why the tile functions in this note live in `postgisftw`. Table layers return every attribute and apply no LOD logic, so prefer function layers for anything beyond a prototype.

Typical split in this stack: **Martin or pg_tileserv** (tiles) + **pg_featureserv** (reads) + **a small edit service** (writes), with **GeoServer or QGIS Server** added when you need WMS/WFS interoperability with desktop GIS or legacy clients.

### 4.5 Pre-generated tiles: Tippecanoe, tilemaker, MBTiles, PMTiles

Dynamic tiles are flexible; pre-generated tiles are fast and cheap to host.

- **Tippecanoe** builds tilesets from (line-delimited) GeoJSON, FlatGeobuf or CSV, choosing what to drop or merge so that tiles stay within size limits (default budget: 500 000 bytes per tile).
- **tilemaker** converts **OpenStreetMap PBF** extracts into vector tiles using a JSON layer config and a Lua processing profile.
- **MBTiles** is an SQLite container for tiles; **PMTiles** is a single-file archive designed for static hosting with HTTP **range requests** (no tile server required). Recent Tippecanoe releases can write PMTiles directly; otherwise convert with the `pmtiles` CLI.

```bash
# 1. Export from PostGIS to newline-delimited GeoJSON (EPSG:4326 required by Tippecanoe)
ogr2ogr -f GeoJSONSeq trees.geojsonl \
  PG:"host=localhost dbname=gis user=postgres password=postgres" city.trees

# 2. Build tiles: guess a sensible max zoom, thin out dense areas instead of exceeding tile size
tippecanoe -o trees.mbtiles -l trees -zg --drop-densest-as-needed --force trees.geojsonl

# 3. Serve (Martin serves the file name as the source id)
martin trees.mbtiles          # tiles at http://localhost:3000/trees/{z}/{x}/{y}
```

Useful Tippecanoe options: `-Z/-z` (min/max zoom), `-zg` (guess max zoom), `--drop-densest-as-needed`, `--coalesce-densest-as-needed`, `--extend-zooms-if-still-dropping`, `-l` (layer name), `--force` (overwrite output). Check `tippecanoe --help` for your version.

**GeoWebCache (GWC)** caches rendered tiles of WMS layers. Concepts you must know: *gridset* (tile matrix set; defaults include EPSG:900913/3857 and EPSG:4326), *metatiling* (render e.g. a 4×4 block at once so labels are not clipped at tile borders, then slice), *seeding* (pre-populate the cache), *truncation* (invalidate after data change), and *disk quota*. The WMTS endpoint of the embedded GWC is typically `/geoserver/gwc/service/wmts`. Beware the **TMS y-axis flip** (Section 4.1) when consuming GWC's TMS endpoint.

### 4.6 OGC API – Features in practice

OGC API – Features is a resource-oriented REST API. Mandatory-style resources (Part 1, Core):

| Path | Meaning |
|---|---|
| `/` | Landing page with links |
| `/conformance` | Conformance classes the server implements |
| `/collections` | List of feature collections |
| `/collections/{collectionId}` | Collection metadata (extent, CRSs, links) |
| `/collections/{collectionId}/items` | The features (GeoJSON `FeatureCollection`) |
| `/collections/{collectionId}/items/{featureId}` | A single feature |

Core query parameters: `limit` (page size), `bbox` (`minLon,minLat,maxLon,maxLat` in **CRS84** = lon,lat order, unless `bbox-crs` is supplied via Part 2), `datetime`. Servers page results with `links` containing `rel="next"`. Part 3 adds a `filter` parameter with **CQL2** (`filter-lang=cql2-text`), e.g. `filter=condition='poor' AND height_m > 10`, where supported.

Illustrative response (abbreviated; exact members vary by server):

```http
GET /collections/city.trees/items?limit=2&bbox=4.85,52.34,4.95,52.40 HTTP/1.1
Accept: application/geo+json
```

```json
{
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "id": "1",
      "geometry": { "type": "Point", "coordinates": [4.8952, 52.3702] },
      "properties": { "species": "Oak", "height_m": 14.2, "condition": "good" } },
    { "type": "Feature", "id": "2",
      "geometry": { "type": "Point", "coordinates": [4.9041, 52.3676] },
      "properties": { "species": "Linden", "height_m": 11.0, "condition": "fair" } }
  ],
  "numberReturned": 2,
  "links": [ { "rel": "self", "type": "application/geo+json", "href": "…/items?limit=2&bbox=…" },
             { "rel": "next", "type": "application/geo+json", "href": "…/items?limit=2&offset=2&bbox=…" } ]
}
```

**Write operations.** OGC API – Features – **Part 4** defines `POST /collections/{id}/items` (create), `PUT …/items/{fid}` (replace), `PATCH …/items/{fid}` (update) and `DELETE …/items/{fid}`, and includes optimistic-locking semantics. At the time of writing it is a draft/candidate specification, and servers differ in what they implement (GeoServer's documentation describes this as a direction rather than an implemented feature). In this note we therefore build the write path as a **small custom REST service whose shape follows Part 4**, which keeps the client portable if you later swap in a standard implementation. If you need standards-based editing *today*, **WFS-T** (supported by GeoServer and others) is the mature option.

**WFS-T sketch** (XML body POSTed to the WFS endpoint; schematic, namespaces abbreviated):

```xml
<wfs:Transaction service="WFS" version="2.0.0"
    xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2"
    xmlns:city="http://example.com/city">
  <wfs:Insert>
    <city:trees>
      <city:species>Oak</city:species>
      <city:geom><gml:Point srsName="urn:ogc:def:crs:EPSG::4326">
        <!-- EPSG:4326 in URN form is lat lon order! -->
        <gml:pos>52.3702 4.8952</gml:pos></gml:Point></city:geom>
    </city:trees>
  </wfs:Insert>
</wfs:Transaction>
```

Note the axis-order trap: with the URN form `urn:ogc:def:crs:EPSG::4326` the coordinate order is **latitude, longitude**.

### 4.7 Frontend techniques

#### 4.7.1 MapLibre GL JS: vector-tile source and data-driven styling

```html
<link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
<div id="map" style="height:100vh"></div>
<script>
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',   // demo basemap; use your own in production
    center: [4.9, 52.37],                                   // [lon, lat]
    zoom: 12
  });

  map.on('load', () => {
    map.addSource('trees', {
      type: 'vector',
      tiles: ['http://localhost:7800/postgisftw.trees_mvt/{z}/{x}/{y}.pbf'],
      minzoom: 8, maxzoom: 16            // beyond maxzoom the client over-zooms the z16 tiles
    });
    map.addLayer({
      id: 'trees-circles', type: 'circle', source: 'trees', 'source-layer': 'trees',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 8],
        'circle-color': ['match', ['get', 'condition'],
                         'good', '#2e7d32', 'fair', '#f9a825', 'poor', '#c62828', '#757575'],
        'circle-stroke-width': 1, 'circle-stroke-color': '#ffffff'
      }
    });
  });
</script>
```

Expressions (`['get', …]`, `['match', …]`, `['interpolate', …]`, `['step', …]`, `['case', …]`) are evaluated on the GPU/client per feature, so changing style never requires regenerating tiles. Pin the library version in production rather than using a floating major tag.

#### 4.7.2 Clustering (client-side, GeoJSON source)

```js
map.addSource('trees-geojson', {
  type: 'geojson',
  data: 'http://localhost:9000/collections/city.trees/items?limit=1000',  // server caps `limit`
  cluster: true, clusterRadius: 50, clusterMaxZoom: 14
});
map.addLayer({ id: 'clusters', type: 'circle', source: 'trees-geojson',
  filter: ['has', 'point_count'],
  paint: { 'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
           'circle-radius': ['step', ['get', 'point_count'], 15, 100, 20, 750, 25] } });
map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'trees-geojson',
  filter: ['has', 'point_count'],
  layout: { 'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold'],   // must exist in the style's `glyphs` source
            'text-size': 12 } });
map.addLayer({ id: 'unclustered', type: 'circle', source: 'trees-geojson',
  filter: ['!', ['has', 'point_count']],
  paint: { 'circle-color': '#2e7d32', 'circle-radius': 5 } });

map.on('click', 'clusters', async (e) => {
  const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
  const zoom = await map.getSource('trees-geojson').getClusterExpansionZoom(f.properties.cluster_id);
  map.easeTo({ center: f.geometry.coordinates, zoom });
});
```

Client-side clustering loads **all points** into the browser, so it suits up to roughly tens of thousands of points. For larger data, cluster **server-side** (e.g. grid aggregation with `ST_SnapToGrid` or `ST_ClusterDBSCAN` in the tile function, or Tippecanoe's `--cluster-distance`) and ship the aggregates as tiles.

#### 4.7.3 Heatmap

```js
map.addLayer({
  id: 'trees-heat', type: 'heatmap', source: 'trees', 'source-layer': 'trees', maxzoom: 15,
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'height_m'], 1], 0, 0, 30, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
    'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'],
    'heatmap-opacity': 0.8
  }
});
```

A heatmap is a *kernel density* rendering of point weights; it is a visual summary, not a statistical estimate. Use it on an **un-clustered** source, and fade it out (`maxzoom`) in favour of individual points when zoomed in.

#### 4.7.4 OpenLayers: drawing, modifying, snapping

```js
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Draw, Modify, Snap } from 'ol/interaction.js';
import { fromLonLat } from 'ol/proj.js';

const source = new VectorSource();
const map = new Map({
  target: 'map',
  layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
  view: new View({ center: fromLonLat([4.9, 52.37]), zoom: 12 })   // view CRS is EPSG:3857
});
map.addInteraction(new Modify({ source }));
map.addInteraction(new Draw({ source, type: 'Point' }));
map.addInteraction(new Snap({ source }));      // Snap must be added LAST
```

OpenLayers features live in the **view projection** (EPSG:3857 by default). Convert to EPSG:4326 before sending to an API: `new GeoJSON().writeFeatureObject(feature, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })`. For WFS-T, `ol/format/WFS#writeTransaction(inserts, updates, deletes, { featureNS, featurePrefix, featureType, srsName })` builds the XML shown earlier.

#### 4.7.5 Leaflet, CesiumJS and deck.gl in one glance

```js
// Leaflet: minimal GeoJSON overlay (EPSG:3857 raster basemap, data in lon/lat; Leaflet takes [lat, lon] for LatLng)
const lmap = L.map('map').setView([52.37, 4.9], 12);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(lmap);
fetch('/collections/city.trees/items?limit=500').then(r => r.json()).then(gj => L.geoJSON(gj).addTo(lmap));
```

> Public OpenStreetMap tile servers have a usage policy and are not meant for production traffic; use a commercial/self-hosted basemap for real deployments and always show attribution.

```js
// deck.gl as an overlay on MapLibre: GPU-rendered points
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
map.addControl(new MapboxOverlay({
  interleaved: true,
  layers: [new ScatterplotLayer({ id: 'pts', data: points,           // [{coordinates:[lon,lat]}, …]
    getPosition: d => d.coordinates, getRadius: 4, radiusUnits: 'pixels', getFillColor: [200, 30, 30] })]
}));
```

CesiumJS is chosen when you need a **3D globe**, terrain or **3D Tiles** (buildings, point clouds); its coordinates are Cartesian positions on the WGS 84 ellipsoid (`Cesium.Cartesian3.fromDegrees(lon, lat, height)`).

### 4.8 Performance engineering

| Lever | Technique | Why it works |
|---|---|---|
| **Tile budget** | Keep tiles well below ~500 KB (many teams target 100–200 KB) and a few thousand features | Download + decode + GPU upload dominate perceived latency |
| **Simplification** | Tolerance ≈ one pixel: `ε(z) = res(z)`; use topology-preserving simplification for polygons that share borders | Sub-pixel vertices are invisible |
| **LOD rules** | Per-zoom attribute filters (e.g. only major roads at z < 8), area/length thresholds, `minzoom`/`maxzoom` on layers | Fewer, more meaningful features at small scale |
| **Aggregation** | Cluster/grid/hexbin at low zoom; show individuals at high zoom | Avoids drawing 10⁶ overlapping points |
| **Indexing** | GiST on geometry (store a 3857 copy if tile-heavy), `&&` before exact predicates, `EXPLAIN (ANALYZE, BUFFERS)` | Avoids sequential scans per tile |
| **Pre-generation** | Tippecanoe/tilemaker for static or slow-changing data; PMTiles on object storage + CDN | Zero database load at read time |
| **HTTP caching** | `Cache-Control: public, max-age=…`, `ETag`, gzip/brotli; CDN in front | Most tile requests never reach your origin |
| **Invalidation** | After an edit, purge only tiles intersecting the changed bbox for each affected zoom (use the tile math from 4.1) | Cheap, targeted cache freshness |
| **Client** | Source `minzoom/maxzoom`, `maxTileCacheSize`, avoid hundreds of layers, prefer expressions over many filtered layers | Less style evaluation per frame |

**Level-of-detail rule of thumb.** A feature is worth drawing if its on-screen size is at least a few pixels. For polygons: `area_m2 ≥ k · res(z)²` with `k ≈ 16`; for lines: `length_m ≥ ~8 · res(z)`.

### 4.9 Authentication and authorization for spatial data

Separate three questions: **Who are you?** (authentication: OIDC/OAuth 2.0 → JWT or session cookie) · **Which layers may you open?** (layer-level authorization) · **Which rows within a layer may you see or change?** (row-level authorization).

| Level | Where to enforce | Mechanisms |
|---|---|---|
| Layer | Gateway and/or server | Path-based rules in a reverse proxy (`/tiles/internal/*` needs role `staff`); GeoServer data security rules (workspace/layer vs role); separate server instances or DB roles per tier; `GRANT SELECT` on the table/function |
| Row | **Database** (authoritative) | PostgreSQL **RLS** policies; GeoServer CQL read filters per role (via its security extensions) for WMS/WFS |
| Column | Database/API | Column-level `GRANT`, views that omit sensitive columns |
| Write | Edit API + DB | Role-checked endpoints, `WITH CHECK` policies, validation constraints |

**RLS essentials**

```sql
ALTER TABLE city.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE city.trees FORCE  ROW LEVEL SECURITY;     -- also applies to the table owner

-- anonymous map readers: public rows only
CREATE POLICY read_public ON city.trees FOR SELECT TO tile_reader
  USING (is_public);

-- editors: only their organisation's rows (org passed per transaction by the edit API)
CREATE POLICY org_rw ON city.trees FOR ALL TO edit_api
  USING      (owner_org = current_setting('app.org', true))
  WITH CHECK (owner_org = current_setting('app.org', true));
```

Policies for the same command are **OR-ed** (permissive by default); `USING` filters existing rows, `WITH CHECK` validates new/changed rows. Superusers and roles with `BYPASSRLS` ignore policies — never connect a web service with such a role.

**Client side.** Attach credentials to tile and feature requests without placing tokens in URLs (URLs end up in logs):

```js
const map = new maplibregl.Map({
  /* … */
  transformRequest: (url, resourceType) =>
    url.startsWith('https://api.example.org/')
      ? { url, headers: { Authorization: `Bearer ${getAccessToken()}` } }
      : { url }
});
```

**The cache-leak trap.** Tiles are cached by URL. If a tile's content depends on the user, a shared cache or CDN may serve user A's tile to user B. Either (a) serve user-specific tiles with `Cache-Control: private` (or `no-store`) and `Vary: Authorization`, (b) include the access tier in the cache key (`/tiles/{tier}/{z}/{x}/{y}`), or (c) keep tiles public-only and fetch protected attributes through the authenticated feature API.

**Single-role servers.** Out of the box, pg_tileserv, pg_featureserv and Martin typically connect with *one* database role, so per-user RLS requires either one server instance and DB role per access tier behind the gateway, or a custom endpoint that sets a per-request session variable (as the edit API in Section 5 does).

---

## 5. Worked GIS example — an editable street-tree inventory

### 5.1 Scenario

Two organisations, **`parks`** and **`harbor`**, maintain street trees in the same database. The public may see all trees flagged `is_public`. Staff of each organisation may additionally see, create, edit and delete **their own** trees (including non-public ones) through an authenticated API. The stack:

```
PostGIS 16 ──► pg_tileserv  (public vector tiles, role tile_reader)
          ├──► pg_featureserv (public OGC API – Features, role tile_reader)
          └──► Edit API (FastAPI, role edit_api, JWT → org, RLS enforced)
                                  ▲
                    MapLibre web client (tiles + editor layer)
```

The sample coordinates are **illustrative** (WGS 84 lon/lat, EPSG:4326) and were chosen so that tile results can be verified by the tile math in Section 4.1.

| id | species | org | public | lon | lat | tile @ z12 |
|---:|---|---|:---:|---:|---:|---|
| 1 | Oak | parks | yes | 4.8952 | 52.3702 | 12/2103/1346 |
| 2 | Linden | parks | yes | 4.9041 | 52.3676 | 12/2103/1346 |
| 3 | Maple | parks | **no** | 4.8841 | 52.3731 | 12/2103/1346 |
| 4 | Plane | harbor | yes | 4.9122 | 52.3601 | 12/2103/1346 |
| 5 | Birch | harbor | yes | 4.9320 | 52.3790 | 12/2104/1345 |

### 5.2 Step 1 — Run the database and servers

`docker-compose.yml` (pin exact image tags in real projects instead of `latest`):

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: gis }
    ports: ["5432:5432"]
    volumes: ["./initdb:/docker-entrypoint-initdb.d:ro"]   # *.sql run once, alphabetically
  tiles:
    image: pramsey/pg_tileserv:latest
    environment: { DATABASE_URL: "postgresql://tile_reader:reader_pw@db/gis" }
    ports: ["7800:7800"]
    depends_on: [db]
  features:
    image: pramsey/pg_featureserv:latest
    environment: { DATABASE_URL: "postgresql://tile_reader:reader_pw@db/gis" }
    ports: ["9000:9000"]
    depends_on: [db]
```

### 5.3 Step 2 — Schema, roles, security, data (`initdb/01_schema.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA city;
CREATE SCHEMA postgisftw;

CREATE TABLE city.trees (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  species    text        NOT NULL,
  height_m   numeric(5,2) CHECK (height_m >= 0),
  condition  text        NOT NULL CHECK (condition IN ('good','fair','poor')),
  owner_org  text        NOT NULL,
  is_public  boolean     NOT NULL DEFAULT true,
  version    integer     NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  geom       geometry(Point, 4326) NOT NULL
);
CREATE INDEX trees_geom_gix ON city.trees USING gist (geom);

CREATE TABLE city.edit_log (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tree_id  bigint,
  user_sub text,
  action   text NOT NULL,
  at       timestamptz NOT NULL DEFAULT now()
);

-- Roles: one for anonymous map readers, one for the edit API (neither is a superuser)
CREATE ROLE tile_reader LOGIN PASSWORD 'reader_pw';
CREATE ROLE edit_api    LOGIN PASSWORD 'edit_pw';
GRANT USAGE ON SCHEMA city, postgisftw TO tile_reader, edit_api;
GRANT SELECT ON city.trees TO tile_reader;
GRANT SELECT, INSERT, UPDATE, DELETE ON city.trees TO edit_api;
GRANT INSERT ON city.edit_log TO edit_api;
GRANT SELECT ON spatial_ref_sys TO tile_reader, edit_api;   -- ST_Transform reads it (usually already open to PUBLIC; shown for clarity)

-- Row-level security
ALTER TABLE city.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE city.trees FORCE  ROW LEVEL SECURITY;
CREATE POLICY read_public ON city.trees FOR SELECT TO tile_reader USING (is_public);
CREATE POLICY org_rw      ON city.trees FOR ALL    TO edit_api
  USING      (owner_org = current_setting('app.org', true))
  WITH CHECK (owner_org = current_setting('app.org', true));

-- Audit trigger (user identity arrives through a transaction-local setting)
CREATE FUNCTION city.log_tree_edit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO city.edit_log(tree_id, user_sub, action) VALUES (OLD.id, current_setting('app.user', true), TG_OP);
    RETURN OLD;
  ELSE
    INSERT INTO city.edit_log(tree_id, user_sub, action) VALUES (NEW.id, current_setting('app.user', true), TG_OP);
    RETURN NEW;
  END IF;
END $$;
CREATE TRIGGER trees_log AFTER INSERT OR UPDATE OR DELETE ON city.trees
  FOR EACH ROW EXECUTE FUNCTION city.log_tree_edit();

-- Seed data (loaded as the superuser during init, which bypasses RLS)
INSERT INTO city.trees (species, height_m, condition, owner_org, is_public, geom) VALUES
 ('Oak',    14.2, 'good', 'parks',  true,  ST_SetSRID(ST_MakePoint(4.8952, 52.3702), 4326)),
 ('Linden', 11.0, 'fair', 'parks',  true,  ST_SetSRID(ST_MakePoint(4.9041, 52.3676), 4326)),
 ('Maple',   9.5, 'poor', 'parks',  false, ST_SetSRID(ST_MakePoint(4.8841, 52.3731), 4326)),
 ('Plane',  18.7, 'good', 'harbor', true,  ST_SetSRID(ST_MakePoint(4.9122, 52.3601), 4326)),
 ('Birch',   8.1, 'fair', 'harbor', true,  ST_SetSRID(ST_MakePoint(4.9320, 52.3790), 4326));
```

> The ER diagram in Section 3.5 shows the *logical* model. In this lab the identity provider owns organisations and users, so `owner_org` and `user_sub` are plain text columns rather than foreign keys.

### 5.4 Step 3 — Tile function (`initdb/02_tiles.sql`)

Use the `postgisftw.trees_mvt(z, x, y)` function from Section 4.3, then:

```sql
GRANT EXECUTE ON FUNCTION postgisftw.trees_mvt(integer, integer, integer) TO tile_reader;
```

The function runs with the caller's rights (`SECURITY INVOKER`, the default), so **RLS applies to tile_reader inside the tile query**: non-public trees never enter a public tile.

### 5.5 Step 4 — Verify the read path

```bash
docker compose up -d

# (a) tile server answers with a vector tile
curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" \
  http://localhost:7800/postgisftw.trees_mvt/12/2103/1346.pbf
# expected: 200, an MVT content type (typically application/vnd.mapbox-vector-tile), size > 0

# (b) OGC API Features through pg_featureserv
curl -s "http://localhost:9000/collections/city.trees/items?limit=10" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(len(d['features']), sorted(f['properties']['species'] for f in d['features']))"
# expected: 4 ['Birch', 'Linden', 'Oak', 'Plane']     (Maple is hidden by RLS)
```

Decode the tile and count features (`pip install requests mapbox-vector-tile`):

```python
import requests, mapbox_vector_tile

def trees_in(z, x, y):
    r = requests.get(f"http://localhost:7800/postgisftw.trees_mvt/{z}/{x}/{y}.pbf", timeout=10)
    r.raise_for_status()
    tile = mapbox_vector_tile.decode(r.content)           # {'trees': {'extent': 4096, 'features': [...]}}
    return sorted(f["properties"]["species"] for f in tile.get("trees", {}).get("features", []))

print(trees_in(12, 2103, 1346))   # expected ['Linden', 'Oak', 'Plane']   (Maple hidden by RLS)
print(trees_in(12, 2104, 1345))   # expected ['Birch']
```

**Why these results?** The tile math places trees 1–4 in `12/2103/1346` and tree 5 in `12/2104/1345`. RLS removes the non-public Maple for `tile_reader`, so the first tile holds three features.

### 5.6 Step 5 — The edit API (`edit_api/main.py`)

```python
import os
from contextlib import contextmanager
from typing import Literal, Optional

import jwt                                  # PyJWT
import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row
from pydantic import BaseModel, Field

DSN = os.environ["EDIT_DSN"]               # connects as role edit_api (no BYPASSRLS)
JWT_SECRET = os.environ["JWT_SECRET"]      # dev only: in production use asymmetric keys (OIDC/JWKS)

app = FastAPI(title="Tree edit API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:8080"],
                   allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])

class Claims(BaseModel):
    sub: str
    org: str

def claims(authorization: str = Header(...)) -> Claims:
    scheme, _, token = authorization.partition(" ")
    try:
        if scheme.lower() != "bearer":
            raise ValueError("scheme")
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])      # checks signature and exp
        return Claims(sub=data["sub"], org=data["org"])
    except Exception:
        raise HTTPException(status_code=401, detail="invalid or missing token")

@contextmanager
def session(c: Claims):
    """One transaction per request; identity is visible to RLS policies and the audit trigger."""
    with psycopg.connect(DSN, row_factory=dict_row) as conn:
        conn.execute("SELECT set_config('app.org',  %s, true), set_config('app.user', %s, true)", (c.org, c.sub))
        yield conn                          # commit on success, rollback on exception

class TreeIn(BaseModel):
    species: str = Field(min_length=1, max_length=80)
    height_m: Optional[float] = Field(None, ge=0, le=150)
    condition: Literal["good", "fair", "poor"]
    lon: float = Field(ge=-180, le=180)     # note the order: longitude first
    lat: float = Field(ge=-90, le=90)
    is_public: bool = True

class TreePatch(BaseModel):
    version: int                            # version the client last saw (optimistic lock)
    species: Optional[str] = Field(None, min_length=1, max_length=80)
    height_m: Optional[float] = Field(None, ge=0, le=150)
    condition: Optional[Literal["good", "fair", "poor"]] = None
    lon: Optional[float] = Field(None, ge=-180, le=180)
    lat: Optional[float] = Field(None, ge=-90, le=90)

@app.get("/trees")
def list_trees(c: Claims = Depends(claims)):
    with session(c) as conn:
        rows = conn.execute("""SELECT id, version, species, height_m, condition, is_public,
                                      ST_AsGeoJSON(geom)::json AS geometry
                               FROM city.trees ORDER BY id""").fetchall()
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "id": r["id"], "geometry": r["geometry"],
         "properties": {k: (float(v) if k == "height_m" and v is not None else v)
                        for k, v in r.items() if k not in ("id", "geometry")}} for r in rows]}

@app.post("/trees", status_code=201)
def create_tree(t: TreeIn, c: Claims = Depends(claims)):
    with session(c) as conn:                # owner_org comes from the token, never from the request body
        return conn.execute("""INSERT INTO city.trees (species, height_m, condition, owner_org, is_public, geom)
                               VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                               RETURNING id, version""",
                            (t.species, t.height_m, t.condition, c.org, t.is_public, t.lon, t.lat)).fetchone()

@app.patch("/trees/{tree_id}")
def update_tree(tree_id: int, p: TreePatch, c: Claims = Depends(claims)):
    params = {**p.model_dump(), "id": tree_id}
    with session(c) as conn:
        row = conn.execute("""UPDATE city.trees SET
                 species   = COALESCE(%(species)s,   species),
                 height_m  = COALESCE(%(height_m)s,  height_m),
                 condition = COALESCE(%(condition)s, condition),
                 geom      = CASE WHEN %(lon)s::float8 IS NULL OR %(lat)s::float8 IS NULL THEN geom
                                  ELSE ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s), 4326) END,
                 version   = version + 1, updated_at = now()
               WHERE id = %(id)s AND version = %(version)s
               RETURNING id, version""", params).fetchone()
        if row:
            return row
        exists = conn.execute("SELECT 1 FROM city.trees WHERE id = %s", (tree_id,)).fetchone()
    # Rows hidden by RLS look identical to missing rows: do not leak their existence.
    raise HTTPException(409 if exists else 404, "version conflict" if exists else "not found")

@app.delete("/trees/{tree_id}", status_code=204)
def delete_tree(tree_id: int, c: Claims = Depends(claims)):
    with session(c) as conn:
        if conn.execute("DELETE FROM city.trees WHERE id = %s RETURNING id", (tree_id,)).fetchone() is None:
            raise HTTPException(404, "not found")
```

Run it and mint development tokens:

```bash
pip install fastapi uvicorn "psycopg[binary]" pyjwt
EDIT_DSN="postgresql://edit_api:edit_pw@localhost:5432/gis" JWT_SECRET="dev-only-change-me" \
  uvicorn main:app --port 8000

python3 -c "import jwt,time; print(jwt.encode({'sub':'ana','org':'parks','exp':int(time.time())+3600}, 'dev-only-change-me', algorithm='HS256'))"
```

Verify the write path and security (replace `$T_PARKS` / `$T_HARBOR` by tokens for `org=parks` / `org=harbor`):

```bash
curl -s -H "Authorization: Bearer $T_PARKS"  localhost:8000/trees | python3 -c "import sys,json; print([f['properties']['species'] for f in json.load(sys.stdin)['features']])"
# expected: ['Oak', 'Linden', 'Maple']      (includes the non-public Maple)
curl -s -H "Authorization: Bearer $T_HARBOR" localhost:8000/trees | python3 -c "import sys,json; print([f['properties']['species'] for f in json.load(sys.stdin)['features']])"
# expected: ['Plane', 'Birch']

# harbor tries to change a parks tree (id 1): RLS hides it → 404, nothing changes
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH -H "Authorization: Bearer $T_HARBOR" \
  -H "Content-Type: application/json" -d '{"version":1,"condition":"poor"}' localhost:8000/trees/1      # expected 404

# parks edits tree 1 twice with the same version: first succeeds, second conflicts
curl -s -X PATCH -H "Authorization: Bearer $T_PARKS" -H "Content-Type: application/json" \
  -d '{"version":1,"condition":"fair"}' localhost:8000/trees/1      # expected {"id":1,"version":2}
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH -H "Authorization: Bearer $T_PARKS" \
  -H "Content-Type: application/json" -d '{"version":1,"condition":"poor"}' localhost:8000/trees/1      # expected 409
```

### 5.7 Step 6 — Web client (`index.html`, serve with `python3 -m http.server 8080`)

```html
<!doctype html><meta charset="utf-8" /><title>Tree inventory</title>
<link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
<style>html,body,#map{height:100%;margin:0} #bar{position:absolute;z-index:2;margin:8px;padding:6px;background:#fff}</style>
<div id="bar"><label><input id="edit" type="checkbox" /> add trees on click</label></div>
<div id="map"></div>
<script>
const TILES = 'http://localhost:7800/postgisftw.trees_mvt/{z}/{x}/{y}.pbf';
const API   = 'http://localhost:8000';
const TOKEN = prompt('Paste a development JWT');                    // lab only
const auth  = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const map = new maplibregl.Map({ container: 'map', style: 'https://demotiles.maplibre.org/style.json',
                                 center: [4.9, 52.37], zoom: 13 });

async function loadMine() {                                         // authenticated, org-scoped features
  const r = await fetch(`${API}/trees`, { headers: auth });
  return r.ok ? r.json() : { type: 'FeatureCollection', features: [] };
}
function refreshPublicTiles() {                                     // cache-bust the public vector tiles
  map.getSource('trees').setTiles([`${TILES}?v=${Date.now()}`]);
}

map.on('load', async () => {
  map.addSource('trees', { type: 'vector', tiles: [TILES], minzoom: 8, maxzoom: 16 });
  map.addLayer({ id: 'public', type: 'circle', source: 'trees', 'source-layer': 'trees',
    paint: { 'circle-radius': 5, 'circle-color': ['match', ['get', 'condition'],
             'good', '#2e7d32', 'fair', '#f9a825', 'poor', '#c62828', '#757575'] } });

  map.addSource('mine', { type: 'geojson', data: await loadMine() });
  map.addLayer({ id: 'mine', type: 'circle', source: 'mine',        // editor layer: ring around my trees
    paint: { 'circle-radius': 9, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 2, 'circle-stroke-color': '#1565c0' } });

  map.on('click', async (e) => {
    const hit = map.queryRenderedFeatures(e.point, { layers: ['mine'] })[0];
    if (hit) {                                                      // EDIT an existing tree
      const condition = prompt('New condition (good/fair/poor)?', hit.properties.condition);
      if (!condition) return;
      const r = await fetch(`${API}/trees/${hit.id}`, { method: 'PATCH', headers: auth,
        body: JSON.stringify({ version: hit.properties.version, condition }) });
      if (r.status === 409) alert('Someone else changed this tree. Reloading.');
    } else if (document.getElementById('edit').checked) {           // CREATE a new tree
      const species = prompt('Species?'); if (!species) return;
      await fetch(`${API}/trees`, { method: 'POST', headers: auth,
        body: JSON.stringify({ species, condition: 'good', lon: e.lngLat.lng, lat: e.lngLat.lat }) });
    } else return;
    map.getSource('mine').setData(await loadMine());
    refreshPublicTiles();
  });
});
</script>
```

**What this demonstrates:** public, cacheable, anonymous-safe data is drawn from **vector tiles**; the authenticated, editable, possibly non-public data comes from the **API as GeoJSON** and is drawn as a separate layer. After each edit the client refreshes its own layer and cache-busts the tile source (`setTiles` is available on vector sources in current MapLibre releases; if your version lacks it, remove and re-add the source).

### 5.8 Verification checklist for the worked example

| Check | Expected |
|---|---|
| Tile `12/2103/1346` for `tile_reader` | 3 features: Linden, Oak, Plane |
| Tile `12/2104/1345` | 1 feature: Birch |
| pg_featureserv `items` | 4 features (no Maple) |
| `GET /trees` as parks / harbor | 3 / 2 features |
| harbor `PATCH` on a parks tree | 404, row unchanged |
| Two `PATCH`es with the same `version` | first 200 (`version` → 2), second 409 |
| `SELECT action FROM city.edit_log` after the edits | contains an `UPDATE` row with `user_sub = 'ana'` |

---

## 6. Common pitfalls and best practices

### 6.1 Coordinate systems and geometry

| # | Pitfall | Symptom | Prevention |
|---|---|---|---|
| 1 | **Axis-order confusion.** GeoJSON and CRS:84 are `lon,lat`; WMS 1.3.0 with `EPSG:4326` and GML URNs are `lat,lon`; Leaflet's `LatLng` is `[lat, lon]` | Data appears in the ocean or mirrored across the diagonal | Use `CRS:84` for WMS 1.3.0 `bbox`; always name the order in variable names (`lon`, `lat`); test with a known point |
| 2 | **Measuring in EPSG:3857.** Scale grows as `1/cos φ` | At 52.37° N lengths are inflated ≈ 1.64×, areas ≈ 2.7× | Compute lengths/areas with `geography` or a local projected CRS; use 3857 only for display |
| 3 | **Latitudes beyond ±85.0511°** | Tile math returns `NaN`/out-of-range rows | Clamp latitude (as in the Exercise 1 solution) |
| 4 | **Antimeridian** (±180°) | Polygons stretch across the whole map | Split geometries at ±180° or shift longitudes; prefer data prepared for web use |
| 5 | **XYZ vs TMS and 256 vs 512 px** | Mirrored map, or everything one zoom off | `y_tms = 2^z − 1 − y`; set `tileSize` explicitly; remember MapLibre zoom = 256-px zoom − 1 |
| 6 | **Invalid geometries** | `ST_AsMVTGeom`/`ST_Simplify` errors or missing polygons | Constrain with `CHECK (ST_IsValid(geom))` or repair once with `ST_MakeValid` on load |

### 6.2 Tiles and rendering

| # | Pitfall | Symptom | Prevention |
|---|---|---|---|
| 7 | Wrong `source-layer` name | Blank map, no errors | The name equals the layer name in `ST_AsMVT(..., 'name')`; inspect a decoded tile |
| 8 | Oversized tiles | Slow panning, dropped features | Budget bytes and feature counts per tile; simplify; aggregate; use Tippecanoe `--drop-densest-as-needed` |
| 9 | MVT quantisation treated as data | Coordinates off by up to ~0.6 m at z14 | Tiles are for **display**; fetch authoritative geometry from the feature API |
| 10 | Over-zoom mismatch | Blocky geometry or missing data at high zoom | Set source `maxzoom` to the highest generated zoom; client over-zooms beyond |
| 11 | Tile seams / clipped outlines | Hairlines at tile borders | Use a buffer (e.g. 64 units) and `clip_geom = true` |
| 12 | Cluster counts split by tile edges | A grid cell shows two partial counts | Aggregate on a global grid and accept it, or aggregate with a buffer/union client-side; for exact counts use server-side queries |
| 13 | Basemap licensing | Blocked tile requests or legal exposure | Read the provider's policy; public OSM tile servers are not for production traffic; always attribute |

### 6.3 Database and API performance

| # | Pitfall | Symptom | Prevention |
|---|---|---|---|
| 14 | `ST_Transform(col, 3857) && env` in `WHERE` | Seq scan on every tile | Filter in the column's SRID (`col && ST_Transform(env, 4326)`) or index a 3857 copy |
| 15 | Missing GiST index or stale statistics | Slow tiles after bulk load | `CREATE INDEX … USING gist`, then `ANALYZE`; inspect with `EXPLAIN (ANALYZE, BUFFERS)` |
| 16 | One viewport = many parallel tile requests | Connection-pool exhaustion | Size pools for bursts (a viewport commonly needs several to a dozen tiles); cache; put a CDN in front |
| 17 | Unbounded feature requests | Browser freezes, server OOM | Enforce server-side page limits; page with `next` links; use keyset pagination for large offsets |
| 18 | SQL built by string concatenation in tile/feature functions | SQL injection through query parameters | Use typed function parameters and bind variables only |
| 19 | Large GeoJSON loaded wholesale | Multi-second load, high memory | Switch to vector tiles beyond tens of thousands of features |

### 6.4 Security

| # | Pitfall | Symptom | Prevention |
|---|---|---|---|
| 20 | **Cache leaks** | User A receives user B's tile | `Cache-Control: private`, `Vary: Authorization`, or a tier in the cache key; keep shared tiles public-only |
| 21 | RLS silently bypassed | Rows visible to everyone | Never use superuser/`BYPASSRLS` roles; use `FORCE ROW LEVEL SECURITY` for owner-run code; for views use `WITH (security_invoker = true)` (PostgreSQL 15+) so the caller's rights apply |
| 22 | Trusting client-supplied ownership | Users create/modify other orgs' rows | Derive `owner_org` from the verified token; enforce again in `WITH CHECK` |
| 23 | Tokens in URLs | Credentials in logs and referrers | Send an `Authorization` header (`transformRequest`) or use same-site cookies through the gateway |
| 24 | Over-permissive CORS | Any site can call your API with the user's credentials | Allow-list origins; never combine `*` with credentialed requests |
| 25 | Existence leaks | `403` vs `404` reveals hidden rows | Return the same response for "hidden" and "missing" |

### 6.5 Editing

| # | Pitfall | Symptom | Prevention |
|---|---|---|---|
| 26 | Last-write-wins | Silent overwrite of a colleague's edit | Version column (or `ETag`/`If-Match`), `409 Conflict` |
| 27 | Forgetting to convert projection | Features saved at the wrong place | Convert view CRS → storage CRS at the boundary (`dataProjection`/`featureProjection` in OpenLayers) |
| 28 | Saving invalid or silly geometry | Self-intersections, empty geometries, out-of-range coordinates | Validate in the API and in the database (`CHECK`, bounds, types) |
| 29 | Stale tiles after edits | Users do not see their change | Refresh/cache-bust the source, short TTLs, targeted invalidation (Exercise 3) |

### 6.6 Best-practice checklist

1. Tiles for display, features for query and edit; keep one authoritative copy of the data (PostGIS).
2. Store in EPSG:4326 (or a local CRS); display in EPSG:3857; convert at the edges.
3. Set explicit budgets: bytes per tile, features per tile, latency per tile.
4. Put every rule that protects data **in the database** (RLS, constraints) and make the API a second line of defence.
5. Measure before optimising: `EXPLAIN (ANALYZE, BUFFERS)`, browser network tab, and a repeatable benchmark.
6. Pin library and image versions; read release notes before upgrading MapLibre, OpenLayers, or the servers.
7. Treat every cache as a security boundary.

---

## 7. Progressive exercises

The four exercises build on each other: **Exercise 1**'s tile-math module is reused in 2, 3 and 4; **Exercise 2**'s stack is the base of 3; **Exercise 3**'s data, tiles and tooling feed the capstone in 4. Solutions are in Section 8 — try each exercise before looking.

### Exercise 1 — Beginner: build a tile-math toolkit

**Task.** Implement a small, dependency-free Python module with: `lonlat_to_tile(lon, lat, z)`, `tile_bounds_3857(z, x, y)`, `tile_bounds_4326(z, x, y)`, `resolution(z, lat)`, `tms_y(z, y)` and `tiles_for_bbox(west, south, east, north, z)`.

**Prerequisites.** Section 4.1; basic Python.

**Sample input.**

| Call | Inputs |
|---|---|
| `lonlat_to_tile` | `(4.9, 52.37, 12)`, `(4.9, 52.37, 14)`, `(-74.0060, 40.7128, 10)`, `(139.6917, 35.6895, 16)`, `(0, 0, 1)`, `(180, 90, 3)` |
| `tile_bounds_*` | tile `12/2103/1346` |
| `tiles_for_bbox` | bbox `(4.85, 52.34, 4.95, 52.40)` for `z = 10 … 14` |
| `tms_y` | `z = 12`, `y = 1346` |

**Expected deliverable.** `tile_math.py` with `assert`-based self-tests, plus a short table of the results above.

**Success criteria.**
- All six `lonlat_to_tile` cases return in-range indices (including the clamped one).
- The point `(4.9, 52.37)` lies inside the bounds you compute for its own tile at z = 12.
- `resolution(0)` equals 156 543.034 m/px to at least 6 significant digits.
- `tms_y` applied twice returns the original `y`.
- You can predict, before running, that the bbox needs more tiles at each deeper zoom.

**Hint.** `asinh(tan φ)` is numerically friendlier than `ln(tan φ + sec φ)`; clamp the results to `0 … 2^z − 1`.

### Exercise 2 — Intermediate: publish a polygon layer as vector tiles and OGC API Features

**Task.** Using the tile math from Exercise 1 and the stack pattern of Section 5, publish a **polygon** dataset:
1. Load a polygon layer with at least ~1 000 features into PostGIS as `city.areas` (EPSG:4326, GiST index, valid geometries, an `area_m2` column).
2. Write `postgisftw.areas_mvt(z, x, y)` with ~1-pixel simplification and an area-based LOD rule.
3. Serve it with pg_tileserv; publish the table through pg_featureserv.
4. Build a MapLibre page that draws a **choropleth** (data-driven fill by `area_m2`), zoom-dependent outline width, and a click popup that fetches the full feature from the OGC API by id.

**Prerequisites.** Exercise 1; Sections 4.3–4.7 and 5.

**Sample input.** Any polygon dataset such as first-level administrative boundaries (for example the Natural Earth *admin-1* layer) or municipal boundaries from your region. Pick one landmark (lon/lat) inside the dataset.

**Expected deliverable.** `docker-compose.yml`, SQL file(s), `index.html`, and a short `RESULTS.md` containing: tile size (bytes) of one low-zoom and one high-zoom tile, the `EXPLAIN` output of the tile query, and the tile address of your landmark at z = 10 computed with your Exercise 1 module.

**Success criteria.**
- `curl` on a tile URL returns `200` with a non-empty MVT; the decoded tile has the layer name used in your style.
- The tile containing your landmark (computed by Exercise 1) includes the polygon that contains the landmark.
- Low-zoom tiles are smaller than they would be without simplification/LOD (show both numbers).
- `GET /collections/city.areas/items?limit=5` returns five GeoJSON features; the popup shows data fetched from `…/items/{id}`.
- The tile query plan uses the GiST index on tiles that cover a small part of the dataset.

**Hint.** Load with `ogr2ogr -f PostgreSQL … -lco SCHEMA=city -nln areas -lco GEOMETRY_NAME=geom -nlt PROMOTE_TO_MULTI`; run `ANALYZE`; start from the `parcels_mvt` function in Section 4.3.

### Exercise 3 — Advanced: scale to one million points and engineer performance

**Task.** Extend Exercise 2's stack with a **1 000 000-point** layer and make it fast:
1. Generate reproducible random POIs in the bbox `(4.70, 52.28, 5.10, 52.45)`.
2. Write a dynamic tile function `postgisftw.poi_mvt` that returns **grid-aggregated counts below z = 13** and individual points from z = 13.
3. Build a **pre-generated** alternative with Tippecanoe and serve it with Martin.
4. Benchmark both (≥ 300 random tiles, z = 8…14) and report p50/p95 latency and maximum tile size per zoom.
5. Write `tiles_to_purge(bbox, zmin, zmax)` that lists the tiles to invalidate after an edit, accounting for the tile buffer.
6. Add a MapLibre **heatmap** at low zoom and individual points at high zoom, and decide where to hand over.

**Prerequisites.** Exercises 1–2; Sections 4.5, 4.7.3 and 4.8.

**Sample input.** The bbox above; zoom range 8–14; the changed-feature bbox `(4.9, 52.37, 4.9, 52.37)` for the purge function.

**Expected deliverable.** SQL (data generation, indexes, tile function), the Tippecanoe/Martin commands, `bench.py`, `purge.py`, and a results table with a one-paragraph recommendation (dynamic vs pre-generated vs hybrid).

**Success criteria.**
- No tile exceeds 500 000 bytes at any benchmarked zoom (state whether you measured decoded or transferred size).
- The inner tile query uses the GiST index (index or bitmap scan) for high-zoom tiles.
- You can explain, with numbers, why un-aggregated points at z = 11 would be unacceptable (estimate points per tile from density).
- `tiles_to_purge` returns exactly one tile for an interior point at z = 12 and includes a neighbouring tile when the change lies within the buffer distance of a tile edge.
- Your recommendation justifies hybrid vs single approach using measured latency.

**Hint.** `ST_SnapToGrid(geom_3857, res * 32)` makes ~32-pixel cells; `GROUP BY` the snapped point and `count(*)`. For tiles below z = 8 consider a pre-aggregated table or Tippecanoe rather than scanning a million rows per request.

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

## 8. Solutions and explanations

> Attempt each exercise first. Numbers below that come from the tile math were computed by running the code shown; benchmark numbers depend on your hardware and are therefore described qualitatively.

### Solution 1 — tile-math toolkit

`tile_math.py`:

```python
"""Web Mercator tile helpers (Exercise 1). Pure standard library."""
import math

R = 6378137.0                         # spherical radius used by EPSG:3857 (metres)
C = 2 * math.pi * R                   # world width: 40 075 016.685578... m
HALF = C / 2                          # 20 037 508.342789... m
MAX_LAT = math.degrees(math.atan(math.sinh(math.pi)))   # 85.0511287798066

def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int, int]:
    """XYZ tile (x, y) containing (lon, lat) at zoom z. Latitude is clamped to the Mercator limit."""
    lat = max(min(lat, MAX_LAT), -MAX_LAT)
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n
    return min(max(int(math.floor(x)), 0), n - 1), min(max(int(math.floor(y)), 0), n - 1)

def tile_bounds_3857(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """(minX, minY, maxX, maxY) in EPSG:3857 metres."""
    size = C / 2 ** z
    min_x = -HALF + x * size
    max_y = HALF - y * size
    return (min_x, max_y - size, min_x + size, max_y)

def tile_bounds_4326(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """(west, south, east, north) in degrees."""
    n = 2 ** z
    def lat(row: float) -> float:
        return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * row / n))))
    return (x / n * 360 - 180, lat(y + 1), (x + 1) / n * 360 - 180, lat(y))

def resolution(z: int, lat: float = 0.0, tile_size: int = 256) -> float:
    """Ground metres per pixel at zoom z and latitude lat."""
    return C / (tile_size * 2 ** z) * math.cos(math.radians(lat))

def tms_y(z: int, y_xyz: int) -> int:
    """Flip between XYZ and TMS row numbering (the operation is its own inverse)."""
    return 2 ** z - 1 - y_xyz

def tiles_for_bbox(west: float, south: float, east: float, north: float, z: int):
    """Yield every XYZ tile (z, x, y) intersecting the lon/lat bbox."""
    x0, y1 = lonlat_to_tile(west, south, z)      # south-west corner -> largest y
    x1, y0 = lonlat_to_tile(east, north, z)      # north-east corner -> smallest y
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            yield (z, x, y)

if __name__ == "__main__":
    assert lonlat_to_tile(4.9, 52.37, 12) == (2103, 1346)
    assert lonlat_to_tile(4.9, 52.37, 14) == (8415, 5384)
    assert lonlat_to_tile(-74.0060, 40.7128, 10) == (301, 385)
    assert lonlat_to_tile(139.6917, 35.6895, 16) == (58198, 25804)
    assert lonlat_to_tile(0, 0, 1) == (1, 1)
    assert lonlat_to_tile(180, 90, 3) == (7, 0)            # clamped, never out of range
    w, s, e, n = tile_bounds_4326(12, 2103, 1346)
    assert w <= 4.9 < e and s <= 52.37 < n                 # the point lies inside its tile
    assert abs(resolution(0) - 156543.03392804097) < 1e-6
    assert tms_y(12, tms_y(12, 1346)) == 1346
    counts = {z: len(list(tiles_for_bbox(4.85, 52.34, 4.95, 52.40, z))) for z in range(10, 15)}
    assert counts == {10: 2, 11: 4, 12: 4, 13: 9, 14: 30}, counts
    print("all checks passed")
    print("bounds 3857:", [round(v, 2) for v in tile_bounds_3857(12, 2103, 1346)])
    print("bounds 4326:", [round(v, 6) for v in tile_bounds_4326(12, 2103, 1346)])
    print("tms y:", tms_y(12, 1346))
    print("bbox tile counts:", counts)
```

**Expected output**

| Call | Result |
|---|---|
| `lonlat_to_tile(4.9, 52.37, 12)` | `(2103, 1346)` |
| `lonlat_to_tile(4.9, 52.37, 14)` | `(8415, 5384)` |
| `lonlat_to_tile(-74.0060, 40.7128, 10)` | `(301, 385)` |
| `lonlat_to_tile(139.6917, 35.6895, 16)` | `(58198, 25804)` |
| `lonlat_to_tile(0, 0, 1)` | `(1, 1)` |
| `lonlat_to_tile(180, 90, 3)` | `(7, 0)` (clamped) |
| `tile_bounds_3857(12, 2103, 1346)` | `(538116.68, 6858541.67, 547900.62, 6868325.61)` |
| `tile_bounds_4326(12, 2103, 1346)` | `(4.833984, 52.321911, 4.921875, 52.375599)` |
| `tms_y(12, 1346)` | `2749` |
| `tiles_for_bbox(4.85, 52.34, 4.95, 52.40, z)` for z = 10…14 | 2, 4, 4, 9, 30 tiles (at z = 14: x 8412–8417, y 5382–5386) |

**Reasoning.**
- `(0, 0)` at z = 1 lies exactly on the corner shared by all four tiles; the `floor` rule assigns it to the south-east tile `(1, 1)` — a useful reminder that tile boundaries are half-open intervals.
- Counts grow roughly ×4 per zoom for a *large* area, but for a small bbox they depend on how the bbox aligns with tile edges (4 → 4 → 9 → 30 here), which is why the number of tiles needed is not a clean power of four.
- `lonlat_to_tile` clamps both latitude (Mercator limit) and the index (so `lon = 180` does not produce `x = 2^z`).

**Verify against PostGIS.**

```sql
SELECT round(ST_XMin(g)::numeric, 2), round(ST_YMin(g)::numeric, 2),
       round(ST_XMax(g)::numeric, 2), round(ST_YMax(g)::numeric, 2)
FROM (SELECT ST_TileEnvelope(12, 2103, 1346) AS g) s;
-- expected: 538116.68 | 6858541.67 | 547900.62 | 6868325.61
```

### Solution 2 — polygon layer: vector tiles + OGC API

**1. Load and prepare**

```bash
ogr2ogr -f PostgreSQL PG:"host=localhost dbname=gis user=postgres password=postgres" \
  ne_10m_admin_1_states_provinces.shp \
  -lco SCHEMA=city -nln areas -lco GEOMETRY_NAME=geom -lco FID=id \
  -nlt PROMOTE_TO_MULTI -t_srs EPSG:4326 -overwrite
```

```sql
UPDATE city.areas SET geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3)) WHERE NOT ST_IsValid(geom);
ALTER TABLE city.areas ADD COLUMN area_m2 double precision;
UPDATE city.areas SET area_m2 = ST_Area(geom::geography);      -- true area on the ellipsoid
ANALYZE city.areas;
GRANT SELECT ON city.areas TO tile_reader;
```
(`ogr2ogr` creates a GiST index by default; adjust the attribute names — here `name` — to your dataset.)

**2. Tile function** (same pattern as `parcels_mvt` in Section 4.3)

```sql
CREATE OR REPLACE FUNCTION postgisftw.areas_mvt(z integer, x integer, y integer)
RETURNS bytea LANGUAGE sql STABLE PARALLEL SAFE AS $$
  WITH env AS (
    SELECT ST_TileEnvelope(z, x, y) AS g3857, 156543.03392804097 / (2 ^ z) AS res
  ),
  mvtgeom AS (
    SELECT a.id, a.name, a.area_m2,
           ST_AsMVTGeom(ST_SimplifyPreserveTopology(ST_Transform(a.geom, 3857), env.res),
                        env.g3857, 4096, 64, true) AS geom
    FROM city.areas a, env
    WHERE a.geom && ST_Transform(env.g3857, 4326)
      AND (z >= 8 OR a.area_m2 >= env.res * env.res * 16)
  )
  SELECT COALESCE(ST_AsMVT(mvtgeom.*, 'areas', 4096, 'geom', 'id'), ''::bytea) FROM mvtgeom;
$$;
GRANT EXECUTE ON FUNCTION postgisftw.areas_mvt(integer, integer, integer) TO tile_reader;
```

**3. Client** (add to the MapLibre page from Section 5.7)

```js
map.addSource('areas', { type: 'vector', tiles: ['http://localhost:7800/postgisftw.areas_mvt/{z}/{x}/{y}.pbf'], maxzoom: 12 });
map.addLayer({ id: 'areas-fill', type: 'fill', source: 'areas', 'source-layer': 'areas',
  paint: { 'fill-opacity': 0.7,
           'fill-color': ['step', ['get', 'area_m2'], '#edf8fb', 1e9, '#b3cde3', 1e10, '#8c96c6', 1e11, '#88419d'] } });
map.addLayer({ id: 'areas-line', type: 'line', source: 'areas', 'source-layer': 'areas',
  paint: { 'line-color': '#333', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.3, 10, 1.5] } });

map.on('click', 'areas-fill', async (e) => {
  const id = e.features[0].id;                                   // from ST_AsMVT's id column
  const f = await (await fetch(`http://localhost:9000/collections/city.areas/items/${id}`)).json();
  const div = document.createElement('div');
  div.textContent = `${f.properties.name}: ${Math.round(f.properties.area_m2 / 1e6).toLocaleString()} km²`;
  new maplibregl.Popup().setLngLat(e.lngLat).setDOMContent(div).addTo(map);     // textContent, not HTML: no XSS
});
```

**4. Verify**

```bash
# tile for your landmark: compute (z, x, y) with Exercise 1, then
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://localhost:7800/postgisftw.areas_mvt/10/<x>/<y>.pbf
curl -s "http://localhost:9000/collections/city.areas/items?limit=5" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['features']))"   # expected 5
```

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM city.areas a WHERE a.geom && ST_Transform(ST_TileEnvelope(10, <x>, <y>), 4326);
-- expect a Bitmap/Index scan on the GiST index (its name varies) for a small tile;
-- a very large tile covering most of the table may legitimately choose a sequential scan.
```

**Showing the LOD/simplification benefit.** Create a copy of the function without `ST_SimplifyPreserveTopology` and without the area test (`areas_mvt_raw`), request the same low-zoom tile from both, and record `size_download`. The reduction is dataset-dependent; the point is to measure it rather than assume it. Decode the tile with `mapbox_vector_tile` (Section 5.5) to confirm the layer name is `areas` and that the polygon containing your landmark is present in the tile Exercise 1 predicted.

### Solution 3 — one million points

**1. Reproducible data**

```sql
SELECT setseed(0.42);
CREATE TABLE city.poi AS
SELECT g AS id,
       ST_SetSRID(ST_MakePoint(4.70 + random() * 0.40, 52.28 + random() * 0.17), 4326) AS geom,
       (ARRAY['cafe','shop','school','park'])[1 + floor(random() * 4)::int] AS kind
FROM generate_series(1, 1000000) AS g;
ALTER TABLE city.poi ADD PRIMARY KEY (id);
CREATE INDEX poi_geom_gix ON city.poi USING gist (geom);
ANALYZE city.poi;
GRANT SELECT ON city.poi TO tile_reader;
```

**2. Why aggregate? Estimate points per tile.** The bbox is about 27.2 km × 18.8 km ≈ 511 km², so the density is ≈ 1 957 points/km². Ground tile width at this latitude is `tile width × cos φ`:

| z | Ground tile width (km) | Points per tile (≈) |
|---:|---:|---:|
| 10 | 23.9 | 1 117 000 (the whole dataset) |
| 11 | 11.95 | 279 000 |
| 12 | 5.97 | 70 000 |
| 13 | 2.99 | 17 500 |
| 14 | 1.49 | 4 400 |

Even at an optimistic ~10 bytes per point, a z = 11 tile would be ≈ 2.8 MB — far beyond the 500 KB budget (this is an order-of-magnitude estimate; measure real sizes). Hence: aggregate below z = 13, individual points from z = 13.

**3. Hybrid tile function**

```sql
CREATE OR REPLACE FUNCTION postgisftw.poi_mvt(z integer, x integer, y integer)
RETURNS bytea LANGUAGE sql STABLE PARALLEL SAFE AS $$
  WITH env AS (
    SELECT ST_TileEnvelope(z, x, y) AS g3857, 156543.03392804097 / (2 ^ z) AS res
  ),
  agg AS (                                                   -- z < 13: ~32-pixel grid cells with counts
    SELECT ST_SnapToGrid(ST_Transform(p.geom, 3857), env.res * 32) AS cell, count(*) AS n
    FROM city.poi p, env
    WHERE z < 13 AND p.geom && ST_Transform(env.g3857, 4326)
    GROUP BY 1
  ),
  mvtgeom AS (
    SELECT NULL::bigint AS id, agg.n AS point_count,
           ST_AsMVTGeom(agg.cell, env.g3857, 4096, 64, true) AS geom
    FROM agg, env
    UNION ALL
    SELECT p.id, 1 AS point_count,
           ST_AsMVTGeom(ST_Transform(p.geom, 3857), env.g3857, 4096, 64, true)
    FROM city.poi p, env
    WHERE z >= 13 AND p.geom && ST_Transform(env.g3857, 4326)
  )
  SELECT COALESCE(ST_AsMVT(mvtgeom.*, 'poi', 4096, 'geom', 'id'), ''::bytea) FROM mvtgeom;
$$;
GRANT EXECUTE ON FUNCTION postgisftw.poi_mvt(integer, integer, integer) TO tile_reader;
```

The predicates `z < 13` / `z >= 13` depend only on the function parameter, so PostgreSQL can skip the branch that does not apply (look for a *One-Time Filter* in the plan). Cells are snapped to a global grid, so a cell that straddles a tile edge may appear with partial counts in two tiles (pitfall 12).

**4. Pre-generated alternative**

```bash
ogr2ogr -f GeoJSONSeq poi.geojsonl PG:"host=localhost dbname=gis user=postgres password=postgres" city.poi
tippecanoe -o poi.mbtiles -l poi -zg --drop-densest-as-needed --force poi.geojsonl
martin poi.mbtiles                         # http://localhost:3000/poi/{z}/{x}/{y}
```

**5. Benchmark and purge helpers** — `bench.py` (needs Exercise 1's module):

```python
"""Latency / size benchmark for a tile endpoint (Exercise 3). Needs: pip install requests"""
import random
import statistics
import time

import requests
from tile_math_solution import lonlat_to_tile        # your Exercise 1 module

BBOX = (4.70, 52.28, 5.10, 52.45)                     # west, south, east, north (lon/lat)
DYNAMIC = "http://localhost:7800/postgisftw.poi_mvt/{z}/{x}/{y}.pbf"
STATIC = "http://localhost:3000/poi/{z}/{x}/{y}"      # Martin serving poi.mbtiles
random.seed(7)

def sample(n, zooms):
    for _ in range(n):
        z = random.choice(zooms)
        lon, lat = random.uniform(BBOX[0], BBOX[2]), random.uniform(BBOX[1], BBOX[3])
        x, y = lonlat_to_tile(lon, lat, z)
        yield z, x, y

def run(url_tpl, tiles):
    lat_ms, max_bytes = {}, {}
    with requests.Session() as s:
        for z, x, y in tiles:
            t0 = time.perf_counter()
            r = s.get(url_tpl.format(z=z, x=x, y=y), timeout=30)
            dt = (time.perf_counter() - t0) * 1000
            r.raise_for_status()
            lat_ms.setdefault(z, []).append(dt)
            max_bytes[z] = max(max_bytes.get(z, 0), len(r.content))   # decoded size; see Content-Length for wire size
    for z in sorted(lat_ms):
        v = sorted(lat_ms[z])
        p95 = v[min(len(v) - 1, int(0.95 * len(v)))]
        print(f"z{z:>2} n={len(v):>3} p50={statistics.median(v):7.1f} ms p95={p95:7.1f} ms max={max_bytes[z]:>8} B")

if __name__ == "__main__":
    tiles = list(sample(300, [8, 9, 10, 11, 12, 13, 14]))
    print("dynamic:"); run(DYNAMIC, tiles)
    print("static:");  run(STATIC, tiles)
```

`purge.py`:

```python
"""Which tiles must be invalidated after an edit? (Exercise 3 / 4)"""
import math

PAD = 64 / 4096          # the MVT buffer (64 of 4096 units) as a fraction of a tile

def _frac(lon: float, lat: float, z: int) -> tuple[float, float]:
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n
    return x, y

def tiles_to_purge(west, south, east, north, zmin, zmax):
    """Tiles whose content (including the buffer) can change when something inside the bbox changes."""
    for z in range(zmin, zmax + 1):
        n = 2 ** z
        xw, yn = _frac(west, north, z)
        xe, ys = _frac(east, south, z)
        for x in range(max(0, math.floor(xw - PAD)), min(n - 1, math.floor(xe + PAD)) + 1):
            for y in range(max(0, math.floor(yn - PAD)), min(n - 1, math.floor(ys + PAD)) + 1):
                yield (z, x, y)

if __name__ == "__main__":
    one = list(tiles_to_purge(4.9, 52.37, 4.9, 52.37, 12, 12))
    assert one == [(12, 2103, 1346)], one                 # interior point: a single tile
    edge_lon = 4.833984375 + 0.0001                       # just inside the west edge of tile 12/2103/1346
    two = list(tiles_to_purge(edge_lon, 52.37, edge_lon, 52.37, 12, 12))
    assert (12, 2102, 1346) in two and (12, 2103, 1346) in two, two     # buffer reaches the neighbour
    print(len(list(tiles_to_purge(4.9, 52.37, 4.9, 52.37, 8, 16))), "tiles for one point, z8-z16")
    print("ok")
```

The padding `64 / 4096` mirrors the tile buffer: an edit within that distance of a tile edge changes the *neighbouring* tile's buffered content, so the neighbour must be refreshed too. A single interior point at z = 8…16 touches 11 tiles (one per zoom plus two buffer neighbours — the exact number is what `purge.py` prints).

**6. Heatmap → points hand-over**

```js
map.addSource('poi', { type: 'vector', tiles: ['http://localhost:7800/postgisftw.poi_mvt/{z}/{x}/{y}.pbf'], maxzoom: 16 });
map.addLayer({ id: 'poi-heat', type: 'heatmap', source: 'poi', 'source-layer': 'poi', maxzoom: 13,
  paint: { 'heatmap-weight': ['interpolate', ['linear'], ['get', 'point_count'], 1, 0.05, 200, 1],
           'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 8, 12, 24] } });
map.addLayer({ id: 'poi-points', type: 'circle', source: 'poi', 'source-layer': 'poi', minzoom: 13,
  paint: { 'circle-radius': 3, 'circle-color': '#1565c0' } });
```

Below z = 13 the tiles contain aggregated cells (weight = `point_count`); from z = 13 they contain real points. Matching the heatmap's `maxzoom` with the function's switch zoom keeps the data and the symbology consistent.

**Interpretation of results (what you should find).**
- Static (Tippecanoe/Martin) tiles answer in a nearly constant, small time at every zoom, and Tippecanoe enforces the tile-size budget by construction.
- Dynamic tiles are fast at high zoom (small index-assisted scans) but become slow at the lowest benchmarked zooms because a single tile touches a large share of the million rows. Exact numbers depend on your hardware.
- Recommended pattern (justify with *your* measurements): **hybrid** — serve low zooms from pre-aggregated or pre-generated tiles (they change rarely and are expensive to compute) and high zooms dynamically (they are cheap and reflect edits immediately).

### Solution 4 — secure, editable inventory (reference design)

**Architecture and rules**

```mermaid
flowchart LR
    B["Browser"] --> N["nginx gateway"]
    N -- "/tiles/ public, cached 60 s" --> T["pg_tileserv as tile_reader"]
    N -- "/api/ private, never cached" --> A["Edit API as edit_api"]
    T --> P[("PostGIS with RLS")]
    A --> P
    A -. "after commit: compute stale tiles" .-> N
```

| Concern | Decision |
|---|---|
| Public data | Only `tile_reader` serves tiles; RLS policy `USING (is_public)`; tiles are public-only, so a shared cache is safe |
| User-specific data | Only through `/api/`, with `Cache-Control: private, no-store` |
| Identity | JWT verified in the API; `owner_org` and `sub` from claims, passed with transaction-local `set_config` |
| Concurrency | `ETag` = row version; `If-Match` required on `PUT`/`PATCH`/`DELETE`; `412` on mismatch, `428` if missing |
| Freshness | Short TTL (60 s) on public tiles + versioned tile URL (`?v=`) in the editing client; `tiles_to_purge` drives purging if you add a CDN/Varnish with a purge API (open-source nginx has no selective purge without extra modules) |

**API routes shaped like OGC API – Features Part 4**

| Method and path | Meaning | Success | Failure |
|---|---|---|---|
| `POST /collections/poi/items` | Create from a GeoJSON Feature | `201`, `Location`, `ETag` | `400` invalid geometry, `401` |
| `PUT /collections/poi/items/{id}` | Replace | `200`/`204`, new `ETag` | `404`, `412` |
| `PATCH /collections/poi/items/{id}` | Partial update | `200`, new `ETag` | `404`, `412`, `428` |
| `DELETE /collections/poi/items/{id}` | Delete | `204` | `404`, `412` |

Key handler (extends the `session()` helper of Section 5.6; the table gets a `version` column and `CHECK (geometrytype(geom) = 'POINT' AND ST_IsValid(geom))`):

```python
import json
from fastapi import HTTPException, Request, Response

@app.patch("/collections/poi/items/{item_id}")
def patch_item(item_id: int, feature: dict, request: Request, response: Response,
               c: Claims = Depends(claims)):
    raw = request.headers.get("if-match")
    if raw is None:
        raise HTTPException(428, "If-Match header required")
    try:
        version = int(raw.strip('"'))
    except ValueError:
        raise HTTPException(400, "malformed ETag")
    props, geom = feature.get("properties", {}), feature.get("geometry")
    with session(c) as conn:
        row = conn.execute("""UPDATE city.poi SET
                 kind    = COALESCE(%(kind)s, kind),
                 geom    = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(%(geom)s::text), 4326), geom),
                 version = version + 1
               WHERE id = %(id)s AND version = %(version)s
               RETURNING id, version""",
            {"kind": props.get("kind"), "geom": json.dumps(geom) if geom else None,
             "id": item_id, "version": version}).fetchone()
        exists = None if row else conn.execute("SELECT 1 FROM city.poi WHERE id = %s", (item_id,)).fetchone()
    if row is None:
        raise HTTPException(412 if exists else 404, "precondition failed" if exists else "not found")
    response.headers["ETag"] = f'"{row["version"]}"'
    response.headers["Cache-Control"] = "private, no-store"
    return row
```

Add `expose_headers=["ETag"]` to the `CORSMiddleware` call — browsers hide non-safelisted response headers from cross-origin scripts, so the client could not read the new `ETag` otherwise.

**Gateway (nginx excerpt)**

```nginx
proxy_cache_path /var/cache/nginx/tiles levels=1:2 keys_zone=tiles:50m max_size=2g inactive=1h use_temp_path=off;

server {
  listen 8080;
  location /tiles/ {                          # PUBLIC tiles only: a shared cache is safe here
    proxy_pass http://tiles:7800/;
    proxy_cache tiles;
    proxy_cache_valid 200 60s;
    add_header X-Cache $upstream_cache_status always;
  }
  location /api/ {                            # user-specific: never cached
    proxy_pass http://edit:8000/;
    proxy_no_cache 1;
    proxy_cache_bypass 1;
    add_header Cache-Control "private, no-store" always;
  }
}
```

**Editor UI with OpenLayers** (send EPSG:4326 to the API, keep the ETag per feature):

```js
import GeoJSON from 'ol/format/GeoJSON.js';
const fmt = new GeoJSON();
const toApi = (f) => fmt.writeFeatureObject(f, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });

modify.on('modifyend', async (e) => {
  for (const f of e.features.getArray()) {
    const r = await fetch(`${API}/collections/poi/items/${f.getId()}`, {
      method: 'PATCH',
      headers: { ...auth, 'If-Match': f.get('etag') },
      body: JSON.stringify({ geometry: toApi(f).geometry })
    });
    if (r.status === 412) { alert('Changed by someone else; reloading.'); await reloadFeatures(); }
    else if (r.ok) f.set('etag', r.headers.get('ETag'));
  }
});
```

**Tests** (`pytest`, run against the compose stack):

```python
import time, threading, jwt, requests

API, SECRET = "http://localhost:8080/api", "dev-only-change-me"

def hdr(org, sub="tester"):
    tok = jwt.encode({"sub": sub, "org": org, "exp": int(time.time()) + 600}, SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}

def feat(kind="cafe", lon=4.9, lat=52.37):
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": {"kind": kind}}

def create(org):
    r = requests.post(f"{API}/collections/poi/items", headers=hdr(org), json=feat())
    assert r.status_code == 201, r.text
    return r.json()["id"], r.headers["ETag"]

def test_missing_token_is_401():
    assert requests.get(f"{API}/collections/poi/items").status_code == 401

def test_cross_org_patch_is_404():
    pid, etag = create("parks")
    r = requests.patch(f"{API}/collections/poi/items/{pid}", headers={**hdr("harbor"), "If-Match": etag},
                       json={"properties": {"kind": "x"}})
    assert r.status_code == 404                                  # same as a missing id

def test_stale_etag_is_412():
    pid, etag = create("parks")
    url = f"{API}/collections/poi/items/{pid}"
    assert requests.patch(url, headers={**hdr("parks"), "If-Match": etag}, json={"properties": {"kind": "a"}}).status_code == 200
    assert requests.patch(url, headers={**hdr("parks"), "If-Match": etag}, json={"properties": {"kind": "b"}}).status_code == 412

def test_forged_owner_in_body_is_ignored():
    f = feat(); f["properties"]["owner_org"] = "harbor"
    r = requests.post(f"{API}/collections/poi/items", headers=hdr("parks"), json=f)
    pid = r.json()["id"]
    assert requests.get(f"{API}/collections/poi/items/{pid}", headers=hdr("harbor")).status_code == 404

def test_concurrent_patch_exactly_one_wins():
    pid, etag = create("parks")
    url, codes = f"{API}/collections/poi/items/{pid}", []
    def go(k): codes.append(requests.patch(url, headers={**hdr("parks"), "If-Match": etag}, json={"properties": {"kind": k}}).status_code)
    ts = [threading.Thread(target=go, args=(k,)) for k in ("a", "b")]
    [t.start() for t in ts]; [t.join() for t in ts]
    assert sorted(codes) == [200, 412]
```

Write at least three more: *delete across organisations is `404`*; *expired token is `401`*; *a public tile that contains a known non-public POI decodes without it* (decode with `mapbox_vector_tile`, three tiles). A cache test: request the same `/api/…` URL as `parks` then `harbor` through the gateway and assert the second response contains no `parks` data and carries `Cache-Control: private, no-store`.

**Threat model (excerpt)**

| Threat | Impact | Mitigation | Test |
|---|---|---|---|
| Forged or expired JWT | Unauthorised edits | Signature + `exp` verification; short lifetimes; asymmetric keys in production | `test_missing_token_is_401`, expired-token test |
| Client sets `owner_org` | Cross-tenant writes | Owner from token; RLS `WITH CHECK` | `test_forged_owner…` |
| Cross-tenant read/update via guessed ids | Data disclosure | RLS; `404` for hidden rows | `test_cross_org_patch_is_404` |
| Shared cache serves private data | Disclosure | Public-only tiles in shared cache; private API uncached | cache test |
| Lost updates | Data corruption | `If-Match`/version | concurrency test |
| Superuser or `BYPASSRLS` role used by a service | Total RLS bypass | Dedicated least-privilege roles; `FORCE ROW LEVEL SECURITY` | role audit query on `pg_roles` |
| SQL injection | Full compromise | Bound parameters only; typed function arguments | code review + fuzz test |

**How to verify the whole system.** Run the stack, execute the test suite, run `bench.py` against `/tiles/` (cached) and directly against the tile server (uncached) to quantify the cache benefit, perform an edit in the UI, and watch the edited point appear within the freshness target (60 s TTL, or immediately with the versioned URL in the editing session).

---

## 9. Summary, glossary, and further reading

### 9.1 Key takeaways

1. **Tiles for display, features for query and edit.** Vector tiles are small, fast and client-styled but quantised and simplified; the authoritative geometry stays in PostGIS and is reached through a feature API.
2. **Web Mercator tile math is simple and worth knowing cold:** `n = 2^z`, `x = ⌊(λ+180)/360·n⌋`, `y = ⌊(1 − asinh(tan φ)/π)/2·n⌋`, resolution `156 543.034 / 2^z` m/px at the equator, scaled by `cos φ` elsewhere.
3. **PostGIS generates MVT directly** (`ST_TileEnvelope` → `ST_AsMVTGeom` → `ST_AsMVT`); filter in the column's SRID so the GiST index is used.
4. **Performance is a budget problem:** bytes and features per tile, simplification at ≈ 1 pixel, LOD rules, aggregation, pre-generation (Tippecanoe/tilemaker, MBTiles/PMTiles) and HTTP/CDN caching.
5. **Pick servers by role:** pg_tileserv/Martin for tiles, pg_featureserv for read-only OGC API – Features, GeoServer/MapServer/QGIS Server for classic OGC services and desktop-styled maps, GeoWebCache for raster tile caching.
6. **Write paths need their own service** (or WFS-T): validation, authorization, optimistic concurrency and audit belong there. OGC API – Features Part 4 describes the REST shape, but check its status and your server's support first.
7. **Security is layered:** gateway for authentication and layer rules, PostgreSQL RLS for rows, constraints for validity — and every cache is a security boundary.
8. **Choose the library by need:** MapLibre for vector tiles and WebGL smoothness, OpenLayers for standards and editing, Leaflet for simplicity, Cesium for 3D, deck.gl for massive data overlays.

### 9.2 Glossary

| Term | Meaning |
|---|---|
| **Buffer (tile)** | Extra margin of geometry kept beyond the tile edge to avoid seams |
| **Cluster** | Aggregate marker representing several nearby points |
| **CQL2** | Common Query Language 2, the filter language used by OGC API Part 3 |
| **CRS84** | WGS 84 with lon,lat axis order (the default CRS of OGC API – Features) |
| **Extent (MVT)** | Size of the tile-local integer grid (default 4096) |
| **GeoWebCache** | Tile cache/proxy for WMS layers, embedded in GeoServer |
| **GiST** | Generalised Search Tree, PostgreSQL index type used for geometries |
| **LOD** | Level of detail: less detail at smaller scales |
| **Martin** | Rust tile server for PostGIS, MBTiles and PMTiles |
| **MBTiles** | SQLite container format for tiles |
| **MVT** | Mapbox Vector Tile, a Protobuf-encoded vector tile format |
| **Optimistic locking** | Detecting conflicting edits by comparing a version/ETag instead of holding locks |
| **PMTiles** | Single-file tile archive designed for static hosting with range requests |
| **RLS** | PostgreSQL row-level security |
| **Slippy map** | Tiled web map addressed by z/x/y |
| **Tile matrix set** | Definition of a tile pyramid (origin, scales, tile size) |
| **TMS** | Tile scheme with y increasing northwards (flipped vs XYZ) |
| **WFS-T** | WFS with transactional operations |
| **Web Mercator** | EPSG:3857, the spherical Mercator used by web maps |
| **XYZ** | Tile addressing with origin at the top-left, y increasing southwards |

### 9.3 Further reading (authoritative sources)

Documentation changes quickly; always check the version you deploy.

- MapLibre GL JS documentation: https://maplibre.org/maplibre-gl-js/docs/
- MapLibre Style Specification: https://maplibre.org/maplibre-style-spec/
- OpenLayers: https://openlayers.org/ · Leaflet: https://leafletjs.com/ · deck.gl: https://deck.gl/ · CesiumJS: https://cesium.com/platform/cesiumjs/
- Mapbox Vector Tile specification: https://github.com/mapbox/vector-tile-spec
- PostGIS reference: https://postgis.net/docs/ (see `ST_AsMVT`, `ST_AsMVTGeom`, `ST_TileEnvelope`)
- pg_tileserv: https://github.com/CrunchyData/pg_tileserv · pg_featureserv: https://github.com/CrunchyData/pg_featureserv · Martin: https://github.com/maplibre/martin
- Tippecanoe: https://github.com/felt/tippecanoe · tilemaker: https://github.com/systemed/tilemaker · PMTiles: https://docs.protomaps.com/pmtiles/
- GeoServer: https://docs.geoserver.org/ · GeoWebCache: https://www.geowebcache.org/ · MapServer: https://mapserver.org/ · QGIS Server: https://docs.qgis.org/latest/en/docs/server_manual/
- OGC API – Features: https://ogcapi.ogc.org/features/ · OGC API – Tiles: https://ogcapi.ogc.org/tiles/
- PostgreSQL row security policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

### 9.4 Verification status of this note

- The tile-math values, the Exercise 1 module, `bench.py` (syntax) and `purge.py` were executed when this note was written; the numbers in the tables come from those runs.
- The SQL, server configuration, FastAPI code and browser code follow the documented behaviour of PostGIS, pg_tileserv, pg_featureserv, Martin, MapLibre GL JS and OpenLayers, but were **not** run against live servers while writing. Run the checklist in Section 5.8 first; if something differs, check the release notes of the versions you installed (default ports, schema rules such as `postgisftw`, and `setTiles` availability are the likeliest differences).
- OGC API – Features Part 4 status and per-server support were checked against current OGC and project pages at the time of writing and may have changed.
