-- ============================================
-- ConsuMaarg 4-Tier Database Architecture
-- Alpha-2 Schema v2 - Clean Redesign
-- ============================================
--
-- TIER DEFINITIONS:
-- db1_ = Raw Intake (untrusted, temporary, auto-delete after 7 days)
-- db2_ = Analysis/Processing (AI work, pending review)
-- db3_ = Verified/Trusted (permanent, high quality)
-- db4_ = User-Facing (public queries, archive after 90 days)
--
-- ============================================

-- ============================================
-- DB1: RAW INTAKE TIER
-- Purpose: Temporary storage for raw RSS signals
-- Lifecycle: Auto-delete after 7 days
-- ============================================

CREATE TABLE IF NOT EXISTS db1_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  source TEXT NOT NULL,              -- 'consumercomplaintscourt', etc.
  source_url TEXT NOT NULL UNIQUE,   -- Prevent duplicate fetches
  title TEXT,
  content TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Processing status
  status TEXT DEFAULT 'pending',     -- 'pending', 'processing', 'processed', 'rejected'
  processed_at TIMESTAMPTZ,
  
  -- Lifecycle (auto-cleanup)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_db1_signals_status ON db1_signals(status);
CREATE INDEX IF NOT EXISTS idx_db1_signals_expires ON db1_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_db1_signals_fetched ON db1_signals(fetched_at DESC);

-- ============================================
-- DB2: ANALYSIS/PROCESSING TIER
-- Purpose: AI processing results, pending verification
-- Lifecycle: Archive or promote to db3
-- ============================================

CREATE TABLE IF NOT EXISTS db2_signal_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_signal_id UUID NOT NULL,    -- FK to db1_signals
  
  -- AI-extracted metadata
  brand_name TEXT,
  product_category TEXT,
  issue_type TEXT,
  sentiment TEXT,                    -- 'positive', 'negative', 'neutral'
  contains_contact_info BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2),     -- 0.00 to 1.00
  
  -- Processing metadata
  processed_by TEXT DEFAULT 'agent_1',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  llm_model TEXT,                    -- which model was used
  
  -- Quality control
  status TEXT DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected'
  reviewed_by TEXT,                  -- 'admin', 'automated', null
  reviewed_at TIMESTAMPTZ,
  
  metadata JSONB,
  
  FOREIGN KEY (source_signal_id) REFERENCES db1_signals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_db2_analysis_brand ON db2_signal_analysis(brand_name);
CREATE INDEX IF NOT EXISTS idx_db2_analysis_status ON db2_signal_analysis(status);
CREATE INDEX IF NOT EXISTS idx_db2_analysis_contacts ON db2_signal_analysis(contains_contact_info);

-- ============================================

CREATE TABLE IF NOT EXISTS db2_contact_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_signal_id UUID NOT NULL,
  
  -- Extracted contact information
  brand_name TEXT NOT NULL,
  contact_type TEXT NOT NULL,        -- 'phone', 'email', 'service_center', 'website'
  contact_value TEXT NOT NULL,
  product_category TEXT,
  city TEXT,
  state TEXT,
  
  -- Quality metrics
  confidence_score DECIMAL(3,2),
  extraction_method TEXT,            -- 'llm', 'regex', 'manual'
  
  -- Review status
  status TEXT DEFAULT 'pending_verification', -- 'pending_verification', 'verified', 'rejected'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  
  FOREIGN KEY (source_signal_id) REFERENCES db1_signals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_db2_contacts_brand ON db2_contact_extractions(brand_name);
CREATE INDEX IF NOT EXISTS idx_db2_contacts_status ON db2_contact_extractions(status);

-- ============================================
-- DB3: VERIFIED/TRUSTED TIER
-- Purpose: Permanent, high-quality verified data
-- Lifecycle: Keep forever, mark inactive if stale
-- ============================================

CREATE TABLE IF NOT EXISTS db3_brand_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Brand information
  brand_name TEXT NOT NULL,
  product_category TEXT,
  
  -- Contact details
  contact_type TEXT NOT NULL,        -- 'phone', 'email', 'service_center', 'escalation', 'website'
  contact_value TEXT NOT NULL,
  city TEXT,
  state TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by TEXT,                  -- 'admin', 'agent_2', 'user_feedback'
  verified_at TIMESTAMPTZ,
  confidence_score DECIMAL(3,2),
  
  -- Source tracking
  extracted_from_signal_id UUID,     -- Nullable FK to db1_signals
  source TEXT,                       -- 'manual', 'llm_extraction', 'user_submission'
  
  -- Lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_db3_contacts_brand ON db3_brand_contacts(brand_name);
CREATE INDEX IF NOT EXISTS idx_db3_contacts_location ON db3_brand_contacts(city, state);
CREATE INDEX IF NOT EXISTS idx_db3_contacts_type ON db3_brand_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_db3_contacts_active ON db3_brand_contacts(is_active);

-- ============================================
-- DB4: USER-FACING TIER
-- Purpose: Public user queries and investigations
-- Lifecycle: Archive after 90 days (GDPR-friendly)
-- ============================================

