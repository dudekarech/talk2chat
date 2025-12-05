-- ============================================================================
-- 🚀 FINAL COMPLETE WIDGET CONFIGURATION MIGRATION
-- ============================================================================
-- This adds ALL columns needed for the enriched widget configuration UI
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- Add ALL missing columns
ALTER TABLE global_widget_config 
-- Tracking
ADD COLUMN IF NOT EXISTS track_visitors BOOLEAN DEFAULT false,
-- Appearance  
ADD COLUMN IF NOT EXISTS show_powered_by BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS widget_shape TEXT DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS avatar_style TEXT DEFAULT 'circular',
ADD COLUMN IF NOT EXISTS show_agent_avatars BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_timestamps BOOLEAN DEFAULT true,
-- Behavior
ADD COLUMN IF NOT EXISTS auto_open_on_scroll BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scroll_percentage INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS sound_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_on_mobile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emoji_picker BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS typing_indicator BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS read_receipts BOOLEAN DEFAULT true,
-- Content
ADD COLUMN IF NOT EXISTS thank_you_message TEXT DEFAULT 'Thank you for chatting with us!',
ADD COLUMN IF NOT EXISTS input_placeholder TEXT DEFAULT 'Type your message...',
ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Chat with us',
-- Pre-Chat Form
ADD COLUMN IF NOT EXISTS gdpr_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gdpr_message TEXT,
-- AI
ADD COLUMN IF NOT EXISTS ai_max_tokens INTEGER DEFAULT 500,
-- Notifications
ADD COLUMN IF NOT EXISTS mobile_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_on_new_chat BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_message BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_rating BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rating_message TEXT DEFAULT 'How was your experience?',
-- Integrations
ADD COLUMN IF NOT EXISTS google_analytics TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS slack_webhook TEXT,
ADD COLUMN IF NOT EXISTS zapier_enabled BOOLEAN DEFAULT false,
-- Security
ADD COLUMN IF NOT EXISTS enable_captcha BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS captcha_provider TEXT DEFAULT 'recaptcha',
ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS block_vpn BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spam_detection BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profanity_filter BOOLEAN DEFAULT false,
-- Advanced
ADD COLUMN IF NOT EXISTS file_upload BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_file_size INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS message_character_limit INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS custom_js TEXT;

-- Verify all columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'global_widget_config'
ORDER BY ordinal_position;

-- ============================================================================
-- ✅ MIGRATION COMPLETE!
-- ============================================================================
-- You should see ALL the new columns listed above
-- Now refresh your app and try saving again!
-- ============================================================================
