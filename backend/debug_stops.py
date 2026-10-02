from routing_engine import get_nearby_stops

ponda = {'lat': 15.4061479568481, 'lng': 73.9972686767578}
farma = {'lat': 15.4131002426147, 'lng': 73.9887008666992}

ponda_stops = get_nearby_stops(ponda['lat'], ponda['lng'], 1500, 3)
farma_stops = get_nearby_stops(farma['lat'], farma['lng'], 1500, 3)

print("Ponda:")
for s in ponda_stops: print(s)

print("\nFarma:")
for s in farma_stops: print(s)
