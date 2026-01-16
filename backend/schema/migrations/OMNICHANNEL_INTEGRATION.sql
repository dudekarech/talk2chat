-- ============================================================================
-- 🌐 OMNICHANNEL INTEGRATION SCHEMA
-- ============================================================================
-- Enables WhatsApp, Instagram, and Facebook Messenger support.
-- ============================================================================

BEGIN;

-- 1. EXPAND WIDGET CONFIG FOR INTEGRATIONS
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{
    "whatsapp": {"enabled": false},
    "instagram": {"enabled": false},
    "facebook": {"enabled": false}
}'::jsonb;

-- 2. ENHANCE SESSIONS FOR EXTERNAL CHANNELS
-- We need to store high-fidelity channel identifiers
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS external_id TEXT, -- e.g., WhatsApp number or IG Scoped User ID
ADD COLUMN IF NOT EXISTS platform_data JSONB DEFAULT '{}'::jsonb; -- Store Meta-specific metadata

-- Update channel constraints to support social platforms
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_channel_check;

ALTER TABLE global_chat_sessions 
ADD CONSTRAINT global_chat_sessions_channel_check 
CHECK (channel IN ('web', 'mobile', 'whatsapp', 'instagram', 'facebook'));

-- 3. INDEXING FOR FAST LOOKUP
CREATE INDEX IF NOT EXISTS idx_chat_sessions_external_id ON global_chat_sessions(external_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_channel ON global_chat_sessions(channel);

-- 4. TENANT IDENTIFICATION HELPER
-- This helps the webhook find which tenant owns a specific Social ID
-- We'll add this to the global_widget_config for easy lookup
CREATE INDEX IF NOT EXISTS idx_widget_config_integrations ON global_widget_config USING GIN (integrations);

COMMIT;

-- ✅ OMNICHANNEL SCHEMA READY.
SELECT 'Omnichannel messaging infrastructure is now enabled in the database.' as status;
