from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
import numpy as np
import cv2
from deepface import DeepFace
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import os
from supabase import create_client, Client
import json
from datetime import datetime
import io
from PIL import Image
import hashlib

# Initialize FastAPI app
app = FastAPI(title="ABC Secure Bank API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
SUPABASE_URL = "https://fxivvquwvxpokwrijyaj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aXZ2cXV3dnhwb2t3cmlqeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDYxOTEsImV4cCI6MjA3NjcyMjE5MX0.aTjZsljPjXwRtCnOogjBBNuR2JS2jj2aa5hJhMnA5QA"
AES_KEY = base64.b64decode("KP68t0sw+DQzn6NF9ujk7mMuGju8EzXDwodTXLz+gvg=")
JWT_SECRET = "F1vdUUN3Xl0xqqyhLsn65PDIpLmPuG1pwPF2fOSOzJTSiuCT+dacaaiYHvNhRUSXf3xtjW/wZz8cyDMg3P81ng=="

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Simple password hashing functions
def hash_pin(pin: str) -> str:
    """Hash PIN using SHA256"""
    return hashlib.sha256(pin.encode()).hexdigest()

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify PIN"""
    return hash_pin(plain_pin) == hashed_pin

# Models
class UserRegistration(BaseModel):
    mobile: str
    pin: str
    name: str
    account_number: str
    branch: str
    initial_balance: float = 10000.0

class UserLogin(BaseModel):
    mobile: str
    pin: str

class FaceRegistration(BaseModel):
    user_id: str
    image_base64: str
    payment_limit: float

class FaceVerification(BaseModel):
    user_id: str
    image_base64: str

class TransferRequest(BaseModel):
    from_account: str
    to_account: str
    amount: float
    remarks: Optional[str] = ""

# Helper Functions
def encrypt_embedding(embedding: np.ndarray) -> str:
    """Encrypt face embedding using AES-256"""
    # Convert numpy array to bytes
    embedding_bytes = embedding.tobytes()
    
    # Pad the data
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(embedding_bytes) + padder.finalize()
    
    # Generate random IV
    iv = os.urandom(16)
    
    # Encrypt
    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    
    # Combine IV and encrypted data, then base64 encode
    combined = iv + encrypted_data
    return base64.b64encode(combined).decode('utf-8')

def decrypt_embedding(encrypted_str: str) -> np.ndarray:
    """Decrypt face embedding"""
    # Decode base64
    combined = base64.b64decode(encrypted_str)
    
    # Split IV and encrypted data
    iv = combined[:16]
    encrypted_data = combined[16:]
    
    # Decrypt
    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
    
    # Unpad
    unpadder = padding.PKCS7(128).unpadder()
    embedding_bytes = unpadder.update(padded_data) + unpadder.finalize()
    
    # Convert back to numpy array
    embedding = np.frombuffer(embedding_bytes, dtype=np.float64)
    return embedding

def base64_to_image(base64_str: str) -> np.ndarray:
    """Convert base64 string to OpenCV image"""
    # Remove data URL prefix if present
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    # Decode base64
    img_bytes = base64.b64decode(base64_str)
    
    # Convert to numpy array
    nparr = np.frombuffer(img_bytes, np.uint8)
    
    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    return img

def extract_face_embedding(image: np.ndarray) -> np.ndarray:
    """Extract face embedding using DeepFace"""
    try:
        # DeepFace expects RGB image
        if len(image.shape) == 3 and image.shape[2] == 3:
            # OpenCV loads as BGR, convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
        
        # Extract embedding using VGG-Face model
        embedding_objs = DeepFace.represent(
            img_path=image_rgb,
            model_name="VGG-Face",
            enforce_detection=True,
            detector_backend="opencv"
        )
        
        # Get the embedding vector
        embedding = np.array(embedding_objs[0]["embedding"])
        
        return embedding
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face detection failed: {str(e)}")

def calculate_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate cosine similarity between two embeddings"""
    # Normalize embeddings
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    # Calculate cosine similarity
    similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
    
    return float(similarity)

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "ABC Secure Bank API",
        "version": "1.0.0",
        "features": ["User Management", "FacePay", "Transactions"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# User Registration
@app.post("/api/users/register")
async def register_user(user: UserRegistration):
    try:
        # Hash PIN
        hashed_pin = hash_pin(user.pin)
        
        # Check if user already exists
        existing = supabase.table("users").select("*").eq("mobile", user.mobile).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="User with this mobile number already exists")
        
        # Check if account number already exists
        existing_account = supabase.table("users").select("*").eq("account_number", user.account_number).execute()
        if existing_account.data:
            raise HTTPException(status_code=400, detail="Account number already exists")
        
        # Insert user
        result = supabase.table("users").insert({
            "mobile": user.mobile,
            "pin_hash": hashed_pin,
            "name": user.name,
            "account_number": user.account_number,
            "branch": user.branch,
            "balance": user.initial_balance,
            "created_at": datetime.now().isoformat()
        }).execute()
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": result.data[0]["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User Login
@app.post("/api/users/login")
async def login_user(credentials: UserLogin):
    try:
        # Get user by mobile
        result = supabase.table("users").select("*").eq("mobile", credentials.mobile).execute()
        
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = result.data[0]
        
        # Verify PIN
        if not verify_pin(credentials.pin, user["pin_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        supabase.table("users").update({
            "last_login": datetime.now().isoformat()
        }).eq("id", user["id"]).execute()
        
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "mobile": user["mobile"],
                "account_number": user["account_number"],
                "branch": user["branch"],
                "balance": user["balance"],
                "last_login": datetime.now().isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get User by Account Number
@app.get("/api/users/account/{account_number}")
async def get_user_by_account(account_number: str):
    try:
        result = supabase.table("users").select("id,name,account_number,branch,balance").eq("account_number", account_number).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Account not found")
        
        return {
            "success": True,
            "user": result.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FacePay Registration
@app.post("/api/face/register")
async def register_face(data: FaceRegistration):
    try:
        # Convert base64 to image
        image = base64_to_image(data.image_base64)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Extract face embedding
        embedding = extract_face_embedding(image)
        
        # Encrypt embedding
        encrypted_embedding = encrypt_embedding(embedding)
        
        # Check if user already has face registered
        existing = supabase.table("face_data").select("*").eq("user_id", data.user_id).execute()
        
        if existing.data:
            # Update existing record
            result = supabase.table("face_data").update({
                "encrypted_embedding": encrypted_embedding,
                "payment_limit": data.payment_limit,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", data.user_id).execute()
        else:
            # Insert new record
            result = supabase.table("face_data").insert({
                "user_id": data.user_id,
                "encrypted_embedding": encrypted_embedding,
                "payment_limit": data.payment_limit,
                "created_at": datetime.now().isoformat()
            }).execute()
        
        return {
            "success": True,
            "message": "Face registered successfully for FacePay",
            "payment_limit": data.payment_limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face registration failed: {str(e)}")

# FacePay Verification
@app.post("/api/face/verify")
async def verify_face(data: FaceVerification):
    try:
        # Get stored face data
        result = supabase.table("face_data").select("*").eq("user_id", data.user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="No face registered for this user")
        
        stored_data = result.data[0]
        
        # Convert base64 to image
        image = base64_to_image(data.image_base64)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Extract face embedding from provided image
        current_embedding = extract_face_embedding(image)
        
        # Decrypt stored embedding
        stored_embedding = decrypt_embedding(stored_data["encrypted_embedding"])
        
        # Calculate similarity
        similarity = calculate_similarity(stored_embedding, current_embedding)
        
        # Threshold for matching
        SIMILARITY_THRESHOLD = 0.65
        
        is_match = similarity >= SIMILARITY_THRESHOLD
        
        return {
            "success": True,
            "is_match": is_match,
            "confidence": round(similarity, 4),
            "threshold": SIMILARITY_THRESHOLD,
            "payment_limit": stored_data["payment_limit"],
            "message": "Face verified successfully" if is_match else "Face verification failed"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {str(e)}")

# Check if user has FacePay registered
@app.get("/api/face/status/{user_id}")
async def get_facepay_status(user_id: str):
    try:
        result = supabase.table("face_data").select("payment_limit,created_at").eq("user_id", user_id).execute()
        
        if not result.data:
            return {
                "success": True,
                "registered": False,
                "message": "FacePay not registered"
            }
        
        return {
            "success": True,
            "registered": True,
            "payment_limit": result.data[0]["payment_limit"],
            "registered_at": result.data[0]["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fund Transfer
@app.post("/api/transactions/transfer")
async def transfer_funds(transfer: TransferRequest):
    try:
        # Get sender account
        sender = supabase.table("users").select("*").eq("account_number", transfer.from_account).execute()
        if not sender.data:
            raise HTTPException(status_code=404, detail="Sender account not found")
        
        sender_data = sender.data[0]
        
        # Get receiver account
        receiver = supabase.table("users").select("*").eq("account_number", transfer.to_account).execute()
        if not receiver.data:
            raise HTTPException(status_code=404, detail="Receiver account not found")
        
        receiver_data = receiver.data[0]
        
        # Check balance
        if sender_data["balance"] < transfer.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        if transfer.amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid transfer amount")
        
        # Update balances
        new_sender_balance = sender_data["balance"] - transfer.amount
        new_receiver_balance = receiver_data["balance"] + transfer.amount
        
        supabase.table("users").update({"balance": new_sender_balance}).eq("id", sender_data["id"]).execute()
        supabase.table("users").update({"balance": new_receiver_balance}).eq("id", receiver_data["id"]).execute()
        
        # Record transaction
        transaction = supabase.table("transactions").insert({
            "sender_id": sender_data["id"],
            "receiver_id": receiver_data["id"],
            "sender_account": transfer.from_account,
            "receiver_account": transfer.to_account,
            "amount": transfer.amount,
            "remarks": transfer.remarks,
            "status": "completed",
            "created_at": datetime.now().isoformat()
        }).execute()
        
        return {
            "success": True,
            "message": "Transfer completed successfully",
            "transaction_id": transaction.data[0]["id"],
            "new_balance": new_sender_balance
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get Transaction History
@app.get("/api/transactions/history/{account_number}")
async def get_transaction_history(account_number: str):
    try:
        # Get user
        user = supabase.table("users").select("id").eq("account_number", account_number).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="Account not found")
        
        user_id = user.data[0]["id"]
        
        # Get transactions where user is sender or receiver
        transactions = supabase.table("transactions").select("*").or_(
            f"sender_id.eq.{user_id},receiver_id.eq.{user_id}"
        ).order("created_at", desc=True).execute()
        
        return {
            "success": True,
            "transactions": transactions.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
