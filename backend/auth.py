
import os
import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import users_col

auth_bp = Blueprint("auth", __name__)
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-busmitra-key")

def token_required(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if "Authorization" in request.headers:
                parts = request.headers["Authorization"].split()
                if len(parts) == 2 and parts[0] == "Bearer":
                    token = parts[1]
            
            if not token:
                return jsonify({"error": "Token is missing"}), 401
                
            try:
                data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                current_user = users_col.find_one({"_id": data["user_id"]})
                if not current_user:
                    return jsonify({"error": "Invalid user"}), 401
                    
                if roles and current_user.get("role") not in roles:
                    return jsonify({"error": "Unauthorized role"}), 403
                    
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
                
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
        
    user = users_col.find_one({"username": data["username"]})
    
    if not user or not check_password_hash(user["passwordHash"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
        
    token = jwt.encode({
        "user_id": str(user["_id"]),
        "role": user.get("role", "driver"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "token": token,
        "role": user.get("role"),
        "username": user.get("username")
    })

# Seed script helper for testing
def seed_admin_and_driver():
    if not users_col.find_one({"username": "ADMIN-KTC-001"}):
        users_col.insert_one({
            "username": "ADMIN-KTC-001",
            "passwordHash": generate_password_hash("ktc@2024"),
            "role": "admin"
        })
    if not users_col.find_one({"username": "KTC-DRV-1042"}):
        users_col.insert_one({
            "username": "KTC-DRV-1042",
            "passwordHash": generate_password_hash("1234"),
            "role": "driver"
        })

if __name__ == "__main__":
    seed_admin_and_driver()
    print("Seed users created.")
