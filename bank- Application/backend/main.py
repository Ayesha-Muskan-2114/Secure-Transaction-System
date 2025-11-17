# main.py
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Utils
from utils.supabase_client import get_supabase_client
from utils.auth import hash_pin, verify_pin, create_jwt_token, get_current_user

# Modules
from modules.blockchain import Blockchain
from modules.encryption import FaceEmbeddingEncryption
from modules.face_recognition import get_face_recognition
from modules.encryption2 import PinRSAEncryptor
from utils.email_service import send_transaction_emails



load_dotenv()

app = FastAPI(title="ABC Secure Bank API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Services ---
supabase = get_supabase_client()
blockchain = Blockchain(supabase)
encryptor = FaceEmbeddingEncryption(os.getenv("AES_KEY_BASE64"))
face_recognition = get_face_recognition()
rsa_encryptor = PinRSAEncryptor()

# ===== Pydantic Models =====
class RegisterRequest(BaseModel):
    mobile: str
    pin: str
    name: str
    account_number: str
    branch: str
    email:str
    initial_balance: Optional[float] = 10000.0

class LoginRequest(BaseModel):
    mobile: str
    pin: str

class TransferRequest(BaseModel):
    receiver_account: str
    amount: float
    remarks: Optional[str] = ""

class FacePayRegisterRequest(BaseModel):
    image_base64: str
    facepay_limit: float = 5000.0
    pin: str

class FacePayPaymentRequest(BaseModel):
    image_base64: str
    receiver_account: str
    amount: float
    pin: str
    remarks: Optional[str] = "FacePay Transfer"

# ===== Base Routes =====
@app.get("/")
async def root():
    return {"message": "ABC Secure Bank API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ===== AUTH =====
@app.post("/api/auth/register")
async def register(data: RegisterRequest):
    if not data.pin.isdigit() or len(data.pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    hashed_pin = hash_pin(data.pin)
    user_data = {
        "mobile": data.mobile,
        "pin_hash": hashed_pin,
        "name": data.name,
        "account_number": data.account_number,
        "branch": data.branch,
        "email":data.email,
        "balance": data.initial_balance,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat()
    }
    result = supabase.table("users").insert(user_data).execute()
    if result.data:
        user = result.data[0]
        token = create_jwt_token(user)
        return {"success": True, "token": token, "user": user}
    raise HTTPException(status_code=500, detail="Failed to create user")

@app.post("/api/auth/login")
async def login(data: LoginRequest):
    result = supabase.table("users").select("*").eq("mobile", data.mobile).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid mobile or PIN")
    user = result.data[0]
    if not verify_pin(data.pin, user["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile or PIN")
    supabase.table("users").update({"last_login": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()
    token = create_jwt_token(user)
    return {"success": True, "token": token, "user": user}

# ===== USER DASHBOARD =====
@app.get("/api/user/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_res = supabase.table("users").select("*").eq("id", current_user["user_id"]).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_res.data[0]
    tx_res = supabase.table("transactions").select("*").or_(
        f"sender_account.eq.{user['account_number']},receiver_account.eq.{user['account_number']}"
    ).order("timestamp", desc=True).limit(5).execute()
    return {"user": user, "recent_transactions": tx_res.data or []}

@app.get("/api/user/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    result = supabase.table("users").select("balance").eq("id", current_user["user_id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"balance": float(result.data[0]["balance"])}

# ===== TRANSFER =====
@app.post("/api/transfer")
async def transfer(data: TransferRequest, current_user: dict = Depends(get_current_user)):
    sender_acc = current_user["account_number"]

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    sender_res = supabase.table("users").select("*").eq("account_number", sender_acc).single().execute()
    receiver_res = supabase.table("users").select("*").eq("account_number", data.receiver_account).single().execute()

    if not receiver_res.data:
        raise HTTPException(status_code=404, detail="Receiver not found")

    sender = sender_res.data
    receiver = receiver_res.data

    sender_balance = float(sender["balance"])
    if sender_balance < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Update balances
    new_sender_balance = sender_balance - data.amount
    new_receiver_balance = float(receiver["balance"]) + data.amount

    supabase.table("users").update({"balance": new_sender_balance}).eq("account_number", sender_acc).execute()
    supabase.table("users").update({"balance": new_receiver_balance}).eq("account_number", data.receiver_account).execute()

    # Create transaction record
    tx_id = f"TX{uuid.uuid4().hex[:12].upper()}"
    tx_data = {
        "tx_id": tx_id,
        "sender_account": sender_acc,
        "receiver_account": data.receiver_account,
        "amount": data.amount,
        "remarks": data.remarks,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "completed",
    }
    supabase.table("transactions").insert(tx_data).execute()

    # Blockchain append (optional)
    try:
        block = blockchain.create_block([tx_data])
        blockchain.save_block(block)
    except Exception as e:
        print("Blockchain warning:", e)

    # ✅ Send transaction emails to both parties
    try:
        send_transaction_emails(
            sender_email=sender["email"],
            receiver_email=receiver["email"],
            transaction_id=tx_id,
            amount=data.amount,
            sender_balance=new_sender_balance,
            receiver_balance=new_receiver_balance,
            status="SUCCESS"
        )
    except Exception as e:
        print("Email send error:", e)

    return {"success": True, "transaction_id": tx_id, "new_balance": new_sender_balance}

# ===== FACEPAY =====
@app.post("/api/facepay/register")
async def register_facepay(data: FacePayRegisterRequest, current_user: dict = Depends(get_current_user)):
    if not data.pin.isdigit() or len(data.pin) != 6:
        raise HTTPException(status_code=400, detail="PIN must be 6 digits")
    encrypted_pin = rsa_encryptor.encrypt_pin(data.pin)
    embedding = face_recognition.generate_embedding(data.image_base64)
    encrypted_embedding = encryptor.encrypt_embedding(embedding)
    existing = supabase.table("face_data").select("*").eq("user_id", current_user["user_id"]).execute()
    if existing.data:
        supabase.table("face_data").update({
            "encrypted_embedding": encrypted_embedding,
            "facepay_limit": data.facepay_limit,
            "encrypted_pin": encrypted_pin,
            "is_active": True
        }).eq("user_id", current_user["user_id"]).execute()
    else:
        supabase.table("face_data").insert({
            "user_id": current_user["user_id"],
            "encrypted_embedding": encrypted_embedding,
            "facepay_limit": data.facepay_limit,
            "encrypted_pin": encrypted_pin,
            "is_active": True
        }).execute()
    return {"success": True, "facepay_limit": data.facepay_limit}

@app.post("/api/facepay/verify-and-pay")
async def facepay_payment(data: FacePayPaymentRequest, current_user: dict = Depends(get_current_user)):
    face_data_res = supabase.table("face_data").select("*").eq("user_id", current_user["user_id"]).eq("is_active", True).execute()
    if not face_data_res.data:
        raise HTTPException(status_code=403, detail="FacePay disabled — please re-register")
    face_data = face_data_res.data[0]
    stored_pin = rsa_encryptor.decrypt_pin(face_data["encrypted_pin"])
    if data.pin != stored_pin:
        raise HTTPException(status_code=401, detail="Invalid FacePay PIN")
    decrypted_embedding = encryptor.decrypt_embedding(face_data["encrypted_embedding"])
    is_match, similarity = face_recognition.verify_face(data.image_base64, decrypted_embedding, threshold=0.65)
    if not is_match:
        raise HTTPException(status_code=401, detail=f"Face verification failed ({similarity:.2f})")
    if data.amount > face_data["facepay_limit"]:
        raise HTTPException(status_code=403, detail="Amount exceeds FacePay limit")
    transfer_req = TransferRequest(
        receiver_account=data.receiver_account,
        amount=data.amount,
        remarks=data.remarks
    )
    return await transfer(transfer_req, current_user)

@app.get("/api/facepay/status")
async def facepay_status(current_user: dict = Depends(get_current_user)):
    res = supabase.table("face_data").select("*").eq("user_id", current_user["user_id"]).execute()
    if not res.data:
        return {"registered": False, "is_active": False, "facepay_limit": None, "pin_set": False}
    record = res.data[0]
    return {
        "registered": True,
        "is_active": record.get("is_active", False),
        "facepay_limit": record.get("facepay_limit"),
        "pin_set": record.get("encrypted_pin") is not None
    }

@app.post("/api/facepay/toggle")
async def toggle_facepay(status: bool = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    res = supabase.table("face_data").select("*").eq("user_id", current_user["user_id"]).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="FacePay not registered")
    face_data = res.data
    if status is False:
        supabase.table("face_data").update({"is_active": False}).eq("user_id", current_user["user_id"]).execute()
        return {"success": True, "is_active": False, "message": "FacePay disabled."}
    if not face_data.get("encrypted_embedding") or not face_data.get("encrypted_pin"):
        raise HTTPException(status_code=400, detail="FacePay registration incomplete. Please register again.")
    supabase.table("face_data").update({"is_active": True}).eq("user_id", current_user["user_id"]).execute()
    return {"success": True, "is_active": True, "message": "FacePay enabled."}

# ===== TRANSACTIONS =====

@app.get("/api/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    try:
        user_account = current_user["account_number"]
        tx_res = supabase.table("transactions").select("*") \
            .or_(f"sender_account.eq.{user_account},receiver_account.eq.{user_account}") \
            .order("timestamp", desc=True).execute()
        transactions = tx_res.data if tx_res.data else []
        transactions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return {"transactions": transactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))