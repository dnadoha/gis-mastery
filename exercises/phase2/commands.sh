#!/usr/bin/env bash
# Worked conversion commands. Run in a NEW directory with the downloaded helpers.
# Requires Bash, Python 3 and GDAL/OGR. Outputs go in work/; originals are retained.
set -euo pipefail
if [ -e work ] || [ -e release ] || [ -e dem.asc ] || [ -e tiles.csv ]; then
  echo "Use a fresh directory: work/, release/, dem.asc or tiles.csv already exists." >&2
  exit 1
fi
mkdir -p work

# The original intentionally reports feature 2's winding problem (exit 1).
python check_geojson.py parcels.geojson || test "$?" -eq 1
ogr2ogr -f "ESRI Shapefile" work/shp_out parcels.geojson -nln parcels -lco ENCODING=UTF-8
ogr2ogr -f GPKG work/parcels.gpkg parcels.geojson -nln parcels -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom
ogr2ogr -f GPKG work/parcels_rd.gpkg work/parcels.gpkg -nln parcels -t_srs EPSG:28992
ogr2ogr -f GeoJSON work/parcels_rfc7946.geojson work/parcels.gpkg -t_srs EPSG:4326 -lco RFC7946=YES
ogr2ogr -f FlatGeobuf work/parcels.fgb work/parcels.gpkg
ogrinfo -so -al work/shp_out/parcels.shp
ogrinfo -so -al work/parcels.gpkg
ogrinfo -so -al work/parcels.fgb
python check_geojson.py work/parcels_rfc7946.geojson
python tiles.py
python gpkg_blob.py work/parcels.gpkg
python mvt_decode.py

# make_dem writes dem.asc in the working directory, with a NoData declaration.
python make_dem.py
gdal_translate -of GTiff -ot Float32 -a_srs EPSG:28992 -a_nodata -9999 \
  -co TILED=YES -co COMPRESS=DEFLATE -co PREDICTOR=3 dem.asc work/dem.tif
gdal_translate -of COG work/dem.tif work/dem_cog.tif \
  -co COMPRESS=DEFLATE -co PREDICTOR=FLOATING_POINT -co BLOCKSIZE=256 -co RESAMPLING=AVERAGE
# Explicitly remove inherited NoData for the deliberately broken comparison only.
gdal_translate -of GTiff -a_srs EPSG:28992 -a_nodata none dem.asc work/dem_no_nodata.tif
gdalinfo -stats work/dem.tif
gdalinfo -stats work/dem_no_nodata.tif
gdalinfo work/dem_cog.tif

# MBTiles is the exercise's allowed alternative when the PMTiles tool is absent.
ogr2ogr -f MVT work/parcels.mbtiles work/parcels.gpkg \
  -dsco FORMAT=MBTILES -dsco MINZOOM=10 -dsco MAXZOOM=16 -dsco NAME=parcels
mkdir -p release/vector release/tiles release/raster release/metadata
cp work/parcels.gpkg release/vector/parcels.gpkg
cp work/parcels_rfc7946.geojson release/vector/parcels.geojson
cp work/parcels.fgb release/vector/parcels.fgb
cp work/parcels.mbtiles release/tiles/parcels.mbtiles
cp work/dem_cog.tif release/raster/dem_cog.tif
cp parcels.xml release/metadata/parcels.xml
cp requests.txt release/requests.md
cp release_readme.md release/README.md
# Fill in release/README.md and metadata with actual versions, dates and evidence.
python verify_package.py release

# Optional: pmtiles convert work/parcels.mbtiles release/tiles/parcels.pmtiles
# Inspect with your pmtiles CLI and retain its verification evidence.
# The Python checker intentionally FAILs a PMTiles archive it cannot validate.
