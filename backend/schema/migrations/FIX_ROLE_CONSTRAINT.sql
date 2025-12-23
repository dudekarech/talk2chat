-- Drop the existing check constraint for role
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new check constraint including 'tenant_admin'
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'agent', 'tenant_admin'));
