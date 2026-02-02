-- Migration: FIX_REGISTRATION_RLS.sql
-- Description: Fixes RLS errors during user registration by allowing authenticated users to insert into tenants and user_profiles.

BEGIN;

-- Ensure utility functions exist (from ENFORCE_RLS_ISOLATION.sql)
-- If they don't exist, this might fail, so we check/create them or use inline logic.
-- However, ENFORCE_RLS_ISOLATION.sql should have been run.

-- 1. Hardening TENANTS Table Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secure_select_tenants" ON tenants;
DROP POLICY IF EXISTS "Allow authenticated insert" ON tenants;
DROP POLICY IF EXISTS "Allow owner update" ON tenants;
DROP POLICY IF EXISTS "tenants_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenants_update_policy" ON tenants;

-- SELECT: Super admins see all, owners see their own, users in the tenant see their own
-- Non-recursive check for tenant membership
CREATE POLICY "tenants_select_policy" ON tenants
    FOR SELECT
    USING (
        is_super_admin()
        OR owner_id = auth.uid()
        OR id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid())
    );

-- INSERT: Allow any authenticated user to create a tenant (during signup)
-- Once created, they become the owner_id
CREATE POLICY "tenants_insert_policy" ON tenants
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Only owners or super admins can update a tenant
CREATE POLICY "tenants_update_policy" ON tenants
    FOR UPDATE
    USING (
        is_super_admin()
        OR owner_id = auth.uid()
    );

-- 2. Hardening USER_PROFILES for Signup
-- Ensure newly signed up users can insert their initial profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_authenticated_insert" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_insert" ON user_profiles;

CREATE POLICY "allow_authenticated_insert" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

COMMIT;

-- SUCCESS: RLS Fixes for registration applied.
SELECT 'RLS Fixes for registration applied' as result;
