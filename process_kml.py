import xml.etree.ElementTree as ET
import json
import glob
import os

def parse_kml(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    coords = []
    # 1. Look for LineString coordinates
    for ls in root.findall('.//kml:LineString/kml:coordinates', ns):
        text = ls.text.strip()
        for point in text.split():
            parts = point.split(',')
            if len(parts) >= 2:
                lon, lat = float(parts[0]), float(parts[1])
                coords.append([lat, lon]) # Leaflet uses [lat, lon]
                
    # 2. Look for gx:Track / kml:Track containing coord elements
    if not coords:
        # Some KMLs use <coord>lon lat alt</coord> (sometimes with gx namespace)
        for coord_elem in root.iter():
            tag = coord_elem.tag.split('}')[-1]
            if tag == 'coord':
                text = coord_elem.text.strip()
                parts = text.split()
                if len(parts) >= 2:
                    lon, lat = float(parts[0]), float(parts[1])
                    coords.append([lat, lon])
                    
    return coords

def main():
    data_dir = "c:/Users/prasa/Downloads/BridgeAura Internship deatils/BusMitra-App/busmitra-app/data"
    out_dir = "c:/Users/prasa/Downloads/BridgeAura Internship deatils/BusMitra-App/busmitra-app/frontend/src/data"
    os.makedirs(out_dir, exist_ok=True)
    
    routes_geo = {}
    for kml_file in glob.glob(os.path.join(data_dir, "*.kml")):
        name = os.path.basename(kml_file).replace(".kml", "")
        coords = parse_kml(kml_file)
        if coords:
            # Map filenames to route IDs if they match known routes
            # Ponda-Old Goa -> route4_bus2 ? 
            # Mashem_to_Margao -> route4_bus1?
            routes_geo[name] = coords
            print(f"Parsed {name}: {len(coords)} points")
        else:
            print(f"Warning: No coordinates found in {name}")
            
    out_path = os.path.join(out_dir, "route_shapes.json")
    with open(out_path, "w") as f:
        json.dump(routes_geo, f)
    print(f"Saved to {out_path}")

if __name__ == "__main__":
    main()
