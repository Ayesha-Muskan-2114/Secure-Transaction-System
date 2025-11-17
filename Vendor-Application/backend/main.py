from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from supabase import create_client, Client
import random
from encryption import FaceEmbeddingEncryption
from encryption2 import PinRSAEncryptor
from face_recognition import get_face_recognition
from blockchain import Blockchain
from email_service import email_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase clients
SUPABASE_URL_1 = os.environ.get('SUPABASE_URL_1', 'https://placeholder.supabase.co')
SUPABASE_KEY_1 = os.environ.get('SUPABASE_KEY_1', 'placeholder_key')
SUPABASE_URL_2 = os.environ.get('SUPABASE_URL_2', 'https://placeholder.supabase.co')
SUPABASE_KEY_2 = os.environ.get('SUPABASE_KEY_2', 'placeholder_key')

# Check if real Supabase credentials are provided
MOCK_MODE = not SUPABASE_URL_1 or not SUPABASE_KEY_1 or not SUPABASE_URL_2 or not SUPABASE_KEY_2

if not MOCK_MODE:
    supabase_bank: Client = create_client(SUPABASE_URL_1, SUPABASE_KEY_1)
    supabase_vendor: Client = create_client(SUPABASE_URL_2, SUPABASE_KEY_2)
else:
    supabase_bank = None
    supabase_vendor = None
    logging.warning("⚠️  Running in MOCK MODE - Supabase credentials not configured")

# Initialize services (only if not in mock mode)
if not MOCK_MODE:
    try:
        aes_key = os.environ.get('AES_KEY_BASE64')
        face_encryptor = FaceEmbeddingEncryption(aes_key) if aes_key else None
        pin_encryptor = PinRSAEncryptor()
        # Face recognizer initialization is heavy, skip in mock mode
        face_recognizer = get_face_recognition()
        #face_recognizer = None
        blockchain = Blockchain(supabase_vendor, table_prefix="vendor_")
    except Exception as e:
        logging.warning(f"⚠️  Services initialization failed: {e}. Running in limited mode.")
        face_encryptor = None
        pin_encryptor = None
        face_recognizer = None
        blockchain = None
else:
    face_encryptor = None
    pin_encryptor = None
    face_recognizer = None
    blockchain = None

# JWT settings
SECRET_KEY = os.environ.get('SECRET_KEY_2', 'your-secret-key-vendor')
ALGORITHM = "HS256"

app = FastAPI(title="ABC Secure Bank Vendor Portal")
api_router = APIRouter(prefix="/api")

# Models
class VendorRegister(BaseModel):
    name: str
    mobile: str
    email: EmailStr
    account_number: str
    branch: str
    pin: str
    initial_balance: float = 0.0

class VendorLogin(BaseModel):
    mobile: str
    pin: str

class OTPVerify(BaseModel):
    mobile: str
    otp: str

class DepositRequest(BaseModel):
    amount: float

class TransferRequest(BaseModel):
    receiver_account: str
    amount: float
    remarks: Optional[str] = ""

class InitiateFacePayRequest(BaseModel):
    amount: float

class ConfirmAmountRequest(BaseModel):
    session_id: str
    confirmed: bool

class VerifyPhoneRequest(BaseModel):
    session_id: str
    customer_phone: str

class VerifyFaceRequest(BaseModel):
    session_id: str
    face_image: str
'''
class VerifyPinRequest(BaseModel):
    session_id: str
    encrypted_pin: str
'''
class VerifyPinRequest(BaseModel):
    session_id: str
    pin: str  
