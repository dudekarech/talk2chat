-- Global Chat System Database Schema
-- This schema supports the Global Admin Shared Inbox and Landing Page Widget

-- 1. Global Chat Sessions Table
CREATE TABLE IF NOT EXISTS global_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_name TEXT NOT NULL,
    visitor_email TEXT,
    visitor_id TEXT UNIQUE NOT NULL, -- Browser fingerprint or session ID
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved')),
    channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'mobile')),
    assigned_to UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    visitor_metadata JSONB DEFAULT '{}', -- IP, location, browser, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Global Chat Messages Table
CREATE TABLE IF NOT EXISTS global_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES global_chat_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system')),
    sender_id TEXT, -- Visitor ID or Agent User ID
    sender_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- For attachments, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Global Widget Configuration Table
CREATE TABLE IF NOT EXISTS global_widget_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT UNIQUE NOT NULL DEFAULT 'global_widget',
    
    -- Appearance
    primary_color TEXT DEFAULT '#8b5cf6',
    secondary_color TEXT DEFAULT '#ec4899',
    background_color TEXT DEFAULT '#0f172a',
    position TEXT DEFAULT 'bottom-right',
    widget_shape TEXT DEFAULT 'rounded',
    font_size TEXT DEFAULT 'medium',
    theme TEXT DEFAULT 'dark',
    
    -- Branding
    team_name TEXT DEFAULT 'TalkChat Support',
    company_logo TEXT DEFAULT '',
    avatar_style TEXT DEFAULT 'initials',
    show_powered_by BOOLEAN DEFAULT TRUE,
    
    -- Content
    welcome_message TEXT DEFAULT 'Hi! Welcome to TalkChat Studio. How can we help you today?',
    offline_message TEXT DEFAULT 'We''re currently offline. Leave us a message!',
    pre_chat_message TEXT DEFAULT 'Start a Conversation',
    thank_you_message TEXT DEFAULT 'Thanks for chatting with us!',
    
    -- Behavior
    auto_open BOOLEAN DEFAULT FALSE,
    auto_open_delay INTEGER DEFAULT 5,
    auto_open_on_scroll BOOLEAN DEFAULT FALSE,
    scroll_percentage INTEGER DEFAULT 50,
    show_on_pages TEXT DEFAULT 'all',
    hide_on_mobile BOOLEAN DEFAULT FALSE,
    sound_notifications BOOLEAN DEFAULT TRUE,
    
    -- Pre-Chat Form
    require_name BOOLEAN DEFAULT TRUE,
    require_email BOOLEAN DEFAULT FALSE,
    require_phone BOOLEAN DEFAULT FALSE,
    custom_fields JSONB DEFAULT '[]',
    
    -- AI Features
    ai_enabled BOOLEAN DEFAULT TRUE,
    ai_provider TEXT DEFAULT 'gemini',
    ai_model TEXT DEFAULT 'gemini-1.5-flash',
    ai_temperature DECIMAL DEFAULT 0.7,
    ai_auto_respond BOOLEAN DEFAULT TRUE,
    ai_greeting BOOLEAN DEFAULT TRUE,
    ai_smart_suggestions BOOLEAN DEFAULT TRUE,
    ai_sentiment_analysis BOOLEAN DEFAULT TRUE,
    ai_language_detection BOOLEAN DEFAULT TRUE,
    
    -- Quick Replies & Canned Responses
    quick_replies_enabled BOOLEAN DEFAULT TRUE,
    quick_replies JSONB DEFAULT '[
        {"id": "1", "text": "What are your hours?", "category": "General"},
        {"id": "2", "text": "How much does it cost?", "category": "Pricing"},
        {"id": "3", "text": "How do I get started?", "category": "Getting Started"}
    ]',
    canned_responses JSONB DEFAULT '[
        {"id": "1", "shortcut": "/hours", "text": "We''re available Monday-Friday, 9AM-5PM EST", "category": "General"},
        {"id": "2", "shortcut": "/pricing", "text": "Our pricing starts at $29/month. Visit our pricing page for details.", "category": "Pricing"},
        {"id": "3", "shortcut": "/support", "text": "I''ll connect you with a specialist right away.", "category": "Support"}
    ]',
    
    -- Visitor Tracking
    track_visitors BOOLEAN DEFAULT TRUE,
    track_page_views BOOLEAN DEFAULT TRUE,
    track_mouse_movement BOOLEAN DEFAULT TRUE,
    track_clicks BOOLEAN DEFAULT TRUE,
    track_scroll_depth BOOLEAN DEFAULT TRUE,
    track_time_on_page BOOLEAN DEFAULT TRUE,
    capture_screenshots BOOLEAN DEFAULT FALSE,
    session_recording BOOLEAN DEFAULT FALSE,
    
    -- Visitor Intelligence
    show_visitor_info BOOLEAN DEFAULT TRUE,
    show_location BOOLEAN DEFAULT TRUE,
    show_device BOOLEAN DEFAULT TRUE,
    show_browser BOOLEAN DEFAULT TRUE,
    show_referrer BOOLEAN DEFAULT TRUE,
    show_previous_visits BOOLEAN DEFAULT TRUE,
    enrich_visitor_data BOOLEAN DEFAULT TRUE,
    
    -- Notifications
    email_notifications BOOLEAN DEFAULT TRUE,
    desktop_notifications BOOLEAN DEFAULT TRUE,
    mobile_notifications BOOLEAN DEFAULT FALSE,
    notify_on_new_chat BOOLEAN DEFAULT TRUE,
    notify_on_message BOOLEAN DEFAULT TRUE,
    notification_sound TEXT DEFAULT 'default',
    
    -- Integrations
    google_analytics TEXT DEFAULT '',
    facebook_pixel TEXT DEFAULT '',
    webhook_url TEXT DEFAULT '',
    zapier_enabled BOOLEAN DEFAULT FALSE,
    
    -- Security
    allowed_domains TEXT[] DEFAULT '{"talkchat.studio", "localhost"}',
    enable_captcha BOOLEAN DEFAULT FALSE,
    captcha_provider TEXT DEFAULT 'recaptcha',
    rate_limit INTEGER DEFAULT 10,
    block_vpn BOOLEAN DEFAULT FALSE,
    ip_whitelist TEXT[] DEFAULT '{}',
    
    -- Business Hours
    enabled_24_7 BOOLEAN DEFAULT TRUE,
    timezone TEXT DEFAULT 'America/New_York',
    business_hours JSONB DEFAULT '{
        "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
        "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
        "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
    }',
    
    -- Advanced
    typing_indicator BOOLEAN DEFAULT TRUE,
    read_receipts BOOLEAN DEFAULT TRUE,
    file_upload BOOLEAN DEFAULT TRUE,
    max_file_size INTEGER DEFAULT 5,
    allowed_file_types TEXT[] DEFAULT '{"image/*", "application/pdf"}',
    emoji_picker BOOLEAN DEFAULT TRUE,
    message_character_limit INTEGER DEFAULT 1000,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Global Agent Notes Table
