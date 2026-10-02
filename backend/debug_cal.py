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

for trip_id in common_trip_ids:
    orig_st = trips_origin[trip_id]
    dest_st = trips_dest[trip_id]
    
    if orig_st["stopSequence"] >= dest_st["stopSequence"]:
        continue
        
    trip = trips_col.find_one({"tripId": trip_id})
    cal = service_calendars_col.find_one({"serviceId": trip["serviceId"]})
    print(cal)
    break
