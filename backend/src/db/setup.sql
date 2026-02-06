-- Alpha-2 Database Schema Setup
-- Run this in Supabase SQL Editor to create required tables

-- ============================================
-- Table: db3_signals
-- Stores raw RSS feed data and AI-extracted metadata
-- ============================================
CREATE TABLE IF NOT EXISTS db3_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                    -- 'consumercomplains.in' or 'reddit_r_indianconsumers'
  source_url TEXT,                         -- original post URL
  title TEXT,
  content TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI-extracted fields (populated by Agent 1)
  is_processed BOOLEAN DEFAULT FALSE,
  brand_name TEXT,
  product_category TEXT,
  issue_type TEXT,
  sentiment TEXT,                          -- 'positive', 'negative', 'neutral'
  contains_contact_info BOOLEAN DEFAULT FALSE,
  
  metadata JSONB                           -- additional flexible data
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_brand ON db3_signals(brand_name);
CREATE INDEX IF NOT EXISTS idx_signals_processed ON db3_signals(is_processed);
CREATE INDEX IF NOT EXISTS idx_signals_contacts ON db3_signals(contains_contact_info);
CREATE INDEX IF NOT EXISTS idx_signals_fetched ON db3_signals(fetched_at DESC);

-- ============================================
-- Table: db3_brand_contacts
-- Stores extracted brand contact information
-- ============================================
CREATE TABLE IF NOT EXISTS db3_brand_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  product_category TEXT,
  
  -- Contact details
  contact_type TEXT,                       -- 'phone', 'email', 'service_center', 'escalation', 'website'
  contact_value TEXT,                      -- actual phone/email/address/url
  city TEXT,
  state TEXT,
  
  -- Metadata
  extracted_from_signal_id UUID REFERENCES db3_signals(id),
  confidence_score DECIMAL(3,2),           -- 0.00 to 1.00
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_brand ON db3_brand_contacts(brand_name);
CREATE INDEX IF NOT EXISTS idx_contacts_location ON db3_brand_contacts(city, state);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON db3_brand_contacts(contact_type);

-- ============================================
-- Table: db3_investigations
-- Stores user query analysis and guidance results
-- ============================================
CREATE TABLE IF NOT EXISTS db3_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User input
  brand_name TEXT NOT NULL,
  product_name TEXT,
  issue_description TEXT NOT NULL,
  user_city TEXT,
  user_state TEXT,
  
  -- Analysis results (from Agent 3)
  issue_category TEXT,
  severity TEXT,                           -- 'low', 'medium', 'high', 'critical'
  similar_signal_ids UUID[],               -- array of related signal IDs
  
  -- Guidance (from Agent 4)
  guidance_text TEXT,
  recommended_contacts JSONB,              -- array of contact info
  confidence_level TEXT,                   -- 'high', 'medium', 'low'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investigations_brand ON db3_investigations(brand_name);
CREATE INDEX IF NOT EXISTS idx_investigations_created ON db3_investigations(created_at DESC);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE db3_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE db3_brand_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE db3_investigations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running script)
DROP POLICY IF EXISTS "Allow public read on signals" ON db3_signals;
DROP POLICY IF EXISTS "Allow public read on contacts" ON db3_brand_contacts;
DROP POLICY IF EXISTS "Allow public read on investigations" ON db3_investigations;
DROP POLICY IF EXISTS "Allow service insert on signals" ON db3_signals;
DROP POLICY IF EXISTS "Allow service update on signals" ON db3_signals;
DROP POLICY IF EXISTS "Allow service insert on contacts" ON db3_brand_contacts;
DROP POLICY IF EXISTS "Allow service insert on investigations" ON db3_investigations;

-- Allow anonymous read access (for public app)
CREATE POLICY "Allow public read on signals" ON db3_signals FOR SELECT USING (true);
CREATE POLICY "Allow public read on contacts" ON db3_brand_contacts FOR SELECT USING (true);
CREATE POLICY "Allow public read on investigations" ON db3_investigations FOR SELECT USING (true);

-- Allow service role to insert/update (for backend)
CREATE POLICY "Allow service insert on signals" ON db3_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on signals" ON db3_signals FOR UPDATE USING (true);
CREATE POLICY "Allow service insert on contacts" ON db3_brand_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service insert on investigations" ON db3_investigations FOR INSERT WITH CHECK (true);

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Insert a few dummy brand contacts for testing
INSERT INTO db3_brand_contacts (brand_name, product_category, contact_type, contact_value, city, state, verified, confidence_score) VALUES
  ('Samsung', 'Refrigerator', 'phone', '1800-5726-7864', NULL, NULL, true, 0.95),
  ('Samsung', 'Refrigerator', 'email', 'support@samsung.com', NULL, NULL, true, 0.90),
  ('Samsung', 'Refrigerator', 'service_center', 'Samsung Service Center, MG Road', 'Mumbai', 'Maharashtra', true, 0.85),
  ('Samsung', 'Refrigerator', 'service_center', 'Samsung Authorized Center, Connaught Place', 'Delhi', 'Delhi', true, 0.85),
  
  ('LG', 'Washing Machine', 'phone', '1800-180-9999', NULL, NULL, true, 0.95),
  ('LG', 'Washing Machine', 'email', 'lgcare@lge.com', NULL, NULL, true, 0.90),
  ('LG', 'Washing Machine', 'service_center', 'LG Service Center, Koramangala', 'Bangalore', 'Karnataka', true, 0.85),
  
  ('OnePlus', 'Smartphone', 'phone', '1800-102-6665', NULL, NULL, true, 0.95),
  ('OnePlus', 'Smartphone', 'email', 'support@oneplus.com', NULL, NULL, true, 0.90),
  ('OnePlus', 'Smartphone', 'website', 'https://www.oneplus.in/support', NULL, NULL, true, 0.90)
ON CONFLICT DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'db3_%';

-- Check sample data
-- SELECT * FROM db3_brand_contacts;

-- Count records
-- SELECT 'db3_signals' as table_name, COUNT(*) as count FROM db3_signals
-- UNION ALL
-- SELECT 'db3_brand_contacts', COUNT(*) FROM db3_brand_contacts
-- UNION ALL
-- SELECT 'db3_investigations', COUNT(*) FROM db3_investigations;