# Utility functions
def create_token(vendor_id: str) -> str:
    payload = {
        "vendor_id": vendor_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["vendor_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_tx_id() -> str:
    return f"VTX{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

@app.get("/")
def home():
    return {"status": "Vendor Backend is running successfully!"}

# Authentication routes
@api_router.post("/vendor/register")
async def register_vendor(data: VendorRegister):
    try:
        # Check if vendor exists
        result = supabase_vendor.table("vendors").select("*").eq("mobile", data.mobile).execute()
        if result.data:
            raise HTTPException(status_code=400, detail="Vendor already exists")
        
        result = supabase_vendor.table("vendors").select("*").eq("email", data.email).execute()
        if result.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash PIN
        pin_hash = bcrypt.hashpw(data.pin.encode(), bcrypt.gensalt()).decode()
        
        # Generate OTP
        otp = generate_otp()
        otp_expires = datetime.utcnow() + timedelta(minutes=10)
        
        # Create vendor
        vendor_data = {
            "name": data.name,
            "mobile": data.mobile,
            "email": data.email,
            "account_number": data.account_number,
            "branch": data.branch,
            "pin_hash": pin_hash,
            "balance": data.initial_balance,
            "is_verified": False,
            "otp_code": otp,
            "otp_expires_at": otp_expires.isoformat()
        }
        
        result = supabase_vendor.table("vendors").insert(vendor_data).execute()
        
        # Send OTP email
        email_service.send_otp(data.email, otp, data.name)
        
        return {"message": "Vendor registered successfully. Please verify OTP sent to your email.", "vendor_id": result.data[0]["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/verify-otp")
async def verify_otp(data: OTPVerify):
    try:
        result = supabase_vendor.table("vendors").select("*").eq("mobile", data.mobile).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        vendor = result.data[0]
        
        if vendor["is_verified"]:
            raise HTTPException(status_code=400, detail="Vendor already verified")
        
        if vendor["otp_code"] != data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        otp_expires = datetime.fromisoformat(vendor["otp_expires_at"])
        if datetime.utcnow() > otp_expires:
            raise HTTPException(status_code=400, detail="OTP expired")
        
        # Update vendor as verified
        supabase_vendor.table("vendors").update({"is_verified": True, "otp_code": None, "otp_expires_at": None}).eq("id", vendor["id"]).execute()
        
        token = create_token(vendor["id"])
        
        return {"message": "Vendor verified successfully", "token": token, "vendor": {"id": vendor["id"], "name": vendor["name"], "email": vendor["email"]}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/login")
async def login_vendor(data: VendorLogin):
    try:
        result = supabase_vendor.table("vendors").select("*").eq("mobile", data.mobile).execute()
        
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        vendor = result.data[0]
        
        if not vendor["is_verified"]:
            raise HTTPException(status_code=403, detail="Please verify your account first")
        
        if not bcrypt.checkpw(data.pin.encode(), vendor["pin_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        supabase_vendor.table("vendors").update({"last_login": datetime.utcnow().isoformat()}).eq("id", vendor["id"]).execute()
        
        token = create_token(vendor["id"])
        
        return {"message": "Login successful", "token": token, "vendor": {"id": vendor["id"], "name": vendor["name"], "email": vendor["email"], "account_number": vendor["account_number"]}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard routes
@api_router.get("/vendor/dashboard")
async def get_dashboard(vendor_id: str = Depends(verify_token)):
    try:
        result = supabase_vendor.table("vendors").select("*").eq("id", vendor_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        vendor = result.data[0]
        
        # Get recent transactions
        tx_result = supabase_vendor.table("vendor_transactions").select("*").eq("vendor_id", vendor_id).order("timestamp", desc=True).limit(10).execute()
        
        return {
            "vendor": {
                "id": vendor["id"],
                "name": vendor["name"],
                "email": vendor["email"],
                "mobile": vendor["mobile"],
                "account_number": vendor["account_number"],
                "branch": vendor["branch"],
                "balance": float(vendor["balance"])
            },
            "recent_transactions": tx_result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/deposit")
async def deposit(data: DepositRequest, vendor_id: str = Depends(verify_token)):
    try:
        result = supabase_vendor.table("vendors").select("*").eq("id", vendor_id).execute()
        vendor = result.data[0]
        
        new_balance = float(vendor["balance"]) + data.amount
        supabase_vendor.table("vendors").update({"balance": new_balance}).eq("id", vendor_id).execute()
        
        # Create transaction
        tx_data = {
            "tx_id": generate_tx_id(),
            "vendor_id": vendor_id,
            "transaction_type": "deposit",
            "amount": data.amount,
            "receiver_account": vendor["account_number"],
            "status": "completed"
        }
        supabase_vendor.table("vendor_transactions").insert(tx_data).execute()
        
        return {"message": "Deposit successful", "new_balance": new_balance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/transfer")
async def transfer(data: TransferRequest, vendor_id: str = Depends(verify_token)):
    try:
        result = supabase_vendor.table("vendors").select("*").eq("id", vendor_id).execute()
        vendor = result.data[0]
        
        if float(vendor["balance"]) < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        new_balance = float(vendor["balance"]) - data.amount
        supabase_vendor.table("vendors").update({"balance": new_balance}).eq("id", vendor_id).execute()
        
        # Create transaction
        tx_data = {
            "tx_id": generate_tx_id(),
            "vendor_id": vendor_id,
            "transaction_type": "transfer",
            "amount": data.amount,
            "sender_account": vendor["account_number"],
            "receiver_account": data.receiver_account,
            "remarks": data.remarks,
            "status": "completed"
        }
        supabase_vendor.table("vendor_transactions").insert(tx_data).execute()
        
        return {"message": "Transfer successful", "new_balance": new_balance}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendor/transactions")
async def get_transactions(vendor_id: str = Depends(verify_token)):
    try:
        result = supabase_vendor.table("vendor_transactions").select("*").eq("vendor_id", vendor_id).order("timestamp", desc=True).execute()
        return {"transactions": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FacePay routes
@api_router.post("/facepay/initiate")
async def initiate_facepay(data: InitiateFacePayRequest, vendor_id: str = Depends(verify_token)):
    try:
        session_id = f"FPS{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"
        
        session_data = {
            "session_id": session_id,
            "vendor_id": vendor_id,
            "amount": data.amount,
            "status": "initiated",
            "expires_at": (datetime.utcnow() + timedelta(minutes=15)).isoformat()
        }
        
        supabase_vendor.table("payment_sessions").insert(session_data).execute()
        
        return {"message": "FacePay session initiated", "session_id": session_id, "amount": data.amount}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/facepay/confirm-amount")
async def confirm_amount(data: ConfirmAmountRequest, vendor_id: str = Depends(verify_token)):
    try:
        result = supabase_vendor.table("payment_sessions").select("*").eq("session_id", data.session_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = result.data[0]
        
        if session["vendor_id"] != vendor_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        if not data.confirmed:
            return {"message": "Amount not confirmed. Please restart transaction.", "restart": True}
        
        supabase_vendor.table("payment_sessions").update({"status": "amount_confirmed"}).eq("session_id", data.session_id).execute()
        
        return {"message": "Amount confirmed", "next_step": "enter_phone"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/facepay/verify-phone")
async def verify_phone(data: VerifyPhoneRequest, vendor_id: str = Depends(verify_token)):
    try:
        # Get session
        session_result = supabase_vendor.table("payment_sessions").select("*").eq("session_id", data.session_id).execute()
        
        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_result.data[0]
        
        # Check customer exists in bank system
        customer_result = supabase_bank.table("users").select("*").eq("mobile", data.customer_phone).execute()
        
        if not customer_result.data:
            raise HTTPException(status_code=404, detail="Customer not found. Please use manual payment.")
        
        customer = customer_result.data[0]
        
        # Check if FacePay is enabled
        face_result = supabase_bank.table("face_data").select("*").eq("user_id", customer["id"]).execute()
        
        if not face_result.data or not face_result.data[0]["is_active"]:
            raise HTTPException(status_code=400, detail="FacePay not enabled for this customer. Please use manual payment.")
        
        # Update session
        supabase_vendor.table("payment_sessions").update({"customer_phone": data.customer_phone, "status": "phone_verified"}).eq("session_id", data.session_id).execute()
        
        return {"message": "Customer verified", "next_step": "capture_face", "customer_name": customer["name"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/facepay/verify-face")
async def verify_face(data: VerifyFaceRequest, vendor_id: str = Depends(verify_token)):
    try:
        print("⚡ VERIFY FACE STARTED")
        
        print("Incoming session_id:", data.session_id)
        print("Incoming image (first 100 chars):", str(data.face_image)[:100])

        # 1. Fetch session
        session_result = supabase_vendor.table("payment_sessions").select("*").eq("session_id", data.session_id).execute()
        print("Session result:", session_result.data)

        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_result.data[0]

        # 2. Phone check
        print("Session phone:", session["customer_phone"])
        if not session["customer_phone"]:
            raise HTTPException(status_code=400, detail="Phone not verified")

        # 3. Fetch customer
        customer_result = supabase_bank.table("users").select("*").eq("mobile", session["customer_phone"]).execute()
        print("Customer result:", customer_result.data)

        if not customer_result.data:
            raise HTTPException(status_code=404, detail="Customer not found")

        customer = customer_result.data[0]

        # 4. Fetch face data
        face_result = supabase_bank.table("face_data").select("*").eq("user_id", customer["id"]).execute()
        print("Face data result:", face_result.data)

        if not face_result.data:
            raise HTTPException(status_code=404, detail="Face data not found")

        face_data = face_result.data[0]
        
        print("Encrypted embedding length:", len(face_data["encrypted_embedding"]))

        # 5. Decrypt embedding
        try:
            stored_embedding = face_encryptor.decrypt_embedding(face_data["encrypted_embedding"])
            print("Decrypted embedding sample:", stored_embedding[:5])
        except Exception as e:
            print("❌ Embedding decrypt error:", str(e))
            raise HTTPException(status_code=500, detail="Embedding could not be decrypted")

        # 6. Verify face
        print("Running face recognition…")
        is_match, similarity = face_recognizer.verify_face(data.face_image, stored_embedding, threshold=0.55)

        print("Match:", is_match, "Similarity:", similarity)

        if not is_match:
            supabase_vendor.table("payment_sessions").update({
                "status": "face_verification_failed",
                "face_match_score": float(similarity)
            }).eq("session_id", data.session_id).execute()

            raise HTTPException(status_code=401, detail=f"Face not matched. Score={similarity}")

        # 7. Success
        supabase_vendor.table("payment_sessions").update({
            "status": "face_verified",
            "face_match_score": float(similarity)
        }).eq("session_id", data.session_id).execute()

        return {
            "message": "Face verified successfully",
            "similarity_score": float(similarity),
            "next_step": "enter_pin"
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Internal server error:", str(e))
        raise HTTPException(status_code=500, detail="Internal error: " + str(e))

@api_router.post("/facepay/verify-pin")
async def verify_pin(data: VerifyPinRequest, vendor_id: str = Depends(verify_token)):
    try:
        # Get session
        session_result = supabase_vendor.table("payment_sessions").select("*").eq("session_id", data.session_id).execute()
        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_result.data[0]
        if session["status"] != "face_verified":
            raise HTTPException(status_code=400, detail="Face not verified")
        
        # Get customer
        customer_result = supabase_bank.table("users").select("*").eq("mobile", session["customer_phone"]).execute()
        customer = customer_result.data[0]
        
        # Get encrypted PIN from face_data
        face_result = supabase_bank.table("face_data").select("*").eq("user_id", customer["id"]).execute()
        face_data = face_result.data[0]
        if not face_data.get("encrypted_pin"):
            raise HTTPException(status_code=400, detail="PIN not set for FacePay")
        
        # Decrypt stored PIN using server-side private key
        stored_pin = pin_encryptor.decrypt_pin(face_data["encrypted_pin"])
        
        # Compare entered PIN (plain) with decrypted stored PIN
        if stored_pin != data.pin:
            supabase_vendor.table("payment_sessions").update({"status": "pin_verification_failed"}).eq("session_id", data.session_id).execute()
            raise HTTPException(status_code=401, detail="Invalid PIN")
        
        # PIN is correct – proceed with transaction
        vendor_result = supabase_vendor.table("vendors").select("*").eq("id", vendor_id).execute()
        vendor = vendor_result.data[0]

        if float(customer["balance"]) < float(session["amount"]):
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # Update balances
        new_customer_balance = float(customer["balance"]) - float(session["amount"])
        new_vendor_balance = float(vendor["balance"]) + float(session["amount"])
        
        supabase_bank.table("users").update({"balance": new_customer_balance}).eq("id", customer["id"]).execute()
        supabase_vendor.table("vendors").update({"balance": new_vendor_balance}).eq("id", vendor_id).execute()
        
        # Generate transaction ID
        tx_id = generate_tx_id()
        
        # Create transaction in bank system
        bank_tx_data = {
            "tx_id": tx_id,
            "sender_account": customer["account_number"],
            "receiver_account": vendor["account_number"],
            "amount": float(session["amount"]),
            "remarks": f"FacePay to {vendor['name']}",
            "status": "completed"
        }
        supabase_bank.table("transactions").insert(bank_tx_data).execute()
        
        # Create transaction in vendor system
        vendor_tx_data = {
            "tx_id": tx_id,
            "vendor_id": vendor_id,
            "customer_phone": session["customer_phone"],
            "transaction_type": "facepay",
            "amount": float(session["amount"]),
            "sender_account": customer["account_number"],
            "receiver_account": vendor["account_number"],
            "payment_method": "FacePay",
            "status": "completed"
        }
        supabase_vendor.table("vendor_transactions").insert(vendor_tx_data).execute()
        
        # Update session status
        supabase_vendor.table("payment_sessions").update({"status": "completed"}).eq("session_id", data.session_id).execute()
        
        # Add to blockchain
        block = blockchain.create_block([vendor_tx_data])
        blockchain.save_block(block)
        
        # Send verification email
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        email_service.send_transaction_verification(
            customer["email"],
            vendor["name"],
            float(session["amount"]),
            tx_id,
            data.session_id,
            base_url
        )
        
        return {
            "message": "Payment successful",
            "transaction_id": tx_id,
            "amount": float(session["amount"]),
            "vendor_balance": new_vendor_balance,
            "customer_name": customer["name"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/facepay/disable-customer")
async def disable_facepay(session_id: str):
    """Called when customer reports 'Not Me' in email verification"""
    try:
        # Get session
        session_result = supabase_vendor.table("payment_sessions").select("*").eq("session_id", session_id).execute()
        
        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_result.data[0]
        
        if not session["customer_phone"]:
            raise HTTPException(status_code=400, detail="No customer associated with session")
        
        # Get customer
        customer_result = supabase_bank.table("users").select("*").eq("mobile", session["customer_phone"]).execute()
        
        if not customer_result.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer = customer_result.data[0]
        
        # Disable FacePay
        supabase_bank.table("face_data").update({"is_active": False}).eq("user_id", customer["id"]).execute()
        
        return {"message": "FacePay disabled successfully for customer security"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/verify-transaction")
async def verify_transaction(session: str, action: str):
    """Handle email verification clicks"""
    try:
        if action == "no":
            await disable_facepay(session)
            return JSONResponse(content={"message": "FacePay has been disabled for your security. Please contact your bank."})
        else:
            return JSONResponse(content={"message": "Thank you for confirming your transaction."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/")
async def root():
    return {
        "message": "ABC Secure Bank Vendor Portal API", 
        "status": "active",
        "mode": "mock" if MOCK_MODE else "production",
        "note": "Configure Supabase credentials in .env to enable full functionality" if MOCK_MODE else "All systems operational"
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)