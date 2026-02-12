
-- ============================================================================
-- 🚨 CRITICAL FIX: Global Admin RLS & Null Tenant Visibility
-- ============================================================================
-- This script fixes the bug where Global Admins (NULL tenant_id) see 0 chats.
-- In SQL, (NULL = NULL) is false. We must use IS NOT DISTINCT FROM.
-- ============================================================================

BEGIN;

-- 1. Update SELECT policy for global_chat_sessions
DROP POLICY IF EXISTS "secure_select_sessions" ON global_chat_sessions;
CREATE POLICY "secure_select_sessions" ON global_chat_sessions
    FOR SELECT
    USING (
        is_super_admin()
        OR (auth.role() = 'authenticated' AND (tenant_id IS NOT DISTINCT FROM get_my_tenant_id()))
        OR (auth.role() = 'anon')
    );

-- 2. Update INSERT policy for global_chat_sessions
DROP POLICY IF EXISTS "allow_anon_insert_sessions" ON global_chat_sessions;
CREATE POLICY "allow_anon_insert_sessions" ON global_chat_sessions
    FOR INSERT
    WITH CHECK (
        auth.role() = 'anon'
        OR is_super_admin()
        OR (auth.role() = 'authenticated' AND (tenant_id IS NOT DISTINCT FROM get_my_tenant_id()))
    );

-- 3. Update SELECT policy for global_chat_messages
DROP POLICY IF EXISTS "secure_select_messages" ON global_chat_messages;
CREATE POLICY "secure_select_messages" ON global_chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM global_chat_sessions s
            WHERE s.id = session_id
            AND (
                is_super_admin()
                OR (auth.role() = 'authenticated' AND (s.tenant_id IS NOT DISTINCT FROM get_my_tenant_id()))
                OR (auth.role() = 'anon')
            )
        )
    );

COMMIT;
