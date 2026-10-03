import requests
import time
import sys

# Ponda and Farmagudi stop IDs in production might be dynamic based on the database, so we search first
while True:
    try:
        stops = requests.get("https://busmitra-goa.onrender.com/api/search/stops?q=ponda").json()
        origin_id = stops[0]['stopId']
        stops2 = requests.get("https://busmitra-goa.onrender.com/api/search/stops?q=farmagudi").json()
        dest_id = stops2[0]['stopId']
        
        url = f"https://busmitra-goa.onrender.com/api/fare/calculate?originStopId={origin_id}&destinationStopId={dest_id}&passengerCategory=STUDENT"
        resp = requests.get(url).json()
        
        if resp.get('studentFare') == 5.0 and resp.get('seniorFare') == 5.0:
            print("SUCCESS! Render backend updated.")
            print(resp)
            sys.exit(0)
        else:
            print("Waiting for deployment... current response:", resp)
    except Exception as e:
        print("Error:", e)
    
    time.sleep(10)
