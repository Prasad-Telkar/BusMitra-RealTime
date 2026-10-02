import datetime
import math
import requests
from db import stops_col, trips_col, stop_times_col, service_calendars_col, routes_col

import time

OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/foot"
OSRM_CIRCUIT_BREAKER = 0

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
        
    global OSRM_CIRCUIT_BREAKER
    if time.time() < OSRM_CIRCUIT_BREAKER:
        # Circuit breaker open, skip OSRM to prevent cascading timeouts
        pass
    else:
        try:
            url = f"{OSRM_BASE_URL}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?geometries=geojson"
            res = requests.get(url, timeout=2) # Reduced timeout to 2s to fail fast
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
            elif res.status_code == 429:
                OSRM_CIRCUIT_BREAKER = time.time() + 30 # Back off for 30 seconds on rate limit
        except Exception as e:
            print(f"OSRM error: {e}")
            OSRM_CIRCUIT_BREAKER = time.time() + 10 # Back off for 10 seconds on timeout/error
    
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

def is_service_active(service_id, target_date, prefetched_cal=None):
    """Check if a GTFS service is active on the given date (datetime.date)."""
    if prefetched_cal is not None:
        cal = prefetched_cal
    else:
        cal = service_calendars_col.find_one({"serviceId": service_id})
    if not cal:
        return False
    
    start_str = cal["calendar"].get("startDate")
    end_str = cal["calendar"].get("endDate")
    
    if start_str and end_str:
        try:
            start_date = datetime.datetime.strptime(start_str, "%Y%m%d").date()
            end_date = datetime.datetime.strptime(end_str, "%Y%m%d").date()
            # Do NOT return False if target_date > end_date. 
            # We want to use the expired schedule data as long as the day of the week matches.
            # Only reject if target_date is BEFORE the start_date.
            if target_date < start_date:
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

def _get_route_number(route_id, prefetched_route=None):
    if prefetched_route is not None:
        route = prefetched_route
    else:
        route = routes_col.find_one({"routeId": route_id})
    if route:
        return route.get("routeNumber") or route.get("shortName") or "BUS"
    return "BUS"

import sys
def _log_time(msg):
    with open("routing_time.log", "a") as f:
        f.write(f"[{datetime.datetime.now().time()}] {msg}\n")