CREATE TABLE IF NOT EXISTS global_chat_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES global_chat_sessions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES auth.users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON global_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned ON global_chat_sessions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor ON global_chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_activity ON global_chat_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON global_chat_messages(session_id, created_at DESC);

-- Trigger to update last_activity
CREATE OR REPLACE FUNCTION update_chat_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE global_chat_sessions 
    SET last_activity = NOW(), updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_activity
    AFTER INSERT ON global_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_activity();

-- Enable Row Level Security (RLS)
ALTER TABLE global_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_widget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Global Chat Sessions
-- Allow anyone to create a chat session (for widget)
CREATE POLICY "Anyone can create chat sessions" ON global_chat_sessions
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read their own session
CREATE POLICY "Anyone can read their session" ON global_chat_sessions
    FOR SELECT USING (true);

-- Allow authenticated users (admins) to update
CREATE POLICY "Admins can update chat sessions" ON global_chat_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for Global Chat Messages
-- Allow anyone to insert messages (for widget)
CREATE POLICY "Anyone can insert messages" ON global_chat_messages
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read messages
CREATE POLICY "Anyone can read messages" ON global_chat_messages
    FOR SELECT USING (true);

-- RLS Policies for Widget Config
-- Allow anyone to read widget config
CREATE POLICY "Anyone can read widget config" ON global_widget_config
    FOR SELECT USING (true);

-- Only authenticated users can update widget config
CREATE POLICY "Admins can update widget config" ON global_widget_config
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for Notes
-- Only authenticated users can manage notes
CREATE POLICY "Admins can manage notes" ON global_chat_notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default widget configuration
INSERT INTO global_widget_config (config_key) 
VALUES ('global_widget')
ON CONFLICT (config_key) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON global_chat_sessions TO anon, authenticated;
GRANT ALL ON global_chat_messages TO anon, authenticated;
GRANT ALL ON global_widget_config TO anon, authenticated;
GRANT ALL ON global_chat_notes TO authenticated;
