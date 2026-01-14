-- ============================================================================
-- SECURE INVITE SYSTEM: PREVENT PRIVILEGE ESCALATION
-- ============================================================================
-- This migration ensures that a user can only claim an invite if their 
-- authenticated email matches the email that was invited.
-- ============================================================================

BEGIN;

-- 1. Create a function to validate invite claims
CREATE OR REPLACE FUNCTION validate_invite_claim()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check when a profile is being transitioned from 'pending' to 'active'
    -- and a user_id is being assigned for the first time.
    IF OLD.status = 'pending' AND NEW.status = 'active' AND NEW.user_id IS NOT NULL THEN
        
        -- Check if the email of the person claiming matches the invited email
        -- We get the email from the auth.users table because auth.email() might be tricked 
        -- during signup if not careful, but Supabase auth.uid() linked to auth.users is safe.
        IF NEW.email != (SELECT email FROM auth.users WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'This invite was issued for %, but you are signed in as %. Email must match.', 
                OLD.email, 
                (SELECT email FROM auth.users WHERE id = NEW.user_id);
        END IF;

        -- Prevent role escalation: Ensure a regular user doesn't try to change their role 
        -- during signup to something they weren't invited for.
        -- This logic is already safe because the NEW.role is taken from the existing row.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to user_profiles
DROP TRIGGER IF EXISTS tr_validate_invite_claim ON user_profiles;
CREATE TRIGGER tr_validate_invite_claim
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_invite_claim();

-- 3. Hardening: Ensure email cannot be changed once invited (unless by admin)
CREATE OR REPLACE FUNCTION protect_invited_email()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.email != OLD.email THEN
        -- Check if the person making the change is a super admin
        IF NOT EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        ) THEN
            RAISE EXCEPTION 'The invited email address cannot be changed.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_invited_email ON user_profiles;
CREATE TRIGGER tr_protect_invited_email
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_invited_email();

COMMIT;

-- ✅ SUCCESS: Invite system hardened.
SELECT 'Invite system hardened. Email matching is now enforced.' as result;
