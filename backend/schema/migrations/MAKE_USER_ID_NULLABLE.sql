-- ============================================================================
-- FIX: Make user_id nullable for invite system
-- ============================================================================
-- The issue: user_id is required but we don't have a user until they sign up
-- Solution: Make user_id nullable and remove NOT NULL constraint

-- Drop the existing foreign key constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Make user_id nullable
ALTER TABLE user_profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the foreign key constraint (but user_id can be NULL now)
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Drop the UNIQUE constraint on user_id since NULL values are allowed
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

-- Add a unique constraint that allows multiple NULL values
-- (PostgreSQL allows multiple NULLs in unique constraints)
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_unique 
ON user_profiles (user_id) 
WHERE user_id IS NOT NULL;

COMMENT ON TABLE user_profiles IS 'user_id is nullable to support invite system - gets populated when user signs up';
