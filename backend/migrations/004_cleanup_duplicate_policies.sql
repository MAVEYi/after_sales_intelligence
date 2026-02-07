-- Migration: Cleanup Duplicate RLS Policies
-- Date: 2026-02-07
-- Purpose: Remove old overlapping policies that cause performance warnings and potential security leaks

-- ============================================
-- DB3: Brand Contacts
-- ============================================
DROP POLICY IF EXISTS "allow_public_read_db3_contacts" ON db3_brand_contacts;
-- Note: We keep 'public_read_db3_contacts' (created in migration 003)

-- ============================================
-- DB3: Case Patterns
-- ============================================
DROP POLICY IF EXISTS "allow_public_read_db3_patterns" ON db3_case_patterns;
-- Note: We keep 'public_read_db3_patterns' (created in migration 003)

-- ============================================
-- DB4: User Queries (CRITICAL FIX)
-- ============================================
-- This old policy allowed public read, which contradicts our new "deny_anon_db4" policy.
-- Policies are combined with OR, so this old policy was mistakenly keeping the table public!
DROP POLICY IF EXISTS "allow_public_read_db4_queries" ON db4_user_queries;

-- Verify we keep:
-- 1. deny_anon_db4
-- 2. service_full_access_db4
