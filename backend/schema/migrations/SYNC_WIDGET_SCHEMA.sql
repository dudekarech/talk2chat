-- ============================================================================
-- 🛠️ SYNC WIDGET SCHEMA MIGRATION
-- ============================================================================
-- This migration ensures that the 'global_widget_config' table matches 
-- the TypeScript 'WidgetConfig' interface perfectly.
-- Fixes errors like "column desktop_notifications does not exist".
-- ============================================================================

BEGIN;

-- Add every possible missing column with safe defaults
ALTER TABLE global_widget_config 
    -- Appearance
    ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#ec4899',
    ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark',

    -- Content
    ADD COLUMN IF NOT EXISTS offline_message TEXT DEFAULT 'We''re currently offline. Leave us a message!',
    
    -- Behavior
    ADD COLUMN IF NOT EXISTS show_on_pages TEXT DEFAULT 'all',
    
    -- Form
    ADD COLUMN IF NOT EXISTS require_phone BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS seasonal_theme TEXT DEFAULT 'none',

    -- AI and Intel
    ADD COLUMN IF NOT EXISTS ai_temperature DECIMAL(3,2) DEFAULT 0.7,
    
    -- Knowledge Base/FAQs
    ADD COLUMN IF NOT EXISTS enable_canned_responses BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS canned_responses JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS quick_replies JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb,

    -- Tracking Detail
    ADD COLUMN IF NOT EXISTS track_page_views BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS track_mouse_movement BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS track_clicks BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS track_scroll_depth BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS track_time_on_page BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS capture_screenshots BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS session_recording BOOLEAN DEFAULT false,

    -- Intelligence
    ADD COLUMN IF NOT EXISTS show_visitor_info BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_device BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_browser BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_referrer BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_previous_visits BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS enrich_visitor_data BOOLEAN DEFAULT false,

    -- Notifications Detail
    ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'default',

    -- Integrations Detail
    ADD COLUMN IF NOT EXISTS facebook_pixel TEXT,
    
    -- Security Detail
    ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[] DEFAULT '{}',

    -- Business Hours
    ADD COLUMN IF NOT EXISTS enabled_24_7 BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
    ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,

    -- Advanced Detail
    ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT '{"image/*", "application/pdf"}';

-- ============================================================================
-- 👤 USER PROFILES SYNC
-- ============================================================================
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Refresh the schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ✅ SCHEMA SYNCED SUCCESSFULLY.
SELECT 'Database schema is now perfectly synced with the UI interface.' as status;
