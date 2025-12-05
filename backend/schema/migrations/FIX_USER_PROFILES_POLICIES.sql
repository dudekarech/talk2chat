-- ============================================================================
-- FIX INFINITE RECURSION IN user_profiles POLICIES
-- ============================================================================
-- The issue: Policies that check user_profiles to determine access create recursion
-- Solution: Simplify policies to avoid self-referencing queries

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Create simple, non-recursive policies
-- Policy 1: Allow users to view their own profile
CREATE POLICY "users_select_own"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "users_update_own"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy 3: Allow all authenticated users to view all profiles
-- (This is temporary for development - restrict in production)
CREATE POLICY "authenticated_users_select_all"
    ON user_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy 4: Allow all authenticated users to insert profiles
-- (For the invite system)
CREATE POLICY "authenticated_users_insert"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 5: Allow all authenticated users to update any profile  
-- (Restrict this in production based on your needs)
CREATE POLICY "authenticated_users_update_all"
    ON user_profiles
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy 6: Allow all authenticated users to delete profiles
-- (Restrict this in production)
CREATE POLICY "authenticated_users_delete"
    ON user_profiles
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- For production, you would use JWT claims or a separate roles table
-- Example with JWT claims (requires configuring Supabase Auth):
-- CREATE POLICY "admins_only" ON user_profiles
-- USING (
--     (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
-- );

COMMENT ON TABLE user_profiles IS 'User profiles with simple RLS policies to avoid recursion';
