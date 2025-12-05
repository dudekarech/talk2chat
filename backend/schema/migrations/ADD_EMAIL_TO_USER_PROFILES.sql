-- ============================================================================
-- ADD EMAIL COLUMN TO user_profiles (Safe Migration)
-- ============================================================================
-- This script safely adds the email column if it doesn't exist

-- Add email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Email column added to user_profiles';
    ELSE
        RAISE NOTICE 'Email column already exists in user_profiles';
    END IF;
END $$;

-- Optional: Populate email from auth.users if needed
-- UPDATE user_profiles up
-- SET email = (SELECT email FROM auth.users WHERE id = up.user_id)
-- WHERE up.email IS NULL;

COMMENT ON COLUMN user_profiles.email IS 'User email address (cached from auth.users)';
