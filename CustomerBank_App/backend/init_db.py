"""
Initialize Supabase database schema for ABC Secure Bank
Run this script to create the necessary tables
"""
from supabase import create_client, Client

SUPABASE_URL = "https://fxivvquwvxpokwrijyaj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aXZ2cXV3dnhwb2t3cmlqeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDYxOTEsImV4cCI6MjA3NjcyMjE5MX0.aTjZsljPjXwRtCnOogjBBNuR2JS2jj2aa5hJhMnA5QA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL commands to create tables
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(15) UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    branch VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
"""

CREATE_FACE_DATA_TABLE = """
CREATE TABLE IF NOT EXISTS face_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_embedding TEXT NOT NULL,
    payment_limit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
"""

CREATE_TRANSACTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    sender_account VARCHAR(20) NOT NULL,
    receiver_account VARCHAR(20) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);
"""

def init_database():
    """Initialize database schema"""
    print("🚀 Initializing ABC Secure Bank Database...")
    print(f"📡 Connected to Supabase: {SUPABASE_URL}")
    
    try:
        # Execute SQL commands using Supabase REST API
        # Note: These tables should be created via Supabase Dashboard SQL Editor
        print("\n⚠️  IMPORTANT: Please create the following tables in Supabase Dashboard SQL Editor:")
        print("\n" + "="*80)
        print("1️⃣  USERS TABLE:")
        print("="*80)
        print(CREATE_USERS_TABLE)
        print("\n" + "="*80)
        print("2️⃣  FACE_DATA TABLE:")
        print("="*80)
        print(CREATE_FACE_DATA_TABLE)
        print("\n" + "="*80)
        print("3️⃣  TRANSACTIONS TABLE:")
        print("="*80)
        print(CREATE_TRANSACTIONS_TABLE)
        print("\n" + "="*80)
        
        # Try to query tables to check if they exist
        print("\n🔍 Checking existing tables...")
        
        try:
            users = supabase.table("users").select("count", count="exact").limit(0).execute()
            print("✅ users table exists")
        except:
            print("❌ users table not found - please create it")
        
        try:
            face_data = supabase.table("face_data").select("count", count="exact").limit(0).execute()
            print("✅ face_data table exists")
        except:
            print("❌ face_data table not found - please create it")
        
        try:
            transactions = supabase.table("transactions").select("count", count="exact").limit(0).execute()
            print("✅ transactions table exists")
        except:
            print("❌ transactions table not found - please create it")
        
        print("\n✨ Database check complete!")
        print("\n📝 To create tables:")
        print("1. Go to Supabase Dashboard: https://app.supabase.com")
        print("2. Select your project: fxivvquwvxpokwrijyaj")
        print("3. Go to SQL Editor")
        print("4. Copy and paste the SQL commands above")
        print("5. Run each command")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    init_database()
