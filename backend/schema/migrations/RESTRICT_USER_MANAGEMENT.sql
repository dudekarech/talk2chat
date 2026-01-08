-- ============================================================================
-- RESTRICT USER MANAGEMENT AND DOWNGRADE SPECIFIC USER
-- ============================================================================

-- 1. Add invited_by column to track who created the user
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Downgrade bethuelmuikamba8@gmail.com to tenant_admin
-- We need to find the user_id for this email first. 
-- Since we can't easily script the exact UUID without a subquery, we'll use a subquery.
UPDATE user_profiles 
SET role = 'tenant_admin'
WHERE email = 'bethuelmuikamba8@gmail.com';

-- 3. Ensure super_admin role exists in the check constraint if not already
-- (The constraint already includes super_admin based on previous migrations)

-- 4. Update RLS policies for even tighter security (Optional but recommended)
-- We will rely on application-level filtering for "seen by creator" for now as it's more flexible,
-- but we can harden the SELECT policy here.

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Super admins view all, others view tenant or invited"
ON user_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND (
            role = 'super_admin' -- Super admin sees everything
            OR (role = 'admin' AND tenant_id IS NULL) -- Global admin sees everything
        )
    )
    OR (
        -- Regular tenant users see their own tenant's users
        tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid())
    )
);

-- Note: The "only see users they have created" requirement for tenant admins 
-- is handled at the application level in the Users.tsx component to avoid 
-- breaking the ability for agents to see their team members if needed later.
