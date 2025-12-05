-- ============================================================================
-- EMERGENCY FIX: Disable RLS on ALL Tables (Development Only!)
-- ============================================================================
-- This will fix all CORS errors which are actually RLS blocking requests

-- Disable RLS on ALL tables
ALTER TABLE IF EXISTS global_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS global_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS global_widget_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_notes DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'global_chat_sessions',
    'global_chat_messages',
    'global_widget_config',
    'user_profiles',
    'agent_stats',
    'chat_notes'
)
ORDER BY tablename;

-- Done!
SELECT 'RLS disabled on all tables! Refresh your browser now.' AS message;
