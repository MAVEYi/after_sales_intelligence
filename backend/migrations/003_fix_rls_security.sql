-- Migration: Fix RLS Policies and Function Security
-- Date: 2026-02-07
-- Purpose: Harden database security before production merge

-- ============================================
-- FIX FUNCTION SEARCH PATHS (Low Priority)
-- ============================================

ALTER FUNCTION cleanup_db1_expired_signals() 
  SET search_path = public, pg_temp;

ALTER FUNCTION archive_db4_expired_queries() 
  SET search_path = public, pg_temp;

ALTER FUNCTION mark_stale_db3_contacts() 
  SET search_path = public, pg_temp;

-- ============================================
-- FIX RLS POLICIES (High Priority)
-- ============================================

-- Drop all existing permissive policies
DROP POLICY IF EXISTS "allow_service_full_access_db1" ON db1_signals;
DROP POLICY IF EXISTS "allow_service_full_access_db2_analysis" ON db2_signal_analysis;
DROP POLICY IF EXISTS "allow_service_full_access_db2_contacts" ON db2_contact_extractions;
DROP POLICY IF EXISTS "allow_service_update_db3_contacts" ON db3_brand_contacts;
DROP POLICY IF EXISTS "allow_service_write_db3_contacts" ON db3_brand_contacts;
DROP POLICY IF EXISTS "allow_service_update_db3_patterns" ON db3_case_patterns;
DROP POLICY IF EXISTS "allow_service_write_db3_patterns" ON db3_case_patterns;
DROP POLICY IF EXISTS "allow_service_update_db4_queries" ON db4_user_queries;
DROP POLICY IF EXISTS "allow_service_write_db4_queries" ON db4_user_queries;

-- ============================================
-- DB1: Internal Signals (Backend Only)
-- ============================================

-- Deny anon role completely
CREATE POLICY "deny_anon_db1"
  ON db1_signals FOR ALL TO anon
  USING (false);

-- Service role has full access (backend processes)
CREATE POLICY "service_full_access_db1"
  ON db1_signals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- DB2: Signal Analysis & Contact Extractions (Backend Only)
-- ============================================

CREATE POLICY "deny_anon_db2_analysis"
  ON db2_signal_analysis FOR ALL TO anon
  USING (false);

CREATE POLICY "service_full_access_db2_analysis"
  ON db2_signal_analysis FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_db2_contacts"
  ON db2_contact_extractions FOR ALL TO anon
  USING (false);

CREATE POLICY "service_full_access_db2_contacts"
  ON db2_contact_extractions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- DB3: Knowledge Base (Public Read, Service Write)
-- ============================================

-- Brand Contacts
CREATE POLICY "public_read_db3_contacts"
  ON db3_brand_contacts FOR SELECT
  USING (true); -- OK: anyone can read knowledge base

CREATE POLICY "deny_anon_insert_db3_contacts"
  ON db3_brand_contacts FOR INSERT TO anon
  WITH CHECK (false);

CREATE POLICY "deny_anon_update_db3_contacts"
  ON db3_brand_contacts FOR UPDATE TO anon
  USING (false);

CREATE POLICY "deny_anon_delete_db3_contacts"
  ON db3_brand_contacts FOR DELETE TO anon
  USING (false);

CREATE POLICY "service_full_db3_contacts"
  ON db3_brand_contacts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Case Patterns
CREATE POLICY "public_read_db3_patterns"
  ON db3_case_patterns FOR SELECT
  USING (true); -- OK: anyone can read patterns

CREATE POLICY "deny_anon_insert_db3_patterns"
  ON db3_case_patterns FOR INSERT TO anon
  WITH CHECK (false);

CREATE POLICY "deny_anon_update_db3_patterns"
  ON db3_case_patterns FOR UPDATE TO anon
  USING (false);

CREATE POLICY "deny_anon_delete_db3_patterns"
  ON db3_case_patterns FOR DELETE TO anon
  USING (false);

CREATE POLICY "service_full_db3_patterns"
  ON db3_case_patterns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- DB4: User Queries (Service Only for Now)
-- ============================================
-- Note: No user auth yet, so queries are not tied to users
-- Backend service creates and retrieves all queries

CREATE POLICY "deny_anon_db4"
  ON db4_user_queries FOR ALL TO anon
  USING (false);

CREATE POLICY "service_full_access_db4"
  ON db4_user_queries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================

-- Check RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename LIKE 'db%'
-- ORDER BY tablename;

-- List all policies
-- SELECT schemaname, tablename, policyname, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;
