import requests
try:
    stops = requests.get("http://127.0.0.1:5001/api/search/stops?q=ponda").json()
    origin_id = stops[0]['stopId']
    stops2 = requests.get("http://127.0.0.1:5001/api/search/stops?q=panaji").json()
    dest_id = stops2[0]['stopId']
    
    url = f"http://127.0.0.1:5001/api/fare/calculate?originStopId={origin_id}&destinationStopId={dest_id}&passengerCategory=STUDENT"
    resp = requests.get(url)
    print("PANAJI:", resp.json())
except Exception as e:
    print(e)
