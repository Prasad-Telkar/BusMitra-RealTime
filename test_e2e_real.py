import requests
import time

BASE_URL = "http://127.0.0.1:5001/api"

print("1. Login as driver...")
login_res = requests.post(f"{BASE_URL}/auth/login", json={"username": "KTC-DRV-1042", "password": "1234"})
if not login_res.ok:
    print("Login failed!", login_res.text)
    exit(1)
token = login_res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login success.")

print("2. Get upcoming trips...")
# Wait, /api/driver/upcoming-trips is not protected by auth in app.py currently?
trips_res = requests.get(f"{BASE_URL}/driver/upcoming-trips")
trips = trips_res.json()
if not trips:
    print("No trips found.")
    exit(1)
trip_id = trips[0]["tripId"]
route_id = trips[0]["routeId"]
print(f"Got trip {trip_id} on route {route_id}")

print("3. Start trip...")
start_res = requests.post(f"{BASE_URL}/driver/trip/start", json={
    "driverId": "KTC-DRV-1042",
    "tripId": trip_id,
    "routeId": route_id,
    "busId": "GA-03-X-1111"
})
active_trip_id = start_res.json().get("activeTripId")
print(f"Started trip. Active ID: {active_trip_id}")

print("4. Check admin fleet...")
fleet_res = requests.get(f"{BASE_URL}/admin/fleet")
fleet = fleet_res.json()["fleet"]
print(f"Fleet count: {len(fleet)}")
if len(fleet) == 0:
    print("Bus not in fleet!")
    exit(1)

print("5. End trip...")
requests.post(f"{BASE_URL}/driver/trip/end", json={"activeTripId": active_trip_id})

print("6. Check admin fleet again...")
fleet_res = requests.get(f"{BASE_URL}/admin/fleet")
fleet = fleet_res.json()["fleet"]
print(f"Fleet count: {len(fleet)}")
if len(fleet) > 0:
    print("Bus still in fleet!")
    exit(1)

print("ALL PASSED!")
