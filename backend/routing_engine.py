import datetime
import math
import requests
from db import stops_col, trips_col, stop_times_col, service_calendars_col, routes_col

OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/foot"

def distance_m(lat1, lon1, lat2, lon2):
    R = 6371e3
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2) * math.sin(dp/2) + math.cos(p1) * math.cos(p2) * math.sin(dl/2) * math.sin(dl/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_walking_route(origin_lat, origin_lng, dest_lat, dest_lng):
    """
    walkingRoutingService provider abstraction.
    Calls OSRM to get pedestrian walking paths.
    """
    # Don't route if extremely close (e.g., < 10 meters)
    if distance_m(origin_lat, origin_lng, dest_lat, dest_lng) < 10:
        return {
            "distanceMeters": 0,
            "durationMinutes": 0,
            "path": [[origin_lat, origin_lng], [dest_lat, dest_lng]]
        }
        
    try:
        url = f"{OSRM_BASE_URL}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?geometries=geojson"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get("routes"):
                route = data["routes"][0]
                coordinates = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]
                return {
                    "distanceMeters": route["distance"],
                    "durationMinutes": math.ceil(route["duration"] / 60),
                    "path": coordinates
                }
    except Exception as e:
        print(f"OSRM error: {e}")
    
    # Fallback to straight line estimate if OSRM fails
    dist = distance_m(origin_lat, origin_lng, dest_lat, dest_lng)
    return {
        "distanceMeters": dist,
        "durationMinutes": math.ceil(dist / 80), # ~1.3m/s walking speed
        "path": [[origin_lat, origin_lng], [dest_lat, dest_lng]],
        "isEstimate": True
    }

def get_nearby_stops(lat, lng, radius_m=2000, max_stops=5):
    """Find stops within a certain radius"""
    stops = list(stops_col.find({
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                "$maxDistance": radius_m
            }
        }
    }).limit(max_stops))
    if not stops:
        all_stops = list(stops_col.find())
        for s in all_stops:
            s['dist'] = distance_m(lat, lng, s.get('latitude', 0), s.get('longitude', 0))
        all_stops.sort(key=lambda x: x['dist'])
        stops = [s for s in all_stops if s['dist'] <= radius_m][:max_stops]
    return stops

def is_service_active(service_id, target_date):
    """Check if a GTFS service is active on the given date (datetime.date)."""
    cal = service_calendars_col.find_one({"serviceId": service_id})
    if not cal:
        return False
    
    start_str = cal["calendar"].get("startDate")
    end_str = cal["calendar"].get("endDate")
    
    if start_str and end_str:
        try:
            start_date = datetime.datetime.strptime(start_str, "%Y%m%d").date()
            end_date = datetime.datetime.strptime(end_str, "%Y%m%d").date()
            if target_date < start_date or target_date > end_date:
                return False
        except:
            pass

    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    day_name = days[target_date.weekday()]
    return cal["calendar"].get(day_name, False)

def parse_gtfs_time(time_str):
    if not time_str or time_str.strip() == "":
        return 0, 0, 0
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = int(parts[2]) if len(parts) > 2 else 0
    return hours, minutes, seconds

def gtfs_time_to_datetime(target_date, time_str):
    h, m, s = parse_gtfs_time(time_str)
    # Handle > 24 hours properly
    days_add = h // 24
    h = h % 24
    dt = datetime.datetime(target_date.year, target_date.month, target_date.day)
    dt += datetime.timedelta(days=days_add, hours=h, minutes=m, seconds=s)
    return dt

def _get_route_number(route_id):
    route = routes_col.find_one({"routeId": route_id})
    if route:
        return route.get("routeNumber") or route.get("shortName") or "BUS"
    return "BUS"

