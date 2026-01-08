-- ============================================================================
-- RE-ENABLE RLS WITH SAFE, NON-RECURSIVE POLICIES
-- ============================================================================
-- This migration re-enables RLS on all tables with policies that don't cause
-- infinite recursion or performance issues
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. USER_PROFILES - Safe Policies
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "safe_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "safe_read_all_admins" ON user_profiles;
DROP POLICY IF EXISTS "users_select_own" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_select_all" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_insert" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_update_all" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_delete" ON user_profiles;

-- Create simple, safe policies
CREATE POLICY "allow_read_own_profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_read_all" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_update" ON user_profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_delete" ON user_profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- 2. GLOBAL_CHAT_SESSIONS - Safe Policies
-- ============================================================================
ALTER TABLE global_chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create chat sessions" ON global_chat_sessions;
DROP POLICY IF EXISTS "Anyone can read their session" ON global_chat_sessions;
DROP POLICY IF EXISTS "Admins can update chat sessions" ON global_chat_sessions;
DROP POLICY IF EXISTS "Allow session updates" ON global_chat_sessions;

CREATE POLICY "allow_anyone_create_session" ON global_chat_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_anyone_read_session" ON global_chat_sessions
    FOR SELECT USING (true);

CREATE POLICY "allow_authenticated_update_session" ON global_chat_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- 3. GLOBAL_CHAT_MESSAGES - Safe Policies
-- ============================================================================
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert messages" ON global_chat_messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON global_chat_messages;

CREATE POLICY "allow_anyone_insert_message" ON global_chat_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_anyone_read_message" ON global_chat_messages
    FOR SELECT USING (true);

-- ============================================================================
-- 4. TENANTS - Keep Disabled for Now (Multi-tenant Complexity)
-- ============================================================================
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- We'll keep tenants RLS disabled during development

-- ============================================================================
-- 5. AGENT_STATS - Safe Policies
-- ============================================================================
ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can view their own stats" ON agent_stats;
DROP POLICY IF EXISTS "Admins can view all stats" ON agent_stats;
DROP POLICY IF EXISTS "System can insert stats" ON agent_stats;
DROP POLICY IF EXISTS "System can update stats" ON agent_stats;

CREATE POLICY "allow_read_own_stats" ON agent_stats
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "allow_authenticated_read_all_stats" ON agent_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "allow_system_insert_stats" ON agent_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_system_update_stats" ON agent_stats
    FOR UPDATE USING (true);

-- ============================================================================
-- 6. FORCE SCHEMA RELOAD
-- ============================================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- ✅ SUCCESS: RLS Re-enabled with Safe, Non-Recursive Policies
-- ============================================================================
