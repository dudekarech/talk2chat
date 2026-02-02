-- ============================================================================
-- 📧 EMAIL CHANNEL INTEGRATION
-- ============================================================================
-- Extends the unified inbox to support Email as a first-class channel.
-- ============================================================================

BEGIN;

-- 1. UPDATE CHANNEL CONSTRAINT
-- Add 'email' to the allowed chat channels
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_channel_check;

ALTER TABLE global_chat_sessions 
ADD CONSTRAINT global_chat_sessions_channel_check 
CHECK (channel IN ('web', 'mobile', 'whatsapp', 'instagram', 'facebook', 'email'));

-- 2. ADD EMAIL-SPECIFIC COLUMNS
-- 'subject' is critical for email threads
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- 3. ENHANCE SOCIAL SESSION SYNC
-- Update the function to handle email lookups gracefully
CREATE OR REPLACE FUNCTION find_or_create_social_session(
    p_external_id TEXT,
    p_channel TEXT,
    p_visitor_name TEXT,
    p_tenant_id UUID,
    p_subject TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Try to find an existing active session
    -- For email, we match by external_id (email address) AND subject to keep threads separate
    -- if subject is provided. If no subject, we match by external_id only (active bot window).
    IF p_channel = 'email' AND p_subject IS NOT NULL THEN
        SELECT * INTO v_session
        FROM global_chat_sessions
        WHERE external_id = p_external_id
          AND channel = p_channel
          AND (subject = p_subject OR subject IS NULL)
          AND status = 'active'
          AND (tenant_id = p_tenant_id)
        ORDER BY created_at DESC
        LIMIT 1;
    ELSE
        SELECT * INTO v_session
        FROM global_chat_sessions
        WHERE external_id = p_external_id
          AND channel = p_channel
          AND status = 'active'
          AND (tenant_id = p_tenant_id)
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    IF v_session.id IS NOT NULL THEN
        -- Update last activity
        UPDATE global_chat_sessions 
        SET last_activity = v_now,
            updated_at = v_now
        WHERE id = v_session.id;

        RETURN to_jsonb(v_session);
    ELSE
        -- 3. Create new session
        INSERT INTO global_chat_sessions (
            visitor_name,
            visitor_id, 
            visitor_email,
            external_id,
            status,
            channel,
            subject,
            tenant_id,
            last_activity,
            created_at,
            updated_at
        ) VALUES (
            p_visitor_name,
            p_external_id,
            CASE WHEN p_channel = 'email' THEN p_external_id ELSE NULL END,
            p_external_id,
            'active',
            p_channel,
            p_subject,
            p_tenant_id,
            v_now,
            v_now,
            v_now
        )
        RETURNING * INTO v_session;

        RETURN to_jsonb(v_session);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. INDEXING
CREATE INDEX IF NOT EXISTS idx_chat_sessions_subject ON global_chat_sessions(subject) WHERE channel = 'email';

COMMIT;

-- ✅ EMAIL INFRASTRUCTURE ENABLED.
SELECT 'Database upgraded: Email channel is now supported in the unified inbox.' as status;
