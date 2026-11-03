# Exercise 3 — raster report (fill with actual output)

## Grid contract

Record size, CRS, origin, pixel size, lower-right corner, NoData and data type.

## Independent source statistics and actual output

Paste make_dem.py output and gdalinfo -stats excerpts. Explain tolerances.

## Overviews and byte arithmetic

Compute factors 2, 4, 8 and uncompressed Float32 base bytes before checking the solution.

## Deliberately broken NoData experiment

Use -a_nodata none to remove the inherited declaration; inspect and compare.

## Resampling

Justify choices for elevation and land-use classes, including COG overviews.
