-- ============================================================================
-- DISABLE RLS ON user_profiles (For Development Only)
-- ============================================================================
-- This allows the system to work while you develop
-- Re-enable RLS before going to production!

-- Disable RLS on user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on agent_stats as well
ALTER TABLE IF EXISTS agent_stats DISABLE ROW LEVEL SECURITY;

-- You can re-enable them later with:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_profiles IS 'RLS DISABLED - Remember to enable before production!';