def plan_transit_journey(origin, destination, dt_time=None, live_buses=None):
    import time
    import sys
    t0 = time.time()
    def _log_time(msg):
        print(f"[TIME {time.time()-t0:.2f}s] {msg}", file=sys.stderr, flush=True)
    _log_time("Start plan_transit_journey")
    if dt_time is None:
        dt_time = datetime.datetime.now()
        
    target_date = dt_time.date()
    
    origin_stops = get_nearby_stops(origin['lat'], origin['lng'], 1500, 3)
    dest_stops = get_nearby_stops(destination['lat'], destination['lng'], 1500, 3)
    
    if not origin_stops or not dest_stops:
        return {"success": False, "reason": "NO_STOPS_NEARBY"}
        
    # Check if target date exceeds global GTFS expiry to set a freshness warning
    is_expired = False
    latest_cal = service_calendars_col.find_one(sort=[('calendar.endDate', -1)])
    if latest_cal:
        max_end_date_str = latest_cal['calendar']['endDate']
        try:
            max_end_date = datetime.datetime.strptime(max_end_date_str, "%Y%m%d").date()
            if target_date > max_end_date:
                is_expired = True
        except:
            pass
        
    origin_stop_ids = [s["stopId"] for s in origin_stops]
    dest_stop_ids = [s["stopId"] for s in dest_stops]
    
    # Stage 1: Find direct trips
    origin_st_list = list(stop_times_col.find({"stopId": {"$in": origin_stop_ids}}))
    dest_st_list = list(stop_times_col.find({"stopId": {"$in": dest_stop_ids}}))
    _log_time("Fetched trips")
    
    trips_origin = {}
    for st in origin_st_list:
        # We want the EARLIEST origin stop to maximize chances of finding a valid destination stop
        if st["tripId"] not in trips_origin or st["stopSequence"] < trips_origin[st["tripId"]]["stopSequence"]:
            trips_origin[st["tripId"]] = st
            
    trips_dest = {}
    for st in dest_st_list:
        # We want the LATEST destination stop
        if st["tripId"] not in trips_dest or st["stopSequence"] > trips_dest[st["tripId"]]["stopSequence"]:
            trips_dest[st["tripId"]] = st
    _log_time(f"Found {len(trips_origin)} orig trips, {len(trips_dest)} dest trips")
    
    # BATCH FETCH TO PREVENT N+1 LATENCY
    all_needed_trip_ids = list(trips_origin.keys()) + list(trips_dest.keys())
    all_prefetched_trips = {t["tripId"]: t for t in trips_col.find({"tripId": {"$in": all_needed_trip_ids}})}
    _log_time(f"Prefetched {len(all_prefetched_trips)} trips")
    
    all_service_ids = list(set([t["serviceId"] for t in all_prefetched_trips.values()]))
    all_prefetched_cals = {c["serviceId"]: c for c in service_calendars_col.find({"serviceId": {"$in": all_service_ids}})}
    
    all_route_ids = list(set([t["routeId"] for t in all_prefetched_trips.values()]))
    all_prefetched_routes = {r["routeId"]: r for r in routes_col.find({"routeId": {"$in": all_route_ids}})}
    _log_time("Prefetched calendars and routes")
    
    walking_cache = {}
    
    # Pre-calculate walking routes for relevant origin and destination stops
    for s in origin_stops:
        key = (origin['lat'], origin['lng'], s['latitude'], s['longitude'])
        if key not in walking_cache:
            walking_cache[key] = get_walking_route(origin['lat'], origin['lng'], s['latitude'], s['longitude'])
            
    for s in dest_stops:
        key = (s['latitude'], s['longitude'], destination['lat'], destination['lng'])
        if key not in walking_cache:
            walking_cache[key] = get_walking_route(s['latitude'], s['longitude'], destination['lat'], destination['lng'])
            
    def get_cached_walking_route(orig_lat, orig_lng, dst_lat, dst_lng):
        key = (orig_lat, orig_lng, dst_lat, dst_lng)
        # Fallback to direct calculation if not pre-cached (should be rare)
        if key not in walking_cache:
            walking_cache[key] = get_walking_route(orig_lat, orig_lng, dst_lat, dst_lng)
        return walking_cache[key]
        
    common_trip_ids = set(trips_origin.keys()).intersection(trips_dest.keys())
    _log_time(f"Walking cache ready. common_trips={len(common_trip_ids)}")
    journeys = []
    
    for trip_id in common_trip_ids:
        orig_st = trips_origin[trip_id]
        dest_st = trips_dest[trip_id]
        
        if orig_st["stopSequence"] >= dest_st["stopSequence"]:
            continue
            
        trip = all_prefetched_trips.get(trip_id)
        if not trip: continue
        cal = all_prefetched_cals.get(trip["serviceId"])
        if not is_service_active(trip["serviceId"], target_date, prefetched_cal=cal): continue
            
        departure_dt = gtfs_time_to_datetime(target_date, orig_st["departureTime"])
        if departure_dt < dt_time: continue
            
        arrival_dt = gtfs_time_to_datetime(target_date, dest_st["arrivalTime"])
        if arrival_dt < departure_dt:
            arrival_dt += datetime.timedelta(days=1)
        
        start_stop = next(s for s in origin_stops if s["stopId"] == orig_st["stopId"])
        end_stop = next(s for s in dest_stops if s["stopId"] == dest_st["stopId"])
        
        first_mile = get_cached_walking_route(origin['lat'], origin['lng'], start_stop['latitude'], start_stop['longitude'])
        last_mile = get_cached_walking_route(end_stop['latitude'], end_stop['longitude'], destination['lat'], destination['lng'])
        
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
                    "routeNumber": _get_route_number(trip["routeId"], prefetched_route=all_prefetched_routes.get(trip["routeId"])),
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
        
    _log_time("Direct routes done. Starting transfers...")
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
        orig_trip_ids = list(origin_trips.keys())[:20] 
        dest_trip_ids = list(dest_trips.keys())[:20]
        
        _log_time(f"Stage 2 orig_trip_ids: {len(orig_trip_ids)}, dest_trip_ids: {len(dest_trip_ids)}")
        # Get all downstream stops for origin trips
        downstream_st = list(stop_times_col.find({"tripId": {"$in": orig_trip_ids}}))
        # Get all upstream stops for dest trips
        upstream_st = list(stop_times_col.find({"tripId": {"$in": dest_trip_ids}}))
        _log_time(f"Stage 2 downstream_st: {len(downstream_st)}, upstream_st: {len(upstream_st)}")
        
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
        _log_time(f"Stage 2 common_transfer_stops: {len(common_transfer_stops)}")
        
        # Preload active trips and routes for faster lookup
        active_trip_cache = {}
        all_transfer_stops_cache = {s["stopId"]: s for s in stops_col.find({"stopId": {"$in": list(common_transfer_stops)[:10]}})}
        
        transfer_journeys = []
        for transfer_stop_id in list(common_transfer_stops)[:10]: # Limit to avoid combinatorial explosion
            for leg1_st in transfer_candidates_orig[transfer_stop_id]:
                tid1 = leg1_st["tripId"]
                orig_st = origin_trips[tid1]
                
                # Check Trip 1 Active
                trip1 = all_prefetched_trips.get(tid1)
                if not trip1: continue
                cal1 = all_prefetched_cals.get(trip1["serviceId"])
                if not is_service_active(trip1["serviceId"], target_date, prefetched_cal=cal1): continue
                
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
                    trip2 = all_prefetched_trips.get(tid2)
                    if not trip2: continue
                    cal2 = all_prefetched_cals.get(trip2["serviceId"])
                    if not is_service_active(trip2["serviceId"], target_date, prefetched_cal=cal2): continue
                    
                    arr2_dt = gtfs_time_to_datetime(target_date, dest_st["arrivalTime"])
                    if arr2_dt < dep2_dt:
                        arr2_dt += datetime.timedelta(days=1)
                    
                    # Found a valid transfer!
                    start_stop = next(s for s in origin_stops if s["stopId"] == orig_st["stopId"])
                    end_stop = next(s for s in dest_stops if s["stopId"] == dest_st["stopId"])
                    # Use prefetched cache instead of N+1 query
                    transfer_stop = all_transfer_stops_cache.get(transfer_stop_id)
                    if not transfer_stop: continue
                    
                    first_mile = get_cached_walking_route(origin['lat'], origin['lng'], start_stop['latitude'], start_stop['longitude'])
                    last_mile = get_cached_walking_route(end_stop['latitude'], end_stop['longitude'], destination['lat'], destination['lng'])
                    
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
                                "routeNumber": _get_route_number(trip1["routeId"], prefetched_route=all_prefetched_routes.get(trip1["routeId"])),
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
                                "routeNumber": _get_route_number(trip2["routeId"], prefetched_route=all_prefetched_routes.get(trip2["routeId"])),
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
                    
        _log_time(f"Stage 2 loop complete. Found {len(transfer_journeys)} transfer journeys")
        journeys.extend(transfer_journeys)

    if not journeys:
        return {"success": False, "reason": "NO_JOURNEY_FOUND"}
        
    journeys.sort(key=lambda j: datetime.datetime.strptime(j["legs"][1]["scheduledDeparture"], "%I:%M %p"))
    return {
        "success": True, 
        "journeys": journeys[:10],
        "isScheduleExpired": is_expired,
        "message": "Schedule based on the latest available official data. Verify current timings with KTCL." if is_expired else None
    }
