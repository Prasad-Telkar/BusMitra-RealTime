import math

def calculate_stage_carriage_fare(distance_km, fare_rules, passenger_type):
    """
    fare_rules: list of dicts from db.fareRules
    passenger_type: string (e.g. 'General', 'Student', 'Senior Citizen')
    """
    fare = 0.0
    
    if distance_km <= 3:
        fare = 10.0
    elif distance_km <= 8:
        fare = 15.0
    else:
        # Every additional 8 km or part thereof = +₹5
        fare = 15.0 + math.ceil((distance_km - 8) / 8.0) * 5.0

    return fare

def apply_concession(base_fare, passenger_type, concessions):
    """
    concessions: list of dicts from db.concessions
    """
    if passenger_type == "General":
        return base_fare
        
    for c in concessions:
        # 'category' might be 'Student', 'Senior Citizen', etc.
        # Match case-insensitively just in case
        if c.get("category", "").lower() == passenger_type.lower():
            discount_pct = c.get("discount_percentage")
            if discount_pct is not None:
                # E.g. 50% discount -> base_fare * 0.5
                discount = float(discount_pct) / 100.0
                return base_fare * (1.0 - discount)
            
            # If there's a flat rate or full free pass
            if c.get("description", "").lower().startswith("free"):
                return 0.0

    return base_fare

def calculate_fare(origin_name, dest_name, distance_km, passenger_type, db):
    """
    1. Check if fixed fare exists for (origin, dest)
    2. Otherwise, calculate stage carriage fare based on distance
    3. Apply concessions based on passenger_type
    """
    fixed_fares = list(db.fixedFares.find({
        "origin": origin_name,
        "destination": dest_name
    }))
    
    # Check reverse direction if needed, but fixed fares are usually bi-directional in the DB
    if not fixed_fares:
        fixed_fares = list(db.fixedFares.find({
            "origin": dest_name,
            "destination": origin_name
        }))

    fare_rules = list(db.fareRules.find())
    concessions = list(db.concessions.find())

    if fixed_fares:
        # Just take the first regular one for now, or match bus_type if available
        # Assuming Regular service
        base_fare = float(fixed_fares[0].get("amount", 0.0))
        is_fixed = True
    else:
        base_fare = calculate_stage_carriage_fare(distance_km, fare_rules, passenger_type)
        is_fixed = False

    final_fare = apply_concession(base_fare, passenger_type, concessions)
    
    return {
        "baseFare": base_fare,
        "finalFare": final_fare,
        "isFixedFare": is_fixed,
        "currency": "INR"
    }
