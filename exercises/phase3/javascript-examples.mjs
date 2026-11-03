// proj4js: coordinates are [lon, lat] / [x, y]
import proj4 from "proj4";
proj4.defs("EPSG:32631", "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs");
const [x, y] = proj4("EPSG:4326", "EPSG:32631", [3.0, 52.0]);   // [500000, ≈5761038.2]

// Turf.js: GeoJSON in WGS84 lon/lat; distances in km/miles/etc. (not CRS units)
import * as turf from "@turf/turf";
const clinic = turf.point([4.8926, 52.3731]);
const buffer = turf.buffer(clinic, 0.5, { units: "kilometers" });   // 500 m buffer, approximated locally
console.log(turf.area(buffer));                                      // m², ≈ 0.78 km² for the default step count

const poly = turf.polygon([[[4.88, 52.36], [4.90, 52.36], [4.90, 52.38], [4.88, 52.38], [4.88, 52.36]]]);
console.log(turf.booleanPointInPolygon(clinic, poly));               // true
// Turf 7 takes a FeatureCollection for overlay-type functions; check your installed major version:
const common = turf.intersect(turf.featureCollection([poly, buffer]));

// geotiff.js: range-request reads from a Cloud Optimized GeoTIFF
import { fromUrl } from "geotiff";
const tiff = await fromUrl("https://example.com/elev_cog.tif");     // placeholder URL
const image = await tiff.getImage();
console.log(image.getWidth(), image.getHeight(), image.getBoundingBox());
const raster = await image.readRasters({ window: [0, 0, 256, 256], samples: [0] });   // only that window is fetched
