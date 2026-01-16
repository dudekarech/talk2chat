-- ============================================================================
-- 🚀 AUTOMATED OMNICHANNEL REPLIES
-- ============================================================================
-- Automatically sends messages to WhatsApp/Social when an agent replies.
-- ============================================================================

BEGIN;

-- Note: This requires the 'pg_net' or 'http' extension in Supabase.
-- Most Supabase projects have these by default.

CREATE OR REPLACE FUNCTION trigger_outgoing_social_message()
RETURNS TRIGGER AS $$
DECLARE
    v_session_channel TEXT;
BEGIN
    -- 1. Check if the message is from an agent or AI
    IF NEW.sender_type NOT IN ('agent', 'ai') THEN
        RETURN NEW;
    END IF;

    -- 2. Check the channel of the session
    SELECT channel INTO v_session_channel 
    FROM global_chat_sessions 
    WHERE id = NEW.session_id;

    -- 3. If it's a social channel, trigger the Edge Function
    IF v_session_channel IN ('whatsapp', 'instagram', 'facebook') THEN
        -- We use Supabase Edge Function Webhook pattern
        -- Note: Replace 'your-project-ref' with actual ref if needed, 
        -- but locally we can just emit a notification or use pg_net.
        
        PERFORM net.http_post(
            url := 'http://localhost:54321/functions/v1/send-social-message',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::jsonb->>'sub' -- Use service role in production
            ),
            body := jsonb_build_object(
                'record', row_to_json(NEW),
                'old_record', NULL,
                'type', 'INSERT',
                'table', 'global_chat_messages',
                'schema', 'public'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_outgoing_social_message ON global_chat_messages;
CREATE TRIGGER tr_outgoing_social_message
AFTER INSERT ON global_chat_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_outgoing_social_message();

COMMIT;

SELECT 'Automated outgoing social messaging trigger is now active.' as status;
