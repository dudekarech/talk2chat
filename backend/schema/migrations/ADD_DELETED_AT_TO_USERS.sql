-- Add deleted_at column to user_profiles for soft deletes
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint if it exists to allow 'deleted'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_status_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_status_check 
    CHECK (status IN ('active', 'pending', 'suspended', 'deleted', 'inactive'));
