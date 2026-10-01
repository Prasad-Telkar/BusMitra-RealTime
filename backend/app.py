"""
BusMitra Backend — Flask + Socket.IO
Handles:
  - Receiving real GPS pings from the driver's phone
  - Broadcasting live location to all passengers watching that bus
  - Computing a simple ETA (distance-to-destination / recent speed)
  - A /predict endpoint your CS teammates' delay model can slot into
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit
import time
import math
import collections
from db import stops_col, buses_col, routes_col, trips_col, stop_times_col, service_calendars_col
import json
from bson import ObjectId

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ---- In-memory store ----
live_buses = {}

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def smooth_gps(history):
    if not history:
        return None
    avg_lat = sum(p["lat"] for p in history) / len(history)
    avg_lng = sum(p["lng"] for p in history) / len(history)
    avg_speed = sum(p["speed"] for p in history) / len(history)
    return {"lat": avg_lat, "lng": avg_lng, "speed": avg_speed}

def compute_eta(bus_id):
    bus_state = live_buses.get(bus_id)
    if not bus_state or not bus_state.get("current"):
        return None
    # Live GPS blending will be added here in future tasks
    return None

def json_serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: json_serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_serialize(i) for i in obj]
    return obj

# ---------------- REST endpoints ----------------

@app.route("/api/routes", methods=["GET"])
def get_routes():
    limit = int(request.args.get("limit", 50))
    routes = list(routes_col.find({"active": True}).limit(limit))
    return jsonify(json_serialize(routes))

@app.route("/api/search/routes", methods=["GET"])
def search_routes():
    query = request.args.get("q", "").strip()
    from_query = request.args.get("from", "").strip()
    to_query = request.args.get("to", "").strip()
    limit = int(request.args.get("limit", 50))
    
    if query:
        # Simple regex search on shortName or longName
        import re
        routes = list(routes_col.find({
            "$or": [
                {"shortName": re.compile(query, re.IGNORECASE)},
                {"longName": re.compile(query, re.IGNORECASE)}
            ]
        }).limit(limit))
    elif from_query or to_query:
        # Search by from/to
        import re
        
        # Alias mapping for common places in Goa
        aliases = {
            "panjim": "panaji",
            "madgaon": "margao",
            "margoa": "margao",
            "mapuca": "mapusa",
            "vascodagama": "vasco"
        }
        
        def apply_aliases(q):
            if not q: return q
            q_lower = q.lower().strip()
            for k, v in aliases.items():
                if k in q_lower:
                    q_lower = q_lower.replace(k, v)
            return q_lower
            
        from_query = apply_aliases(from_query)
        to_query = apply_aliases(to_query)
        
        and_conditions = []
        if from_query:
            and_conditions.append({"longName": re.compile(from_query, re.IGNORECASE)})
        if to_query:
            and_conditions.append({"longName": re.compile(to_query, re.IGNORECASE)})
            
        print("QUERY COND:", and_conditions)
        routes = list(routes_col.find({"$and": and_conditions}).limit(limit))
        print("FOUND:", len(routes))
    else:
        return jsonify([])
        
    return jsonify(json_serialize(routes))

@app.route("/api/routes/<route_id>", methods=["GET"])
def get_route(route_id):
    route = routes_col.find_one({"routeId": route_id})
    if not route:
        return jsonify({"error": "Route not found"}), 404
    return jsonify(json_serialize(route))

@app.route("/api/routes/<route_id>/trips", methods=["GET"])
def get_route_trips(route_id):
    trips = list(trips_col.find({"routeId": route_id}))
    return jsonify(json_serialize(trips))

@app.route("/api/trips/<trip_id>", methods=["GET"])
def get_trip(trip_id):
    trip = trips_col.find_one({"tripId": trip_id})
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    return jsonify(json_serialize(trip))

@app.route("/api/trips/<trip_id>/stops", methods=["GET"])
def get_trip_stops(trip_id):
    # Get all stop times for the trip, sorted by sequence
    stop_times = list(stop_times_col.find({"tripId": trip_id}).sort("stopSequence", 1))
    
    # Fetch details for each stop
    stop_ids = [st["stopId"] for st in stop_times]
    stops_info = {str(s["stopId"]): s for s in stops_col.find({"stopId": {"$in": stop_ids}})}
    
    result = []
    for st in stop_times:
        s_id = str(st["stopId"])
        info = stops_info.get(s_id, {})
        
        result.append({
            "stopId": s_id,
            "stopName": info.get("name", "Unknown Stop"),
            "latitude": info.get("lat"),
            "longitude": info.get("lng"),
            "sequence": st["stopSequence"],
            "arrivalTime": st.get("arrivalTime"),
            "departureTime": st.get("departureTime")
        })
        
    return jsonify(json_serialize(result))

@app.route("/api/stops/<stop_id>/routes", methods=["GET"])
def get_stop_routes(stop_id):
    # 1. Find all trips that stop here
    stop_times = list(stop_times_col.find({"stopId": stop_id}))
    trip_ids = list(set(st["tripId"] for st in stop_times))
    
    # 2. Find those trips
    trips = list(trips_col.find({"tripId": {"$in": trip_ids}}))
    route_ids = list(set(t["routeId"] for t in trips))
    
    # 3. Return the routes
    routes = list(routes_col.find({"routeId": {"$in": route_ids}}))
    return jsonify(json_serialize(routes))

@app.route("/api/stops/<stop_id>/schedules", methods=["GET"])
def get_stop_schedules(stop_id):
    # Find all stop times for this stop
    stop_times = list(stop_times_col.find({"stopId": stop_id}).limit(100))
    trip_ids = [st["tripId"] for st in stop_times]
    
    # Find the corresponding trips
    trips = {str(t["tripId"]): t for t in trips_col.find({"tripId": {"$in": trip_ids}})}
    
    # Find the routes
    route_ids = list(set(t["routeId"] for t in trips.values()))
    routes = {str(r["routeId"]): r for r in routes_col.find({"routeId": {"$in": route_ids}})}
    
    services = []
    for st in stop_times:
        t_id = str(st["tripId"])
        trip = trips.get(t_id)
        if not trip: continue
        
        r_id = str(trip["routeId"])
        route = routes.get(r_id, {})
        
        services.append({
            "routeId": r_id,
            "routeName": route.get("shortName") or route.get("longName"),
            "tripId": t_id,
            "headsign": trip.get("headsign"),
            "arrivalTime": st.get("arrivalTime"),
            "departureTime": st.get("departureTime"),
            "serviceId": trip.get("serviceId")
        })
        
    # Sort by arrival time
    services.sort(key=lambda x: x["arrivalTime"] or "")
    
    return jsonify(json_serialize({
        "stopId": stop_id,
        "services": services
    }))

@app.route("/api/search/stops", methods=["GET"])
@app.route("/api/stops", methods=["GET"])
def get_stops():
    query = request.args.get("query", request.args.get("q", "")).strip()
    limit = int(request.args.get("limit", 50))
    
    try:
        if query:
            stops_cursor = stops_col.find({
                "name": {"$regex": query, "$options": "i"}
            }).limit(limit)
        else:
            stops_cursor = stops_col.find().limit(limit)
            
        return jsonify(json_serialize(list(stops_cursor)))
    except Exception as e:
        print("Database error in /api/stops:", e)
        return jsonify([]), 503

@app.route("/predict", methods=["POST"])
def predict_delay():
    # Placeholder for ML delay model
    data = request.get_json(force=True)
    bus_id = data.get("bus_id")
    elapsed = data.get("elapsed_minutes", 0)
    hour = data.get("hour_of_day", 12)

    peak_hours = {8, 9, 17, 18, 19}
    expected = 25 if hour in peak_hours else 18
    delay = elapsed - expected
    status = "delayed" if delay > expected * 0.15 else "on_time"

    return jsonify({
        "bus_id": bus_id,
        "status": status,
        "expected_minutes": expected,
        "delay_minutes": round(delay, 1),
        "model": "baseline-v0",
    })

# ---------------- Socket.IO (real-time GPS relay) ----------------

@socketio.on("driver_location")
def handle_driver_location(data):
    bus_id = data.get("bus_id")
    if not bus_id:
        return
        
    lat = data.get("lat")
    lng = data.get("lng")
    speed_ms = data.get("speed", 0) or 0 # m/s
    accuracy = data.get("accuracy", 10)
    timestamp = data.get("timestamp", time.time())
    
    # 1. Validation: Reject if accuracy > 10000m
    if accuracy > 10000:
        print(f"[{bus_id}] Rejected: Poor accuracy ({accuracy}m)")
        return
        
    # 2. Validation: Reject impossible speed (> 120km/h = 33.3 m/s)
    if speed_ms > 33.3:
        print(f"[{bus_id}] Rejected: Impossible speed ({speed_ms} m/s)")
        return
        
    if bus_id not in live_buses:
        live_buses[bus_id] = {"current": {}, "history": collections.deque(maxlen=3)}
        
    bus_state = live_buses[bus_id]
    
    # 3. Add to smoothing history
    bus_state["history"].append({"lat": lat, "lng": lng, "speed": speed_ms, "timestamp": timestamp})
    
    # 4. Compute Smoothed Position
    smoothed = smooth_gps(bus_state["history"])
    
    # 5. Update Current State
    bus_state["current"] = {
        "lat": smoothed["lat"],
        "lng": smoothed["lng"],
        "speed": smoothed["speed"],
        "timestamp": time.time(), # Time received by server
        "accuracy": accuracy
    }
    
    # Broadcast updated enriched state to passengers
    eta_info = compute_eta(bus_id)
    if eta_info:
        emit("bus_update", eta_info, room=bus_id, broadcast=True)

@socketio.on("driver_end_trip")
def handle_end_trip(data):
    bus_id = data.get("bus_id")
    if bus_id and bus_id in live_buses:
        print(f"[{bus_id}] Trip ended by driver.")
        del live_buses[bus_id]

@socketio.on("watch_bus")
def handle_watch_bus(data):
    bus_id = data.get("bus_id")
    if bus_id:
        join_room(bus_id)
        eta_info = compute_eta(bus_id)
        if eta_info:
            emit("bus_update", eta_info)

@app.route("/")
def health():
    return jsonify({"status": "BusMitra backend running", "active_buses": list(live_buses.keys())})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5001)) # Enforce 5001 to match frontend API_BASE
    socketio.run(app, host="0.0.0.0", port=port, debug=True, use_reloader=False)

