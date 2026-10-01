import os
import csv
import sys
from pymongo import UpdateOne
from collections import defaultdict

# Add backend directory to sys.path so we can import db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import client, routes_col, trips_col, stop_times_col, service_calendars_col, init_db

GTFS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "gtfs")

def batch_upsert(collection, operations, batch_size=1000):
    if not operations:
        return 0, 0
    
    inserted_count = 0
    updated_count = 0
    for i in range(0, len(operations), batch_size):
        batch = operations[i:i + batch_size]
        try:
            res = collection.bulk_write(batch, ordered=False)
            inserted_count += res.upserted_count
            updated_count += res.modified_count
        except Exception as e:
            print(f"Batch write error: {e}")
    return inserted_count, updated_count

def import_routes():
    print("Importing Routes...")
    ops = []
    skipped = 0
    with open(os.path.join(GTFS_DIR, "routes.txt"), "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            route_id = row.get("route_id")
            if not route_id:
                skipped += 1
                continue
            
            route_doc = {
                "routeId": route_id,
                "shortName": row.get("route_short_name", ""),
                "longName": row.get("route_long_name", ""),
                "routeType": row.get("route_type", ""),
                "agencyId": row.get("agency_id", ""),
                "operator": "Kadamba",
                "source": "KTCL_GTFS",
                "active": True
            }
            ops.append(UpdateOne({"routeId": route_id}, {"$set": route_doc}, upsert=True))
    
    ins, upd = batch_upsert(routes_col, ops)
    print(f"Routes -> Inserted: {ins}, Updated: {upd}, Skipped: {skipped}, Total Ops: {len(ops)}")
    return len(ops)

def import_trips():
    print("Importing Trips...")
    ops = []
    skipped = 0
    with open(os.path.join(GTFS_DIR, "trips.txt"), "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            trip_id = row.get("trip_id")
            if not trip_id:
                skipped += 1
                continue
            
            trip_doc = {
                "tripId": trip_id,
                "routeId": row.get("route_id"),
                "serviceId": row.get("service_id"),
                "headsign": row.get("trip_headsign", ""),
                "directionId": row.get("direction_id", ""),
                "operator": "Kadamba",
                "source": "KTCL_GTFS",
                "active": True
            }
            ops.append(UpdateOne({"tripId": trip_id}, {"$set": trip_doc}, upsert=True))
            
    ins, upd = batch_upsert(trips_col, ops)
    print(f"Trips -> Inserted: {ins}, Updated: {upd}, Skipped: {skipped}, Total Ops: {len(ops)}")
    return len(ops)

def import_stop_times():
    print("Importing Stop Times (this may take a minute)...")
    ops = []
    skipped = 0
    with open(os.path.join(GTFS_DIR, "stop_times.txt"), "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            trip_id = row.get("trip_id")
            stop_id = row.get("stop_id")
            stop_seq = row.get("stop_sequence")
            
            if not trip_id or not stop_id or not stop_seq:
                skipped += 1
                continue
            
            try:
                stop_seq = int(stop_seq)
            except:
                skipped += 1
                continue
                
            st_doc = {
                "tripId": trip_id,
                "stopId": stop_id,
                "arrivalTime": row.get("arrival_time", ""),
                "departureTime": row.get("departure_time", ""),
                "stopSequence": stop_seq,
                "timepoint": row.get("timepoint", ""),
                "source": "KTCL_GTFS"
            }
            ops.append(UpdateOne(
                {"tripId": trip_id, "stopSequence": stop_seq},
                {"$set": st_doc},
                upsert=True
            ))
            
    ins, upd = batch_upsert(stop_times_col, ops, batch_size=5000)
    print(f"Stop Times -> Inserted: {ins}, Updated: {upd}, Skipped: {skipped}, Total Ops: {len(ops)}")
    return len(ops)

def import_calendars():
    print("Importing Calendars...")
    
    calendars = defaultdict(lambda: {"calendar": {}, "dates": []})
    
    # calendar.txt
    cal_file = os.path.join(GTFS_DIR, "calendar.txt")
    if os.path.exists(cal_file):
        with open(cal_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                service_id = row.get("service_id")
                if service_id:
                    calendars[service_id]["calendar"] = {
                        "monday": row.get("monday") == "1",
                        "tuesday": row.get("tuesday") == "1",
                        "wednesday": row.get("wednesday") == "1",
                        "thursday": row.get("thursday") == "1",
                        "friday": row.get("friday") == "1",
                        "saturday": row.get("saturday") == "1",
                        "sunday": row.get("sunday") == "1",
                        "startDate": row.get("start_date"),
                        "endDate": row.get("end_date")
                    }
                    calendars[service_id]["serviceId"] = service_id

    # calendar_dates.txt
    dates_file = os.path.join(GTFS_DIR, "calendar_dates.txt")
    if os.path.exists(dates_file):
        with open(dates_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                service_id = row.get("service_id")
                if service_id:
                    calendars[service_id]["serviceId"] = service_id
                    calendars[service_id]["dates"].append({
                        "date": row.get("date"),
                        "exceptionType": row.get("exception_type")
                    })
                    
    ops = []
    for service_id, cal_data in calendars.items():
        doc = {
            "serviceId": service_id,
            "calendar": cal_data["calendar"],
            "dates": cal_data["dates"],
            "source": "KTCL_GTFS"
        }
        ops.append(UpdateOne({"serviceId": service_id}, {"$set": doc}, upsert=True))
        
    ins, upd = batch_upsert(service_calendars_col, ops)
    print(f"Service Calendars -> Inserted: {ins}, Updated: {upd}, Total Ops: {len(ops)}")
    return len(ops)


if __name__ == "__main__":
    print("====================================")
    print("BUSMITRA GTFS SCHEDULE IMPORT")
    print("====================================")
    
    init_db()
    
    import_routes()
    import_calendars()
    import_trips()
    import_stop_times()
    
    print("====================================")
    print("IMPORT COMPLETE")
    print("====================================")
