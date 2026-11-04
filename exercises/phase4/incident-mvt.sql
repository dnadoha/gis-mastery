CREATE OR REPLACE FUNCTION incident_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE sql STABLE PARALLEL SAFE AS $$
    WITH bounds AS (
        SELECT ST_TileEnvelope(z, x, y) AS b3857
    ),
    mvtgeom AS (
        SELECT i.incident_id,
               ST_AsMVTGeom(ST_Transform(i.geom, 3857), b.b3857, 4096, 64, true) AS geom
        FROM incident i, bounds b
        -- Transform the TILE (cheap) into the data CRS so the GiST index on i.geom is used
        WHERE i.geom && ST_Transform(b.b3857, 28992)
    )
    SELECT ST_AsMVT(mvtgeom.*, 'incidents', 4096, 'geom') FROM mvtgeom;
$$;