CREATE TABLE IF NOT EXISTS db4_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User input
  brand_name TEXT NOT NULL,
  product_name TEXT,
  issue_description TEXT NOT NULL,
  user_city TEXT,
  user_state TEXT,
  
  -- Analysis results (from Agent 3)
  issue_category TEXT,
  severity TEXT,                     -- 'low', 'medium', 'high', 'critical'
  similar_signal_ids UUID[],         -- Array of related db1_signals IDs
  confidence_level TEXT,             -- 'high', 'medium', 'low'
  
  -- Guidance (from Agent 4)
  guidance_summary TEXT,
  suggested_steps JSONB,             -- Array of action steps
  recommended_contacts JSONB,        -- Array of contact objects from db3
  expectations TEXT,
  legal_rights TEXT,
  
  -- User feedback
  was_helpful BOOLEAN,
  user_feedback TEXT,
  feedback_at TIMESTAMPTZ,
  
  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_db4_investigations_brand ON db4_investigations(brand_name);
CREATE INDEX IF NOT EXISTS idx_db4_investigations_created ON db4_investigations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_db4_investigations_expires ON db4_investigations(expires_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE db1_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE db2_signal_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE db2_contact_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE db3_brand_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE db4_investigations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read on db1_signals" ON db1_signals;
DROP POLICY IF EXISTS "Allow service write on db1_signals" ON db1_signals;
DROP POLICY IF EXISTS "Allow public read on db3_contacts" ON db3_brand_contacts;
DROP POLICY IF EXISTS "Allow service write on db3_contacts" ON db3_brand_contacts;
DROP POLICY IF EXISTS "Allow public read on db4_investigations" ON db4_investigations;
DROP POLICY IF EXISTS "Allow service write on db4_investigations" ON db4_investigations;

-- DB1: Backend only (no public access)
CREATE POLICY "Allow service full access on db1" ON db1_signals FOR ALL USING (true);

-- DB2: Backend only (no public access)
CREATE POLICY "Allow service full access on db2_analysis" ON db2_signal_analysis FOR ALL USING (true);
CREATE POLICY "Allow service full access on db2_contacts" ON db2_contact_extractions FOR ALL USING (true);

-- DB3: Public read, service write
CREATE POLICY "Allow public read on db3" ON db3_brand_contacts FOR SELECT USING (is_active = true);
CREATE POLICY "Allow service write on db3" ON db3_brand_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on db3" ON db3_brand_contacts FOR UPDATE USING (true);

-- DB4: Public read, service write
CREATE POLICY "Allow public read on db4" ON db4_investigations FOR SELECT USING (true);
CREATE POLICY "Allow service write on db4" ON db4_investigations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on db4" ON db4_investigations FOR UPDATE USING (true);

-- ============================================
-- Sample Data for Testing
-- ============================================

INSERT INTO db3_brand_contacts (brand_name, product_category, contact_type, contact_value, city, state, verified, verified_by, confidence_score, source) VALUES
  ('Samsung', 'Refrigerator', 'phone', '1800-5726-7864', NULL, NULL, true, 'admin', 0.95, 'manual'),
  ('Samsung', 'Refrigerator', 'email', 'support@samsung.com', NULL, NULL, true, 'admin', 0.90, 'manual'),
  ('Samsung', 'Refrigerator', 'service_center', 'Samsung Service Center, MG Road', 'Mumbai', 'Maharashtra', true, 'admin', 0.85, 'manual'),
  ('Samsung', 'Refrigerator', 'service_center', 'Samsung Authorized Center, Connaught Place', 'Delhi', 'Delhi', true, 'admin', 0.85, 'manual'),
  
  ('LG', 'Washing Machine', 'phone', '1800-180-9999', NULL, NULL, true, 'admin', 0.95, 'manual'),
  ('LG', 'Washing Machine', 'email', 'lgcare@lge.com', NULL, NULL, true, 'admin', 0.90, 'manual'),
  ('LG', 'Washing Machine', 'service_center', 'LG Service Center, Koramangala', 'Bangalore', 'Karnataka', true, 'admin', 0.85, 'manual'),
  
  ('OnePlus', 'Smartphone', 'phone', '1800-102-6665', NULL, NULL, true, 'admin', 0.95, 'manual'),
  ('OnePlus', 'Smartphone', 'email', 'support@oneplus.com', NULL, NULL, true, 'admin', 0.90, 'manual'),
  ('OnePlus', 'Smartphone', 'website', 'https://www.oneplus.in/support', NULL, NULL, true, 'admin', 0.90, 'manual')
ON CONFLICT DO NOTHING;

-- ============================================
-- Cleanup Functions (Run via cron)
-- ============================================

-- Function to cleanup expired db1 signals
CREATE OR REPLACE FUNCTION cleanup_db1_expired_signals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM db1_signals WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive expired db4 investigations
CREATE OR REPLACE FUNCTION archive_db4_expired_investigations()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- In production, move to archive table instead of delete
  -- For now, just delete
  DELETE FROM db4_investigations WHERE expires_at < NOW();
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark inactive db3 contacts
CREATE OR REPLACE FUNCTION mark_stale_db3_contacts()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE db3_brand_contacts 
  SET is_active = FALSE
  WHERE last_verified_at < (NOW() - INTERVAL '180 days')
  AND is_active = TRUE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verification Queries
-- ============================================

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'db%'
-- ORDER BY table_name;

-- Check sample data
-- SELECT brand_name, COUNT(*) FROM db3_brand_contacts GROUP BY brand_name;

-- Check cleanup functions
-- SELECT cleanup_db1_expired_signals();
-- SELECT archive_db4_expired_investigations();
-- SELECT mark_stale_db3_contacts();
