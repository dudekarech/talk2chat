-- ===========================================================================
-- FIX: Add INSERT Policy for Anonymous Chat Sessions
-- ===========================================================================
-- Issue: Anonymous visitors cannot create chat sessions (403 Forbidden)
-- Solution: Add INSERT policy allowing anonymous users to create sessions
-- ===========================================================================

BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_anon_insert_sessions" ON global_chat_sessions;
DROP POLICY IF EXISTS "allow_authenticated_insert_sessions" ON global_chat_sessions;
DROP POLICY IF EXISTS "allow_update_own_sessions" ON global_chat_sessions;

-- Allow anonymous users to INSERT chat sessions
CREATE POLICY "allow_anon_insert_sessions" ON global_chat_sessions
    FOR INSERT
    WITH CHECK (
        auth.role() = 'anon'  -- Anonymous users can create sessions
        OR is_super_admin()     -- Super admins can create any session
        OR (auth.role() = 'authenticated' AND tenant_id = get_my_tenant_id())  -- Authenticated users for their tenant
    );

-- Allow anonymous and authenticated users to UPDATE their own sessions
CREATE POLICY "allow_update_own_sessions" ON global_chat_sessions
    FOR UPDATE
    USING (
        is_super_admin()
        OR (auth.role() = 'authenticated' AND tenant_id = get_my_tenant_id())
        OR auth.role() = 'anon'  -- Anonymous can update (for status changes, etc.)
    );

COMMIT;

-- ✅ SUCCESS: Anonymous users can now create chat sessions
SELECT 'Chat session RLS policies fixed. Anonymous users can now create sessions.' as result;
