#!/usr/bin/env python3
"""Check real release artifacts; failures/missing tools never become PASS.

Uses only Python's standard library, but calls installed GDAL command-line tools
to inspect FlatGeobuf and the actual COG. Supports MBTiles or an MVT directory.
For PMTiles-only releases, first extract/convert to MBTiles for this checker;
the archive itself is explicitly not certified by checking a different file.
"""
import argparse
from contextlib import closing
import io
import json
import math
from pathlib import Path
import sqlite3
import subprocess
import sys
import xml.etree.ElementTree as ET

from check_geojson import inspect
from gpkg_blob import parse_gpkg_blob
from tiles_cover import cover

EXPECTED_BBOX = (4.892, 52.3728, 4.8945, 52.3744)
FIELDS = {"parcel_id", "land_use_class", "population_total", "population_density"}
EXPECTED_RECORDS = [
    {"parcel_id": "P001", "land_use_class": "residential", "population_total": 120, "population_density": 5400.5},
    {"parcel_id": "P002", "land_use_class": "commercial", "population_total": 15, "population_density": 800.0},
    {"parcel_id": "P003", "land_use_class": "park", "population_total": None, "population_density": None},
]


def records_match(records):
    """Compare this teaching dataset's known values, including explicit nulls."""
    selected = [{key: record[key] for key in FIELDS} for record in records]
    return sorted(selected, key=lambda r: r["parcel_id"]) == EXPECTED_RECORDS


def near_bbox(actual):
    return actual is not None and len(actual) == 4 and all(abs(a - b) < 1e-7 for a, b in zip(actual, EXPECTED_BBOX))


def raster_facts(text):
    """Parse an actual AAIGrid export, checking the grid and every pixel count."""
    f = io.StringIO(text)
    header = {}
    for _ in range(6):
        key, value = f.readline().split()
        header[key.lower()] = float(value)
    count, valid, total, lo, hi = 0, 0, 0.0, float("inf"), float("-inf")
    for line in f:
        for token in line.split():
            value = float(token)
            if not math.isfinite(value):
                raise ValueError("non-finite raster value")
            count += 1
            if value == header["nodata_value"]:
                continue
            valid += 1
            total += value
            lo, hi = min(lo, value), max(hi, value)
    if count != header["ncols"] * header["nrows"] or not valid:
        raise ValueError("raster pixel count does not match header or has no valid pixels")
    return {"header": header, "cells": count, "valid": valid, "min": lo, "max": hi, "mean": total / valid}


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", timeout=180)
    if result.returncode:
        raise ValueError(f"{args[0]} failed (exit {result.returncode}); inspect it locally")
    return result.stdout


