#!/usr/bin/env python3
import csv
import sys
import zipfile
from xml.sax.saxutils import escape

def read_stops(zip_path):
    with zipfile.ZipFile(zip_path, "r") as z:
        name = next((n for n in z.namelist() if n.lower().endswith("stops.txt")), None)
        if not name:
            raise RuntimeError("stops.txt not found in GTFS ZIP")
        with z.open(name) as raw:
            return list(csv.DictReader((line.decode("utf-8-sig") for line in raw)))

def main():
    if len(sys.argv) != 3:
        print("Usage: python convert_kadamba_gtfs_to_kml.py gtfs.zip output.kml")
        raise SystemExit(2)

    stops = read_stops(sys.argv[1])
    placemarks = []

    for s in stops:
        lat = (s.get("stop_lat") or "").strip()
        lon = (s.get("stop_lon") or "").strip()
        if not lat or not lon:
            continue

        stop_id = escape((s.get("stop_id") or "").strip())
        stop_name = escape((s.get("stop_name") or "").strip())
        stop_code = escape((s.get("stop_code") or "").strip())

        placemarks.append(
            "<Placemark>"
            f"<name>{stop_name}</name>"
            f"<description><![CDATA[stop_id: {stop_id}<br/>stop_code: {stop_code}<br/>latitude: {lat}<br/>longitude: {lon}]]></description>"
            f"<ExtendedData><Data name='stop_id'><value>{stop_id}</value></Data>"
            f"<Data name='stop_code'><value>{stop_code}</value></Data></ExtendedData>"
            f"<Point><coordinates>{lon},{lat},0</coordinates></Point>"
            "</Placemark>"
        )

    kml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
        '<name>Kadamba Goa - Complete GTFS Stops</name>'
        '<description>Converted from the official Kadamba GTFS feed. Source: https://ktclgoa.com/gtfs/</description>'
        + "".join(placemarks) +
        '</Document></kml>'
    )

    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(kml)

    print(f"Created {sys.argv[2]} with {len(placemarks)} stops.")

if __name__ == "__main__":
    main()
