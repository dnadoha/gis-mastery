#!/usr/bin/env python3
"""Run stdlib helper regression checks; no GDAL/PMTiles execution is claimed."""
import copy
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from check_geojson import check_polygon, inspect, signed_area
from gpkg_blob import parse_gpkg_blob
from mvt_decode import decode, zz, unzigzag
from tilemath import MAX_LAT, lonlat_to_3857, tile_bounds_3857, tile_xyz, tms_y
from tiles_cover import cover
from verify_package import EXPECTED_RECORDS, raster_facts, records_match, verify

HERE = Path(__file__).resolve().parent


class Helpers(unittest.TestCase):
    def test_original_has_exactly_one_problem(self):
        data = json.loads((HERE / "parcels.geojson").read_text(encoding="utf-8"))
        count, bbox, problems = inspect(data)
        self.assertEqual(count, 3)
        self.assertEqual(bbox, (4.892, 52.3728, 4.8945, 52.3744))
        self.assertEqual(problems, ["feature 2 ring 0 (exterior): winding is CW, expected CCW"])

    def test_promoted_polygons_are_actually_checked(self):
        data = json.loads((HERE / "parcels.geojson").read_text(encoding="utf-8"))
        for feature in data["features"]:
            g = feature["geometry"]
            g["type"], g["coordinates"] = "MultiPolygon", [g["coordinates"]]
        self.assertEqual(len(inspect(data)[2]), 1)
        data["features"][1]["geometry"]["coordinates"][0][0].reverse()
        self.assertEqual(inspect(data)[2], [])
        data["features"][2]["geometry"]["coordinates"][0][1].reverse()
        self.assertIn("(hole)", inspect(data)[2][0])

    def test_malformed_and_degenerate_rings(self):
        cases = [[], [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 1], [2, 2], [0, 0]],
                 [[0, 0], [math.nan, 0], [1, 1], [0, 0]], [[0], [1], [2], [0]],
                 [[0, 0], [181, 0], [1, 1], [0, 0]]]
        for ring in cases:
            with self.subTest(ring=ring):
                self.assertTrue(check_polygon([ring], "test"))

    def test_three_dimensional_coordinates(self):
        ring = [[0, 0, 3], [1, 0, 3], [1, 1, 3], [0, 0, 3]]
        self.assertEqual(check_polygon([ring], "3d"), [])
        self.assertAlmostEqual(signed_area(ring), 0.5)

    def test_known_tile_values(self):
        self.assertEqual(tile_xyz(4.8926, 52.3731, 14), (8414, 5384))
        self.assertEqual(tms_y(5384, 14), 10999)
        self.assertEqual(tile_xyz(4.8926, 52.3731, 0), (0, 0))
        self.assertEqual(tile_xyz(4.8926, 52.3731, 5), (16, 10))
        self.assertEqual(tile_xyz(4.8926, 52.3731, 10), (525, 336))
        expected = (543008.649, 6865879.629, 545454.634, 6868325.614)
        for actual, wanted in zip(tile_bounds_3857(8414, 5384, 14), expected):
            self.assertAlmostEqual(actual, wanted, places=3)
        x, y = lonlat_to_3857(4.8926, 52.3731)
        self.assertAlmostEqual(x, 544641.74, places=2)
        self.assertAlmostEqual(y, 6867869.91, places=2)

    def test_tile_boundaries_and_invalid_inputs(self):
        self.assertEqual(tile_xyz(180, 90, 1), (1, 0))
        self.assertEqual(tile_xyz(-180, -90, 1), (0, 1))
        self.assertEqual(tile_xyz(0, MAX_LAT, 0), (0, 0))
        for lon, lat, z in [(181, 0, 1), (0, 91, 1), (math.nan, 0, 1), (0, 0, -1), (0, 0, 1.5)]:
            with self.assertRaises(ValueError):
                tile_xyz(lon, lat, z)
        with self.assertRaises(ValueError):
            tms_y(2, 1)
        with self.assertRaises(ValueError):
            tile_bounds_3857(-1, 0, 1)

    def test_eight_tile_bbox_cover(self):
        tiles = list(cover((4.892, 52.3728, 4.8945, 52.3744), 10, 16))
        self.assertEqual(len(tiles), 8)
        self.assertEqual(tiles[-2:], [(16, 33658, 21536, 43999), (16, 33659, 21536, 43999)])
        for bbox in [(1, 0, -1, 1), (0, 1, 1, 0)]:
            with self.assertRaises(ValueError):
                list(cover(bbox, 10, 16))

    def test_sample_blob(self):
        blob = bytes.fromhex((HERE / "sample_polygon.hex").read_text().strip())
        self.assertEqual(len(blob), 133)
        parsed = parse_gpkg_blob(blob)
        self.assertEqual(parsed["srs_id"], 4326)
        self.assertEqual(parsed["wkb_name"], "Polygon")
        self.assertEqual(parsed["wkb_offset"], 40)
        self.assertEqual(parsed["envelope(minx,maxx,miny,maxy)"], (4.892, 4.893, 52.3728, 52.3734))

    def test_header_and_wkb_byte_orders_are_independent(self):
        header = b"GP\0\0" + struct.pack(">i", 4326)
        blob = header + struct.pack("<BI2d", 1, 1, 4.9, 52.3)
        parsed = parse_gpkg_blob(blob)
        self.assertEqual(parsed["byte_order"], "big")
        self.assertEqual(parsed["wkb_byte_order"], "little")
        self.assertEqual(parsed["wkb_name"], "Point")
        self.assertIsNone(parsed["envelope(minx,maxx,miny,maxy)"])

    def test_reject_bad_headers(self):
        blob = bytearray(bytes.fromhex((HERE / "sample_polygon.hex").read_text().strip()))
        for bad in [b"", bytes(blob[:7]), bytes(blob[:42]), b"XX" + blob[2:]]:
            with self.assertRaises(ValueError):
                parse_gpkg_blob(bad)
        for offset, value in [(2, 1), (3, 15), (3, 0x43), (40, 2)]:
            bad = copy.copy(blob)
            bad[offset] = value
            with self.assertRaises(ValueError):
                parse_gpkg_blob(bad)

    def test_square_mvt_commands_and_area(self):
        stream = [9, 20, 20, 26, 40, 0, 0, 40, 39, 0, 15]
        self.assertEqual(decode(stream), [("MoveTo", 10, 10), ("LineTo", 30, 10),
                                         ("LineTo", 30, 30), ("LineTo", 10, 30), ("ClosePath",)])
        self.assertEqual(signed_area([(10, 10), (30, 10), (30, 30), (10, 30)]), 400)
        for v in (-2**31, -20, -1, 0, 1, 20, 2**31 - 1):
            self.assertEqual(unzigzag(zz(v)), v)

    def test_reject_truncated_and_unknown_mvt_commands(self):
        for stream in ([9, 20], [8, 0, 0], [1], [15], [9, 20, 20, 23], [9, -1, 2], [10, 0, 0]):
            with self.subTest(stream=stream), self.assertRaises(ValueError):
                decode(stream)

    def test_raster_parser_excludes_nodata(self):
        text = "ncols 2\nnrows 2\nxllcorner 0\nyllcorner 0\ncellsize 1\nNODATA_value -9999\n2 10\n-9999 3\n"
        facts = raster_facts(text)
        self.assertEqual(facts["valid"], 3)
        self.assertEqual(facts["min"], 2)
        self.assertEqual(facts["max"], 10)
        self.assertEqual(facts["mean"], 5)
        with self.assertRaises(ValueError):
            raster_facts(text.replace("2 10", "2"))

    def test_missing_artifacts_and_tools_never_pass(self):
        with tempfile.TemporaryDirectory(prefix="phase2-check-", dir=os.environ.get("OPENCODE_TMP")) as tmp:
            root = Path(tmp)
            with patch("verify_package.run", side_effect=FileNotFoundError("GDAL unavailable")):
                results = verify(root)
            self.assertTrue(any(not r["ok"] for r in results))
            self.assertFalse((root / "vector/parcels.gpkg").exists())
            self.assertTrue(any(r["check"] == "COG inspection (GDAL required)" and not r["ok"] for r in results))

    def test_metadata_missing_elements_are_failed_not_crashes(self):
        with tempfile.TemporaryDirectory(prefix="phase2-xml-", dir=os.environ.get("OPENCODE_TMP")) as tmp:
            root = Path(tmp)
            (root / "metadata").mkdir()
            (root / "metadata/parcels.xml").write_text('<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd"/>')
            with patch("verify_package.run", side_effect=FileNotFoundError("GDAL unavailable")):
                results = verify(root)
            self.assertTrue(any(r["check"] == "metadata: bbox matches" and not r["ok"] for r in results))

    def test_attribute_values_and_nulls_are_preserved(self):
        self.assertTrue(records_match(list(reversed(EXPECTED_RECORDS))))
        records = copy.deepcopy(EXPECTED_RECORDS)
        records[2]["population_total"] = 0
        self.assertFalse(records_match(records))
        records = copy.deepcopy(EXPECTED_RECORDS)
        records[0]["land_use_class"] = "CORRUPTED"
        self.assertFalse(records_match(records))

    def test_sqlite_file_is_unlocked_after_inspection(self):
        import sqlite3
        from contextlib import closing
        with tempfile.TemporaryDirectory(prefix="phase2-sqlite-", dir=os.environ.get("OPENCODE_TMP")) as tmp:
            root = Path(tmp)
            (root / "vector").mkdir()
            file = root / "vector/parcels.gpkg"
            with closing(sqlite3.connect(file)) as con:
                con.execute("CREATE TABLE parcels (fid INTEGER)")
                con.commit()
            with patch("verify_package.run", side_effect=FileNotFoundError("GDAL unavailable")):
                verify(root)
            file.unlink()  # On Windows this fails if the inspection connection leaked.
            self.assertFalse(file.exists())

    def test_real_dem_generator_reference_values(self):
        with tempfile.TemporaryDirectory(prefix="phase2-dem-", dir=os.environ.get("OPENCODE_TMP")) as tmp:
            process = subprocess.run([sys.executable, str(HERE / "make_dem.py")], cwd=tmp,
                                     capture_output=True, text=True, timeout=30)
            self.assertEqual(process.returncode, 0, process.stderr)
            facts = raster_facts((Path(tmp) / "dem.asc").read_text())
            self.assertEqual(facts["cells"], 960000)
            self.assertEqual(facts["valid"], 955000)
            self.assertEqual((facts["min"], facts["max"]), (2.0, 10.0))
            self.assertAlmostEqual(facts["mean"], 3.0096, places=4)
            self.assertEqual(facts["header"]["nrows"], 800)


if __name__ == "__main__":
    unittest.main(verbosity=2)
