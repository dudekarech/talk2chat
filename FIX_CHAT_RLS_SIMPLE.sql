-- ============================================================================
-- COPY-PASTE THIS ENTIRE BLOCK INTO SUPABASE SQL EDITOR
-- ============================================================================
-- Fix: Allow anonymous users to create chat sessions
-- This fixes the 403 Forbidden error when visitors try to chat
-- ============================================================================

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "allow_anon_insert_sessions" ON global_chat_sessions;
DROP POLICY IF EXISTS "allow_update_own_sessions" ON global_chat_sessions;

-- Step 2: Create INSERT policy for anonymous users
CREATE POLICY "allow_anon_insert_sessions" ON global_chat_sessions
    FOR INSERT
    WITH CHECK (
        auth.role() = 'anon' 
        OR is_super_admin() 
        OR (auth.role() = 'authenticated' AND tenant_id = get_my_tenant_id())
    );

-- Step 3: Create UPDATE policy for session management
CREATE POLICY "allow_update_own_sessions" ON global_chat_sessions
    FOR UPDATE
    USING (
        is_super_admin() 
        OR (auth.role() = 'authenticated' AND tenant_id = get_my_tenant_id()) 
        OR auth.role() = 'anon'
    );

-- ✅ Done! Chat sessions should now work for anonymous visitors