def plan_transit_journey(origin, destination, dt_time=None, live_buses=None):
    if dt_time is None:
        dt_time = datetime.datetime.now()
        
    target_date = dt_time.date()
    
    origin_stops = get_nearby_stops(origin['lat'], origin['lng'], 1500, 3)
    dest_stops = get_nearby_stops(destination['lat'], destination['lng'], 1500, 3)
    
    if not origin_stops or not dest_stops:
        return {"success": False, "reason": "NO_STOPS_NEARBY"}
        
    origin_stop_ids = [s["stopId"] for s in origin_stops]
    dest_stop_ids = [s["stopId"] for s in dest_stops]
    
    # Stage 1: Find direct trips
    origin_st_list = list(stop_times_col.find({"stopId": {"$in": origin_stop_ids}}))
    dest_st_list = list(stop_times_col.find({"stopId": {"$in": dest_stop_ids}}))
    
    trips_origin = {st["tripId"]: st for st in origin_st_list}
    trips_dest = {st["tripId"]: st for st in dest_st_list}
    
    common_trip_ids = set(trips_origin.keys()).intersection(trips_dest.keys())
    journeys = []
    
    for trip_id in common_trip_ids:
        orig_st = trips_origin[trip_id]
        dest_st = trips_dest[trip_id]
        
        if orig_st["stopSequence"] >= dest_st["stopSequence"]:
            continue
            
        trip = trips_col.find_one({"tripId": trip_id})
        if not trip: continue
        if not is_service_active(trip["serviceId"], target_date): continue
            
        departure_dt = gtfs_time_to_datetime(target_date, orig_st["departureTime"])
        if departure_dt < dt_time: continue
            
        arrival_dt = gtfs_time_to_datetime(target_date, dest_st["arrivalTime"])
        if arrival_dt < departure_dt:
            arrival_dt += datetime.timedelta(days=1)
        
        start_stop = next(s for s in origin_stops if s["stopId"] == orig_st["stopId"])
        end_stop = next(s for s in dest_stops if s["stopId"] == dest_st["stopId"])
        
        first_mile = get_walking_route(origin['lat'], origin['lng'], start_stop['latitude'], start_stop['longitude'])
        last_mile = get_walking_route(end_stop['latitude'], end_stop['longitude'], destination['lat'], destination['lng'])
        
        is_live = False
        live_bus_id = None
        if live_buses:
            for b_id, state in live_buses.items():
                if state.get("current", {}).get("trip_id") == trip_id:
                    is_live = True
                    live_bus_id = b_id
                    break
        
        total_dur = first_mile["durationMinutes"] + int((arrival_dt - departure_dt).total_seconds() / 60) + last_mile["durationMinutes"]
        
        journey = {
            "journeyId": f"dir-{trip_id}-{orig_st['stopId']}-{dest_st['stopId']}",
            "type": "DIRECT",
            "totalDurationMinutes": total_dur,
            "departureTime": (departure_dt - datetime.timedelta(minutes=first_mile["durationMinutes"])).strftime("%I:%M %p"),
            "arrivalTime": (arrival_dt + datetime.timedelta(minutes=last_mile["durationMinutes"])).strftime("%I:%M %p"),
            "isLive": is_live,
            "legs": [
                {
                    "type": "WALK",
                    "from": "Origin",
                    "to": start_stop["name"],
                    "durationMinutes": first_mile["durationMinutes"],
                    "distanceMeters": first_mile["distanceMeters"],
                    "path": first_mile["path"],
                    "icon": "🚶"
                },
                {
                    "type": "BUS",
                    "routeId": trip["routeId"],
                    "routeNumber": _get_route_number(trip["routeId"]),
                    "routeName": trip.get("headsign"),
                    "tripId": trip_id,
                    "from": start_stop["name"],
                    "to": end_stop["name"],
                    "scheduledDeparture": departure_dt.strftime("%I:%M %p"),
                    "scheduledArrival": arrival_dt.strftime("%I:%M %p"),
                    "isLive": is_live,
                    "liveBusId": live_bus_id,
                    "icon": "🚌"
                },
                {
                    "type": "WALK",
                    "from": end_stop["name"],
                    "to": "Destination",
                    "durationMinutes": last_mile["durationMinutes"],
                    "distanceMeters": last_mile["distanceMeters"],
                    "path": last_mile["path"],
                    "icon": "🚶"
                }
            ]
        }
        journeys.append(journey)
        
    # Stage 2: Attempt 1-transfer routing if direct fails or yields too few
    if len(journeys) < 3:
        # Transfer Logic:
        # Find all trips from origin stops. For each, where does it go?
        # Find all trips to dest stops. For each, where does it come from?
        # Intersect the "where it goes" and "where it comes from" stops.
        
        origin_trips = {}
        for st in origin_st_list:
            if st["tripId"] not in origin_trips or st["stopSequence"] < origin_trips[st["tripId"]]["stopSequence"]:
                origin_trips[st["tripId"]] = st
                
        dest_trips = {}
        for st in dest_st_list:
            if st["tripId"] not in dest_trips or st["stopSequence"] > dest_trips[st["tripId"]]["stopSequence"]:
                dest_trips[st["tripId"]] = st

        # To avoid massive DB queries in Python memory, we limit exploration.
        # This is a simplified O(N) memory approach for a small GTFS dataset like Goa.
        orig_trip_ids = list(origin_trips.keys())[:100] 
        dest_trip_ids = list(dest_trips.keys())[:100]
        
        # Get all downstream stops for origin trips
        downstream_st = list(stop_times_col.find({"tripId": {"$in": orig_trip_ids}}))
        # Get all upstream stops for dest trips
        upstream_st = list(stop_times_col.find({"tripId": {"$in": dest_trip_ids}}))
        
        # Build map of StopID -> List of Trips that visit it (and at what sequence/time)
        transfer_candidates_orig = {}
        for st in downstream_st:
            tid = st["tripId"]
            if st["stopSequence"] > origin_trips[tid]["stopSequence"]:
                if st["stopId"] not in transfer_candidates_orig:
                    transfer_candidates_orig[st["stopId"]] = []
                transfer_candidates_orig[st["stopId"]].append(st)
                
        transfer_candidates_dest = {}
        for st in upstream_st:
            tid = st["tripId"]
            if st["stopSequence"] < dest_trips[tid]["stopSequence"]:
                if st["stopId"] not in transfer_candidates_dest:
                    transfer_candidates_dest[st["stopId"]] = []
                transfer_candidates_dest[st["stopId"]].append(st)
                
        common_transfer_stops = set(transfer_candidates_orig.keys()).intersection(transfer_candidates_dest.keys())
        
        # Preload active trips and routes for faster lookup
        active_trip_cache = {}
        
        transfer_journeys = []
        for transfer_stop_id in list(common_transfer_stops)[:10]: # Limit to avoid combinatorial explosion
            for leg1_st in transfer_candidates_orig[transfer_stop_id]:
                tid1 = leg1_st["tripId"]
                orig_st = origin_trips[tid1]
                
                # Check Trip 1 Active
                if tid1 not in active_trip_cache:
                    trip1 = trips_col.find_one({"tripId": tid1})
                    active_trip_cache[tid1] = trip1 if (trip1 and is_service_active(trip1["serviceId"], target_date)) else None
                if not active_trip_cache[tid1]: continue
                
                dep1_dt = gtfs_time_to_datetime(target_date, orig_st["departureTime"])
                if dep1_dt < dt_time: continue
                arr1_dt = gtfs_time_to_datetime(target_date, leg1_st["arrivalTime"])
                if arr1_dt < dep1_dt:
                    arr1_dt += datetime.timedelta(days=1)
                
                for leg2_st in transfer_candidates_dest[transfer_stop_id]:
                    tid2 = leg2_st["tripId"]
                    if tid1 == tid2: continue # Direct, already handled
                    dest_st = dest_trips[tid2]
                    
                    dep2_dt = gtfs_time_to_datetime(target_date, leg2_st["departureTime"])
                    # Transfer must allow at least 2 minutes, max 60 mins
                    wait_time = (dep2_dt - arr1_dt).total_seconds() / 60
                    if wait_time < 2 or wait_time > 60:
                        continue
                        
                    # Check Trip 2 Active
                    if tid2 not in active_trip_cache:
                        trip2 = trips_col.find_one({"tripId": tid2})
                        active_trip_cache[tid2] = trip2 if (trip2 and is_service_active(trip2["serviceId"], target_date)) else None
                    if not active_trip_cache[tid2]: continue
                    
                    arr2_dt = gtfs_time_to_datetime(target_date, dest_st["arrivalTime"])
                    if arr2_dt < dep2_dt:
                        arr2_dt += datetime.timedelta(days=1)
                    
                    # Found a valid transfer!
                    start_stop = next(s for s in origin_stops if s["stopId"] == orig_st["stopId"])
                    end_stop = next(s for s in dest_stops if s["stopId"] == dest_st["stopId"])
                    transfer_stop = stops_col.find_one({"stopId": transfer_stop_id})
                    
                    first_mile = get_walking_route(origin['lat'], origin['lng'], start_stop['latitude'], start_stop['longitude'])
                    last_mile = get_walking_route(end_stop['latitude'], end_stop['longitude'], destination['lat'], destination['lng'])
                    
                    trip1 = active_trip_cache[tid1]
                    trip2 = active_trip_cache[tid2]
                    
                    is_live1, is_live2 = False, False
                    if live_buses:
                        for b_id, state in live_buses.items():
                            cid = state.get("current", {}).get("trip_id")
                            if cid == tid1: is_live1 = True
                            if cid == tid2: is_live2 = True
                            
                    total_dur = first_mile["durationMinutes"] + int((arr2_dt - dep1_dt).total_seconds() / 60) + last_mile["durationMinutes"]
                    
                    journey = {
                        "journeyId": f"tx-{tid1}-{transfer_stop_id}-{tid2}",
                        "type": "TRANSFER",
                        "totalDurationMinutes": total_dur,
                        "departureTime": (dep1_dt - datetime.timedelta(minutes=first_mile["durationMinutes"])).strftime("%I:%M %p"),
                        "arrivalTime": (arr2_dt + datetime.timedelta(minutes=last_mile["durationMinutes"])).strftime("%I:%M %p"),
                        "isLive": is_live1 or is_live2,
                        "legs": [
                            {
                                "type": "WALK",
                                "from": "Origin",
                                "to": start_stop["name"],
                                "durationMinutes": first_mile["durationMinutes"],
                                "distanceMeters": first_mile["distanceMeters"],
                                "path": first_mile["path"],
                                "icon": "🚶"
                            },
                            {
                                "type": "BUS",
                                "routeId": trip1["routeId"],
                                "routeNumber": _get_route_number(trip1["routeId"]),
                                "routeName": trip1.get("headsign"),
                                "tripId": tid1,
                                "from": start_stop["name"],
                                "to": transfer_stop["name"],
                                "scheduledDeparture": dep1_dt.strftime("%I:%M %p"),
                                "scheduledArrival": arr1_dt.strftime("%I:%M %p"),
                                "isLive": is_live1,
                                "icon": "🚌"
                            },
                            {
                                "type": "TRANSFER",
                                "from": transfer_stop["name"],
                                "to": transfer_stop["name"],
                                "durationMinutes": int(wait_time),
                                "icon": "🔄"
                            },
                            {
                                "type": "BUS",
                                "routeId": trip2["routeId"],
                                "routeNumber": _get_route_number(trip2["routeId"]),
                                "routeName": trip2.get("headsign"),
                                "tripId": tid2,
                                "from": transfer_stop["name"],
                                "to": end_stop["name"],
                                "scheduledDeparture": dep2_dt.strftime("%I:%M %p"),
                                "scheduledArrival": arr2_dt.strftime("%I:%M %p"),
                                "isLive": is_live2,
                                "icon": "🚌"
                            },
                            {
                                "type": "WALK",
                                "from": end_stop["name"],
                                "to": "Destination",
                                "durationMinutes": last_mile["durationMinutes"],
                                "distanceMeters": last_mile["distanceMeters"],
                                "path": last_mile["path"],
                                "icon": "🚶"
                            }
                        ]
                    }
                    transfer_journeys.append(journey)
                    
        journeys.extend(transfer_journeys)

    if not journeys:
        return {"success": False, "reason": "NO_JOURNEY_FOUND"}
        
    journeys.sort(key=lambda j: datetime.datetime.strptime(j["legs"][1]["scheduledDeparture"], "%I:%M %p"))
    return {"success": True, "journeys": journeys[:10]}
