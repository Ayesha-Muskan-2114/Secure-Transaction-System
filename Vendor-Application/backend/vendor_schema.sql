-- Vendor Portal Database Schema for ABC Secure Bank (db2)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile VARCHAR(15) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    branch VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Vendor transactions
CREATE TABLE vendor_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_id VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    customer_phone VARCHAR(15),
    transaction_type VARCHAR(50) NOT NULL, -- deposit, transfer, facepay, upi, netbanking
    amount DECIMAL(15, 2) NOT NULL,
    sender_account VARCHAR(20),
    receiver_account VARCHAR(20),
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    payment_method VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Payment sessions (for FacePay flow)
CREATE TABLE payment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    customer_phone VARCHAR(15),
    status VARCHAR(50) DEFAULT 'initiated', -- initiated, amount_confirmed, phone_verified, face_verified, pin_verified, completed, failed
    face_match_score DECIMAL(5, 4),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Vendor blocks (blockchain)
CREATE TABLE vendor_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    index INTEGER UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
    previous_hash VARCHAR(64) NOT NULL,
    merkle_root VARCHAR(64) NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vendor block transactions
CREATE TABLE vendor_block_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID REFERENCES vendor_blocks(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES vendor_transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(block_id, transaction_id)
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_block_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all (development mode)
CREATE POLICY "Allow all" ON vendors FOR ALL USING (true);
CREATE POLICY "Allow all" ON vendor_transactions FOR ALL USING (true);
CREATE POLICY "Allow all" ON payment_sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON vendor_blocks FOR ALL USING (true);
CREATE POLICY "Allow all" ON vendor_block_transactions FOR ALL USING (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_vendors_mobile ON vendors(mobile);
CREATE INDEX idx_vendors_account ON vendors(account_number);
CREATE INDEX idx_vendor_tx_vendor ON vendor_transactions(vendor_id);
CREATE INDEX idx_payment_sessions_vendor ON payment_sessions(vendor_id);
CREATE INDEX idx_payment_sessions_session ON payment_sessions(session_id);