import os
import csv
import sys
from datetime import datetime
from pymongo import MongoClient, UpdateOne

# Add parent directory to path so we can import db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import stops_col, init_db

def import_stops(csv_path):
    print("========================================")
    print("BUSMITRA KADAMBA GTFS IMPORT")
    print("========================================")
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find {csv_path}")
        return
    
    # Initialize DB and indexes
    init_db()
    
    operations = []
    
    stats = {
        "found": 0,
        "inserted_or_updated": 0,
        "skipped": 0,
        "invalid": 0
    }
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            stats["found"] += 1
            
            stop_id = row.get("stop_id", "").strip()
            if not stop_id:
                stats["invalid"] += 1
                continue
                
            try:
                lat = float(row.get("stop_lat", 0))
                lng = float(row.get("stop_lon", 0))
            except ValueError:
                stats["invalid"] += 1
                continue
                
            # Basic validation for coordinates
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                stats["invalid"] += 1
                continue
                
            # Basic bounding box check for Goa (roughly 14.8 to 15.8 N, 73.6 to 74.4 E)
            if not (14.5 <= lat <= 16.0 and 73.0 <= lng <= 75.0):
                print(f"Warning: Stop {stop_id} coordinates outside expected Goa region: {lat}, {lng}")
                
            name = row.get("stop_name", "").strip()
            if not name:
                stats["invalid"] += 1
                continue
                
            stop_doc = {
                "stopId": stop_id,
                "stopCode": row.get("stop_code", "").strip() or None,
                "name": name,
                "description": row.get("stop_desc", "").strip() or None,
                "location": {
                    "type": "Point",
                    "coordinates": [lng, lat]  # [longitude, latitude] for GeoJSON
                },
                "latitude": lat,
                "longitude": lng,
                "zoneId": row.get("zone_id", "").strip() or None,
                "locationType": int(row.get("location_type") or 0),
                "parentStationId": row.get("parent_station", "").strip() or None,
                "operator": "Kadamba",
                "source": "KTCL_GTFS",
                "sourceFile": os.path.basename(csv_path),
                "active": True,
                "updatedAt": datetime.utcnow()
            }
            
            # Upsert operation
            operations.append(
                UpdateOne(
                    {"stopId": stop_id},
                    {
                        "$set": stop_doc,
                        "$setOnInsert": {"createdAt": datetime.utcnow()}
                    },
                    upsert=True
                )
            )
            
            # Execute in batches of 500
            if len(operations) >= 500:
                result = stops_col.bulk_write(operations)
                stats["inserted_or_updated"] += result.upserted_count + result.modified_count
                # If a document exists and is identical, modified_count might be 0, but it's still processed
                operations.clear()
                
    # Final batch
    if operations:
        result = stops_col.bulk_write(operations)
        stats["inserted_or_updated"] += result.upserted_count + result.modified_count
        
    print(f"\nStops found: {stats['found']}")
    print(f"Stops inserted/updated: {stats['found'] - stats['invalid']}")
    print(f"Invalid records: {stats['invalid']}")
    print("\nRoutes: (Not in this CSV)")
    print("Trips: (Not in this CSV)")
    print("Stop times: (Not in this CSV)")
    print("Shapes: (Not in this CSV)")
    print("\nImport completed successfully.")
    print("========================================")

if __name__ == "__main__":
    import_stops("../data/goa_kadamba_all_gtfs_stops.csv")
