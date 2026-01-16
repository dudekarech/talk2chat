-- ============================================================================
-- 🧠 SOCIAL SESSION SYNC LOGIC
-- ============================================================================
-- Handles lookup and creation of sessions for WhatsApp, IG, and FB.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION find_or_create_social_session(
    p_external_id TEXT,
    p_channel TEXT,
    p_visitor_name TEXT,
    p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Try to find an existing active session
    SELECT * INTO v_session
    FROM global_chat_sessions
    WHERE external_id = p_external_id
      AND channel = p_channel
      AND status = 'active'
      AND (tenant_id = p_tenant_id OR (tenant_id IS NULL AND p_tenant_id IS NULL))
    LIMIT 1;

    -- 2. If session exists but is old (e.g. 24h for social windows), we could close it.
    -- For now, we'll keep it simple: if 'active', use it.

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
            visitor_id, -- We use external_id as visitor_id for social
            external_id,
            status,
            channel,
            tenant_id,
            last_activity,
            created_at,
            updated_at
        ) VALUES (
            p_visitor_name,
            p_external_id,
            p_external_id,
            'active',
            p_channel,
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

COMMIT;

SELECT 'Social session synchronization functions ready.' as status;
