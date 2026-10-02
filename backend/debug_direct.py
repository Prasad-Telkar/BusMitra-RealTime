from db import stop_times_col, trips_col, service_calendars_col
import datetime

origin_stop_ids = ['225', '1792', '2926']
dest_stop_ids = ['223', '224', '2926']

origin_st_list = list(stop_times_col.find({"stopId": {"$in": origin_stop_ids}}))
dest_st_list = list(stop_times_col.find({"stopId": {"$in": dest_stop_ids}}))

trips_origin = {}
for st in origin_st_list:
    if st["tripId"] not in trips_origin or st["stopSequence"] < trips_origin[st["tripId"]]["stopSequence"]:
        trips_origin[st["tripId"]] = st

trips_dest = {}
for st in dest_st_list:
    if st["tripId"] not in trips_dest or st["stopSequence"] > trips_dest[st["tripId"]]["stopSequence"]:
        trips_dest[st["tripId"]] = st

common_trip_ids = set(trips_origin.keys()).intersection(trips_dest.keys())
print(f"Common trips: {len(common_trip_ids)}")

import datetime
from routing_engine import is_service_active, gtfs_time_to_datetime

target_date = datetime.datetime.now().date()
dt_time = datetime.datetime.now()

reasons = {'seq': 0, 'cal': 0, 'past': 0, 'arr_before_dep': 0, 'ok': 0}

for trip_id in common_trip_ids:
    orig_st = trips_origin[trip_id]
    dest_st = trips_dest[trip_id]
    
    if orig_st["stopSequence"] >= dest_st["stopSequence"]:
        reasons['seq'] += 1
        continue
        
    trip = trips_col.find_one({"tripId": trip_id})
    cal = service_calendars_col.find_one({"serviceId": trip["serviceId"]})
    
    if not is_service_active(trip["serviceId"], target_date, prefetched_cal=cal):
        reasons['cal'] += 1
        continue
        
    departure_dt = gtfs_time_to_datetime(target_date, orig_st["departureTime"])
    if departure_dt < dt_time:
        reasons['past'] += 1
        continue
        
    arrival_dt = gtfs_time_to_datetime(target_date, dest_st["arrivalTime"])
    if arrival_dt < departure_dt:
        arrival_dt += datetime.timedelta(days=1)
        
    reasons['ok'] += 1

print(reasons)
