-- ============================================================================
-- BOT PROTECTION & RATE LIMITING
-- ============================================================================
-- Implements database-level protections against session flooding and spam.
-- ============================================================================

BEGIN;

-- 1. Add CAPTCHA and Rate Limit configuration fields if they don't exist
-- (Some might have been added in FINAL_WIDGET_MIGRATION but we ensure them here)
ALTER TABLE IF EXISTS global_widget_config
ADD COLUMN IF NOT EXISTS captcha_site_key TEXT,
ADD COLUMN IF NOT EXISTS captcha_secret_key TEXT,
ADD COLUMN IF NOT EXISTS max_sessions_per_hour INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS message_throttle_seconds INTEGER DEFAULT 2;

-- 2. Create a table to track session creation attempts (Rate Limiting)
-- This helps us block spam even if RLS is bypassed or overly permissive.
CREATE TABLE IF NOT EXISTS session_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id TEXT NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup of recent attempts
CREATE INDEX IF NOT EXISTS idx_session_rate_limits_visitor_time 
ON session_rate_limits(visitor_id, created_at);

-- 3. Trigger to enforce rate limits on session creation
CREATE OR REPLACE FUNCTION check_session_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    limit_count INTEGER;
    attempt_count INTEGER;
BEGIN
    -- Get the limit from widget config (defaults to 5 per hour if not set)
    SELECT COALESCE(max_sessions_per_hour, 5) 
    INTO limit_count
    FROM global_widget_config
    WHERE (tenant_id = NEW.tenant_id OR (tenant_id IS NULL AND NEW.tenant_id IS NULL))
    LIMIT 1;

    -- Count attempts from this visitor_id in the last hour
    SELECT COUNT(*) 
    INTO attempt_count
    FROM global_chat_sessions
    WHERE visitor_id = NEW.visitor_id
    AND created_at > NOW() - INTERVAL '1 hour';

    IF attempt_count >= limit_count THEN
        RAISE EXCEPTION 'Too many chat sessions started. Please try again later.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_session_rate_limit ON global_chat_sessions;
CREATE TRIGGER trg_check_session_rate_limit
BEFORE INSERT ON global_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION check_session_rate_limit();

-- 4. Trigger to prevent message flooding (Throttling)
CREATE OR REPLACE FUNCTION throttle_messages()
RETURNS TRIGGER AS $$
DECLARE
    last_msg_time TIMESTAMP WITH TIME ZONE;
    throttle_sec INTEGER;
BEGIN
    -- Only throttle visitor messages
    IF NEW.sender_type != 'visitor' THEN
        RETURN NEW;
    END IF;

    -- Get throttle setting
    SELECT COALESCE(message_throttle_seconds, 2)
    INTO throttle_sec
    FROM global_widget_config c
    JOIN global_chat_sessions s ON (c.tenant_id = s.tenant_id OR (c.tenant_id IS NULL AND s.tenant_id IS NULL))
    WHERE s.id = NEW.session_id
    LIMIT 1;

    -- Check time of last message from this session
    SELECT created_at INTO last_msg_time
    FROM global_chat_messages
    WHERE session_id = NEW.session_id
    AND sender_type = 'visitor'
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_msg_time IS NOT NULL AND (NOW() - last_msg_time) < (throttle_sec || ' seconds')::INTERVAL THEN
        RAISE EXCEPTION 'Please slow down. Message sent too quickly.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_throttle_messages ON global_chat_messages;
CREATE TRIGGER trg_throttle_messages
BEFORE INSERT ON global_chat_messages
FOR EACH ROW
EXECUTE FUNCTION throttle_messages();

COMMIT;

-- ✅ SUCCESS: Bot protection and rate limiting active.
SELECT 'Bot protection systems deployed.' as result;
