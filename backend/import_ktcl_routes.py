import fitz
import sys
import re
from pymongo import MongoClient

def import_routes():
    pdf_path = "../data/Routes-2026.pdf"
    
    print(f"Reading {pdf_path}...")
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    # Extract all text, keeping lines
    lines = []
    for page in doc:
        page_text = page.get_text()
        lines.extend(page_text.split('\n'))
    
    # Clean up lines
    lines = [l.strip() for l in lines if l.strip()]
    
    routes = []
    
    # Find start of table
    start_idx = -1
    for i, line in enumerate(lines):
        if line.lower() == "route" and lines[i-1].lower() == "sr.no.":
            start_idx = i + 1
            break
            
    if start_idx == -1:
        # Fallback to finding the first number '1'
        for i, line in enumerate(lines):
            if line == "1" and "ponda" in lines[i+1].lower():
                start_idx = i
                break

    print(f"Found table start at line index {start_idx}")
    
    # Process lines: expecting number, then route name
    i = start_idx
    expected_num = 1
    
    while i < len(lines):
        line = lines[i]
        
        # Check if line is the expected number
        try:
            num = int(line)
            if num == expected_num:
                # The next line should be the route name
                if i + 1 < len(lines):
                    route_name = lines[i + 1]
                    
                    # Ensure the route name isn't a number
                    if not route_name.isdigit():
                        routes.append({
                            "routeNumber": num,
                            "routeName": route_name,
                            "source": "KTCL Routes 2026",
                            "sourceFile": "Routes-2026.pdf",
                            "active": True,
                            # Add GTFS compatibility fields
                            "routeId": f"KTCL-2026-{num}",
                            "shortName": str(num),
                            "longName": route_name
                        })
                        expected_num += 1
                        i += 2  # Skip the number and the route name
                        continue
        except ValueError:
            pass
        
        i += 1
    
    print(f"Extracted {len(routes)} routes.")
    if routes:
        print("First 3 routes:")
        for r in routes[:3]:
            print(r)
        print("Last 3 routes:")
        for r in routes[-3:]:
            print(r)

    # Insert into MongoDB
    from dotenv import load_dotenv
    import os
    
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    
    client = MongoClient(mongo_uri)
    db = client["busmitra"]
    routes_col = db["routes"]
    
    # Upsert routes
    print("Saving to MongoDB...")
    count = 0
    for r in routes:
        routes_col.update_one(
            {"routeId": r["routeId"]},
            {"$set": r},
            upsert=True
        )
        count += 1
        
    print(f"Successfully saved {count} routes to MongoDB.")

if __name__ == "__main__":
    import_routes()
