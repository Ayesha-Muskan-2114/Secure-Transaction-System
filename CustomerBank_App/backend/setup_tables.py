"""
Automated table creation for ABC Secure Bank using Supabase RPC
"""
from supabase import create_client, Client
import requests

SUPABASE_URL = "https://fxivvquwvxpokwrijyaj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aXZ2cXV3dnhwb2t3cmlqeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDYxOTEsImV4cCI6MjA3NjcyMjE5MX0.aTjZsljPjXwRtCnOogjBBNuR2JS2jj2aa5hJhMnA5QA"

def create_tables_via_api():
    """Create tables using Supabase REST API"""
    
    # SQL for creating all tables
    sql_commands = """
-- Create users table
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

-- Create face_data table
CREATE TABLE IF NOT EXISTS face_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_embedding TEXT NOT NULL,
    payment_limit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create transactions table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_account ON users(account_number);
CREATE INDEX IF NOT EXISTS idx_face_data_user ON face_data(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
"""

    print("🚀 Creating database tables...")
    print("\n📋 SQL Commands to Execute:")
    print("="*80)
    print(sql_commands)
    print("="*80)
    
    # Try to execute via RPC endpoint
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("\n⚠️  Note: The Supabase anon key doesn't have permissions to create tables.")
    print("📝 Please manually execute the SQL above in Supabase Dashboard:")
    print("\n1. Go to: https://supabase.com/dashboard/project/fxivvquwvxpokwrijyaj/sql/new")
    print("2. Copy the SQL commands above")
    print("3. Paste and click 'Run'")
    print("\n✨ Or, if you have service_role key, update SUPABASE_KEY in this script")

if __name__ == "__main__":
    create_tables_via_api()
