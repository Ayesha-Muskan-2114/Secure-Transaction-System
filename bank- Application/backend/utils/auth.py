import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Load environment variables
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

security = HTTPBearer()

# ==========================
# PIN HASHING & VERIFICATION
# ==========================
def hash_pin(pin: str) -> str:
    """Hash a 4-digit PIN using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pin.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_pin(pin: str, hashed_pin: str) -> bool:
    """Verify a PIN against a hashed PIN"""
    return bcrypt.checkpw(pin.encode("utf-8"), hashed_pin.encode("utf-8"))

# ==========================
# JWT TOKEN FUNCTIONS
# ==========================
def create_jwt_token(user: dict) -> str:
    """Create a JWT token containing user ID and account"""
    payload = {
        "user_id": user.get("id"),
        "account_number": user.get("account_number"),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_jwt_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==========================
# DEPENDENCY TO GET CURRENT USER
# ==========================
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """FastAPI dependency to get current user from token"""
    token = credentials.credentials
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return {
        "user_id": payload.get("user_id"),
        "account_number": payload.get("account_number")
    }
