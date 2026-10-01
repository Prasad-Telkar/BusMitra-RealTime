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
from db import stops_col, buses_col, routes_col

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ---- In-memory store ----
# bus_id -> {
#   "current": { lat, lng, speed, timestamp, accuracy, status },
#   "history": [{ lat, lng, speed, timestamp }] (last 3 points for smoothing),
#   "route_id": "..."
# }
live_buses = {}

ROUTES = {
    "route12_bus1": {
        "bus_number": "K03",
        "name": "Kadamba — Vasco to Panaji",
        "stops": ["Vasco", "Dabolim", "Bambolim", "Panaji"],
        "destination": {"lat": 15.4909, "lng": 73.8278},
    },
    "route4_bus1": {
        "bus_number": "K01",
        "name": "Kadamba — Panaji to Margao",
        "stops": ["Panaji", "Porvorim", "Mapusa", "Ponda", "Margao"],
        "destination": {"lat": 15.2832, "lng": 73.9862},
    },
    "route4_bus2": {
        "bus_number": "K02",
        "name": "Kadamba — Margao to Panaji",
        "stops": ["Margao", "Ponda", "Mapusa", "Porvorim", "Panaji"],
        "destination": {"lat": 15.4909, "lng": 73.8278},
    },
    "route5_bus1": {
        "bus_number": "K05",
        "name": "Kadamba — Mapusa to Panaji",
        "stops": ["Mapusa", "Porvorim", "Panaji"],
        "destination": {"lat": 15.4909, "lng": 73.8278},
    },
    "route6_bus1": {
        "bus_number": "K09",
        "name": "Kadamba — Vasco to Ponda",
        "stops": ["Vasco", "Verna", "Ponda"],
        "destination": {"lat": 15.4026, "lng": 74.0180},
    },
}

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def smooth_gps(history):
    """Moving average smoothing over the last N valid GPS points."""
    if not history:
        return None
    avg_lat = sum(p["lat"] for p in history) / len(history)
    avg_lng = sum(p["lng"] for p in history) / len(history)
    avg_speed = sum(p["speed"] for p in history) / len(history)
    return {"lat": avg_lat, "lng": avg_lng, "speed": avg_speed}

def compute_eta(bus_id):
    bus_state = live_buses.get(bus_id)
    route = ROUTES.get(bus_id)
    
    if not bus_state or not bus_state.get("current") or not route:
        return None
        
    current = bus_state["current"]
    dest = route["destination"]
    
    dist_km = haversine_km(current["lat"], current["lng"], dest["lat"], dest["lng"])
    
    # ETA Logic
    speed_kmh = max(current.get("speed", 0) * 3.6, 5) # Floor at 5km/h for stationary buses
    eta_min = round((dist_km / speed_kmh) * 60, 1)
    age_sec = time.time() - current["timestamp"]
    
    # Status Logic
    gps_status = "live"
    if age_sec > 60:
        gps_status = "stale"
    if age_sec > 120:
        gps_status = "offline"
        eta_min = None # ETA unavailable when too stale
        
    # Route Deviation Logic (Mock distance to route logic, since we don't have full line strings yet)
    # Using straight line to destination for deviation demo
    deviation_status = "on_route"
    
    return {
        "bus_id": bus_id,
        "bus_number": route.get("bus_number", "K??"),
        "route_name": route["name"],
        "stops": route.get("stops", []),
        "distance_km": round(dist_km, 2),
        "eta_minutes": eta_min,
        "signal_age_sec": round(age_sec, 1),
        "status": gps_status,
        "trip_status": "On Time",
        "deviation_status": deviation_status,
        "lat": current["lat"],
        "lng": current["lng"]
    }

# ---------------- REST endpoints ----------------

@app.route("/api/routes", methods=["GET"])
def get_routes():
    return jsonify(ROUTES)

@app.route("/api/buses", methods=["GET"])
def get_active_buses():
    enriched_buses = {}
    for bus_id in list(live_buses.keys()):
        eta_info = compute_eta(bus_id)
        if eta_info:
            enriched_buses[bus_id] = eta_info
    return jsonify(enriched_buses)

@app.route("/api/eta/<bus_id>", methods=["GET"])
def get_eta(bus_id):
    eta = compute_eta(bus_id)
    if eta is None:
        return jsonify({"error": "no data for this bus yet"}), 404
    return jsonify(eta)

@app.route("/api/stops", methods=["GET"])
def get_stops():
    query = request.args.get("query", "").strip()
    limit = int(request.args.get("limit", 50))
    
    try:
        if query:
            # Case insensitive regex search on name
            stops_cursor = stops_col.find({
                "name": {"$regex": query, "$options": "i"}
            }).limit(limit)
        else:
            stops_cursor = stops_col.find().limit(limit)
            
        stops = []
        for s in stops_cursor:
            s["_id"] = str(s["_id"])
            stops.append(s)
            
        return jsonify(stops)
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