def verify(root):
    results = []

    def check(name, ok, detail=""):
        results.append({"check": name, "ok": bool(ok), "detail": detail})

    def attempt(name, operation):
        try:
            operation()
        except (OSError, ValueError, KeyError, TypeError, IndexError, sqlite3.Error, ET.ParseError, subprocess.SubprocessError) as error:
            check(name, False, str(error))

    def geojson():
        fc = json.loads((root / "vector/parcels.geojson").read_text(encoding="utf-8"))
        count, bbox, problems = inspect(fc)
        check("geojson: 3 features", count == 3, count)
        check("geojson: polygon sanity and winding", not problems, problems)
        check("geojson: expected bbox", near_bbox(bbox), bbox)
        check("geojson: full attribute names", all(FIELDS <= set(f.get("properties", {})) for f in fc["features"]))
        check("geojson: source attribute values and nulls", records_match([f["properties"] for f in fc["features"]]))

    def gpkg():
        file = (root / "vector/parcels.gpkg").resolve()
        with closing(sqlite3.connect(file.as_uri() + "?mode=ro", uri=True)) as con:
            check("gpkg: application_id", con.execute("PRAGMA application_id").fetchone()[0] == 1196444487)
            check("gpkg: 3 features", con.execute("SELECT COUNT(*) FROM parcels").fetchone()[0] == 3)
            check("gpkg: registered CRS", con.execute("SELECT srs_id FROM gpkg_contents WHERE table_name='parcels'").fetchone()[0] == 4326)
            check("gpkg: full attribute names", FIELDS <= {r[1] for r in con.execute("PRAGMA table_info(parcels)")})
            columns = ["parcel_id", "land_use_class", "population_total", "population_density"]
            records = [dict(zip(columns, row)) for row in con.execute("SELECT parcel_id,land_use_class,population_total,population_density FROM parcels")]
            check("gpkg: source attribute values and nulls", records_match(records))
            headers = [parse_gpkg_blob(bytes(r[0])) for r in con.execute("SELECT geom FROM parcels")]
            check("gpkg: all blob CRS and MultiPolygon types", bool(headers) and all(h["srs_id"] == 4326 and h["wkb_type"] == 6 and not h["empty"] for h in headers))
            envelopes = [h["envelope(minx,maxx,miny,maxy)"] for h in headers]
            check("gpkg: all envelopes inside source bbox", bool(envelopes) and all(e is not None and
                  EXPECTED_BBOX[0] - 1e-7 <= e[0] <= e[1] <= EXPECTED_BBOX[2] + 1e-7 and
                  EXPECTED_BBOX[1] - 1e-7 <= e[2] <= e[3] <= EXPECTED_BBOX[3] + 1e-7 for e in envelopes), envelopes)

    def flatgeobuf():
        file = root / "vector/parcels.fgb"
        # Convert the actual FGB into an in-memory textual inspection stream.
        text = run("ogr2ogr", "-f", "GeoJSON", "/vsistdout/", str(file))
        fc = json.loads(text)
        count, bbox, _ = inspect(fc)
        check("flatgeobuf: 3 features and expected extent", count == 3 and near_bbox(bbox))
        check("flatgeobuf: full attribute names", all(FIELDS <= set(f.get("properties", {})) for f in fc["features"]))
        check("flatgeobuf: source attribute values and nulls", records_match([f["properties"] for f in fc["features"]]))

    def tiles():
        expected = {(z, x, y) for z, x, y, ty in cover(EXPECTED_BBOX, 10, 16)}
        check("tile math: theoretical bbox cover has 8 addresses", len(expected) == 8)
        mbtiles = root / "tiles/parcels.mbtiles"
        directory = root / "tiles/parcels_tiles"
        if (root / "tiles/parcels.pmtiles").exists():
            check("pmtiles: archive inspection not implemented", False,
                  "Run pmtiles show/verify for your CLI version and keep its evidence; this checker cannot certify that archive.")
        if mbtiles.exists():
            with closing(sqlite3.connect(mbtiles.resolve().as_uri() + "?mode=ro", uri=True)) as con:
                rows = list(con.execute("SELECT zoom_level,tile_column,tile_row,length(tile_data) FROM tiles"))
            actual = {(z, x, 2 ** z - 1 - row) for z, x, row, length in rows}
            nonempty = all(length > 0 for z, x, row, length in rows)
        elif directory.is_dir():
            files = list(directory.glob("*/*/*.pbf"))
            actual = {tuple(map(int, (f.parent.parent.name, f.parent.name, f.stem))) for f in files}
            nonempty = all(f.stat().st_size > 0 for f in files)
        else:
            raise ValueError("need tiles/parcels.mbtiles or tiles/parcels_tiles/ for actual tile inspection")
        check("tiles: expected bbox-cover addresses populated", expected <= actual and nonempty,
              {"expected": len(expected), "actual": len(actual), "extra": len(actual - expected)})
        check("tiles: no out-of-grid or out-of-zoom addresses", all(10 <= z <= 16 and 0 <= x < 2 ** z and 0 <= y < 2 ** z for z, x, y in actual))

    def raster():
        file = root / "raster/dem_cog.tif"
        info = json.loads(run("gdalinfo", "-json", str(file)))
        check("cog: size and affine transform", info["size"] == [1200, 800] and
              all(abs(a - b) < 1e-7 for a, b in zip(info["geoTransform"], [121000, 2.5, 0, 488000, 0, -2.5])))
        check("cog: registered RD New CRS", 'ID["EPSG",28992]' in info["coordinateSystem"]["wkt"] or
              'AUTHORITY["EPSG","28992"]' in info["coordinateSystem"]["wkt"])
        band = info["bands"][0]
        check("cog: Float32, NoData and block size", len(info["bands"]) == 1 and band["type"] == "Float32"
              and band.get("noDataValue") == -9999 and band["block"] == [256, 256])
        check("cog: layout marker, DEFLATE and overviews", info.get("metadata", {}).get("IMAGE_STRUCTURE", {}).get("LAYOUT") == "COG"
              and info.get("metadata", {}).get("IMAGE_STRUCTURE", {}).get("COMPRESSION") == "DEFLATE" and bool(band.get("overviews")),
              "This inspects GDAL layout metadata, not full COG conformance.")
        facts = raster_facts(run("gdal_translate", "-q", "-of", "AAIGrid", str(file), "/vsistdout/"))
        check("released raster: 955000 valid cells", facts["valid"] == 955000 and facts["cells"] == 960000, facts["valid"])
        check("released raster: min/max/mean", abs(facts["min"] - 2) < 1e-5 and abs(facts["max"] - 10) < 1e-5
              and abs(facts["mean"] - 3.0096) < 5e-4, {k: facts[k] for k in ("min", "max", "mean")})

    def metadata():
        tree = ET.parse(root / "metadata/parcels.xml")
        ns = {"gmd": "http://www.isotc211.org/2005/gmd", "gco": "http://www.isotc211.org/2005/gco"}
        for tag in ("title", "abstract", "date", "statement"):
            check(f"metadata: {tag} populated", any("".join(e.itertext()).strip() for e in tree.findall(f".//gmd:{tag}", ns)))
        elements = [tree.find(f".//gmd:{tag}/gco:Decimal", ns) for tag in
                    ("westBoundLongitude", "southBoundLatitude", "eastBoundLongitude", "northBoundLatitude")]
        if any(element is None or not element.text for element in elements):
            check("metadata: bbox matches", False, "missing geographic extent element")
        else:
            values = [float(element.text) for element in elements]
            check("metadata: bbox matches", near_bbox(values), values)
        check("release: README and requests present", (root / "README.md").is_file() and (root / "requests.md").is_file())

    for name, operation in (("geojson inspection", geojson), ("gpkg inspection", gpkg),
                            ("flatgeobuf inspection (GDAL required)", flatgeobuf), ("tile inspection", tiles),
                            ("COG inspection (GDAL required)", raster), ("metadata inspection", metadata)):
        attempt(name, operation)
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release", nargs="?", default="release", type=Path)
    args = parser.parse_args()
    if not args.release.is_dir():
        parser.error("release directory does not exist; build it before running the verifier")
    results = verify(args.release)
    (args.release / "checks.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    for result in results:
        print(("PASS " if result["ok"] else "FAIL ") + result["check"])
        if not result["ok"]:
            print(" ", result["detail"])
    print("Limits: no full topology, WKB payload, COG/INSPIRE conformance or MVT payload validation.")
    sys.exit(0 if all(r["ok"] for r in results) else 1)
