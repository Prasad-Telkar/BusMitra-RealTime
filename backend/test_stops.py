import os
import sys
sys.path.insert(0, ".")
from app import get_route_counts_for_stops
from db import stops_col

print("Getting stops...")
stops_list = list(stops_col.find({"name": {"$regex": "Ponda", "$options": "i"}}).limit(10))
print(f"Found {len(stops_list)} stops")

stop_ids = [s.get("stopId") or str(s.get("_id")) for s in stops_list]
print("stop_ids:", stop_ids)

counts = get_route_counts_for_stops(stop_ids)
print("counts:", counts)
