import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/busmitra")
client = MongoClient(MONGO_URI)
db = client.get_database()

# Collections
users_col = db.users
buses_col = db.buses
routes_col = db.routes
stops_col = db.stops
trips_col = db.trips
stop_times_col = db.stopTimes
service_calendars_col = db.serviceCalendars
telemetry_col = db.telemetry

def init_db():
    """Create indexes for the MongoDB collections."""
    # Users
    users_col.create_index("username", unique=True)
    
    # Buses
    buses_col.create_index("registrationNumber", unique=True)
    
    # Routes
    routes_col.create_index("routeId", unique=True)
    
    # Stops
    stops_col.create_index("stopId", unique=True)
    stops_col.create_index([("location", "2dsphere")])
    
    # Trips
    trips_col.create_index("tripId", unique=True, sparse=True)
    trips_col.create_index("routeId")
    trips_col.create_index("serviceId")
    trips_col.create_index([("busId", 1), ("status", 1)])
    trips_col.create_index("startTime")
    
    # Stop Times
    stop_times_col.create_index([("tripId", 1), ("stopSequence", 1)])
    stop_times_col.create_index("stopId")
    stop_times_col.create_index("tripId")
    
    # Service Calendars
    service_calendars_col.create_index("serviceId", unique=True)

    # Telemetry
    telemetry_col.create_index("tripId")
    telemetry_col.create_index("timestamp")

if __name__ == "__main__":
    init_db()
    print("MongoDB initialized and indexes created.")
