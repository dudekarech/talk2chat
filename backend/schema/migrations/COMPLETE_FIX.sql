-- ============================================================================
-- 🚀 COMPLETE FIX: Widget Configuration Database Setup
-- ============================================================================
-- This single migration does EVERYTHING you need:
-- 1. Adds all missing columns
-- 2. Removes duplicate rows
-- 3. Adds unique constraint
-- ============================================================================

-- ⚠️ COPY AND RUN EVERYTHING BELOW THIS LINE IN SUPABASE SQL EDITOR ⚠️

-- =================================================
-- STEP 1: Add ALL missing columns
-- =================================================
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#ec4899',
ADD COLUMN IF NOT EXISTS offline_message TEXT DEFAULT 'We''re currently offline. Leave a message!',
ADD COLUMN IF NOT EXISTS pre_chat_message TEXT DEFAULT 'Start a Conversation',
ADD COLUMN IF NOT EXISTS input_placeholder TEXT DEFAULT 'Type your message...',
ADD COLUMN IF NOT EXISTS team_name TEXT DEFAULT 'Support Team',
ADD COLUMN IF NOT EXISTS team_logo_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'system-ui',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS widget_shape TEXT DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Chat with us',
ADD COLUMN IF NOT EXISTS show_agent_avatars BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_timestamps BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_powered_by BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_sound BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_emojis BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_file_upload BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'application/pdf'],
ADD COLUMN IF NOT EXISTS auto_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_open_delay INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS initial_message TEXT,
ADD COLUMN IF NOT EXISTS require_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_phone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pre_chat_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gdpr_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gdpr_message TEXT,
ADD COLUMN IF NOT EXISTS enable_rating BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rating_message TEXT DEFAULT 'How was your experience?',
ADD COLUMN IF NOT EXISTS track_page_views BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS track_mouse_movement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_clicks BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_scroll_depth BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS track_time_on_page BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS capture_screenshots BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_recording BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-1.5-flash',
ADD COLUMN IF NOT EXISTS ai_temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS ai_max_tokens INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS ai_auto_respond BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_greeting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_smart_suggestions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_sentiment_analysis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_language_detection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_response_delay INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "enabled": false,
  "timezone": "UTC",
  "schedule": {
    "monday": {"open": "09:00", "close": "17:00", "enabled": true},
    "tuesday": {"open": "09:00", "close": "17:00", "enabled": true},
    "wednesday": {"open": "09:00", "close": "17:00", "enabled": true},
    "thursday": {"open": "09:00", "close": "17:00", "enabled": true},
    "friday": {"open": "09:00", "close": "17:00", "enabled": true},
    "saturday": {"open": "10:00", "close": "14:00", "enabled": false},
    "sunday": {"open": "10:00", "close": "14:00", "enabled": false}
  }
}'::jsonb,
ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assignment_strategy TEXT DEFAULT 'round_robin',
ADD COLUMN IF NOT EXISTS max_chats_per_agent INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS queue_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS queue_message TEXT DEFAULT 'All agents are busy.',
ADD COLUMN IF NOT EXISTS enable_canned_responses BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS canned_responses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quick_replies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS enable_tags BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS predefined_tags TEXT[] DEFAULT ARRAY['urgent', 'feedback', 'support'],
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT ARRAY['message', 'session_start'],
ADD COLUMN IF NOT EXISTS slack_webhook TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS custom_js TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS google_analytics_id TEXT,
ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS blocked_ips TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS rate_limit_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rate_limit_messages_per_minute INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS spam_detection BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profanity_filter BOOLEAN DEFAULT false;

-- =================================================
-- STEP 2: Remove duplicate rows
-- =================================================
DELETE FROM global_widget_config
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM global_widget_config
    WHERE config_key = 'global_widget'
    GROUP BY config_key
);

-- =================================================
-- STEP 3: Add unique constraint
-- =================================================
ALTER TABLE global_widget_config
DROP CONSTRAINT IF EXISTS global_widget_config_config_key_key;

ALTER TABLE global_widget_config
ADD CONSTRAINT global_widget_config_config_key_key UNIQUE (config_key);

-- =================================================
-- STEP 4: Verify setup
-- =================================================
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT config_key) as unique_keys
FROM global_widget_config;

-- ============================================================================
-- ✅ SUCCESS! You should see:
-- - total_rows: 1
-- - unique_keys: 1
--
-- Now go back to your app and try saving the widget config!
-- ============================================================================
