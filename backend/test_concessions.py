import sys
import os

from dotenv import load_dotenv
load_dotenv('.env')

from pymongo import MongoClient

mongo_uri = os.getenv("MONGO_URI") or os.getenv("VITE_MONGODB_URI")
if not mongo_uri:
    print("NO MONGO_URI")
    sys.exit(1)

try:
    client = MongoClient(mongo_uri)
    db = client.busmitra
    
    concessions = list(db.concessions.find({}))
    print("CONCESSIONS:", concessions)
    
except Exception as e:
    print("ERROR:", e)
