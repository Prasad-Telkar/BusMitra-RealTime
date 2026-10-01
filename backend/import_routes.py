import pdfplumber
import re
from db import db

def import_ktcl_routes():
    pdf_path = "../data/Routes-2026.pdf"
    
    extracted_routes = []
    
    # Regex to match leading number and the rest of the string
    # e.g. "1 Ponda to GMC Bambolim via Mardol"
    route_pattern = re.compile(r'^\s*(\d+)\s+(.+?)\s*$')
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue
                
            lines = text.split('\n')
            for line in lines:
                match = route_pattern.match(line)
                if match:
                    route_number_str = match.group(1)
                    route_name = match.group(2)
                    
                    route_number = int(route_number_str)
                    
                    extracted_routes.append({
                        "routeId": f"KTCL-{route_number}",
                        "routeNumber": route_number,
                        "routeName": route_name,
                        "source": "KTCL Routes 2026",
                        "sourceFile": "Routes-2026.pdf",
                        "active": True
                    })
    
    print(f"Extracted {len(extracted_routes)} routes from PDF.")
    
    # Check max route number extracted
    if extracted_routes:
        print(f"Max route number extracted: {max(r['routeNumber'] for r in extracted_routes)}")
        print(f"Min route number extracted: {min(r['routeNumber'] for r in extracted_routes)}")
    
    # Upsert into database
    collection = db.routes
    
    from pymongo import UpdateOne
    
    requests = []
    for r in extracted_routes:
        filter_query = {
            "routeNumber": r["routeNumber"],
            "source": r["source"]
        }
        update_query = {
            "$set": r
        }
        requests.append(UpdateOne(filter_query, update_query, upsert=True))
        
    result = collection.bulk_write(requests)
            
    print(f"Import complete! Upserted: {result.upserted_count}, Modified: {result.modified_count}, Matched: {result.matched_count}")

if __name__ == '__main__':
    import_ktcl_routes()
