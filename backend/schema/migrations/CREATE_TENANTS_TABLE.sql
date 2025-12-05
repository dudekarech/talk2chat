-- ============================================================================
-- MULTITENANT ARCHITECTURE - Tenants Table
-- ============================================================================

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    domain TEXT UNIQUE,
    company_email TEXT,
    company_phone TEXT,
    logo_url TEXT,
    subscription_plan TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    max_agents INTEGER DEFAULT 5,
    max_chats_per_month INTEGER DEFAULT 1000,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add tenant_id to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to widget config
ALTER TABLE global_widget_config
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to chat sessions
ALTER TABLE global_chat_sessions
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_widget_config_tenant_id ON global_widget_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant_id ON global_chat_sessions(tenant_id);

-- Disable RLS for development
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Function to create default widget config for new tenant
CREATE OR REPLACE FUNCTION create_default_widget_config()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO global_widget_config (
        tenant_id,
        config_key,
        primary_color,
        background_color,
        position,
        widget_shape,
        team_name,
        welcome_message,
        pre_chat_message,
        auto_open,
        auto_open_delay,
        require_name,
        require_email
    ) VALUES (
        NEW.id,
        'tenant_' || NEW.id,
        '#3B82F6',
        '#1E293B',
        'bottom-right',
        'rounded',
        NEW.name,
        'Hi! How can we help you today?',
        'Please fill out the form below to start chatting with our team.',
        false,
        3,
        true,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default widget config when tenant is created
DROP TRIGGER IF EXISTS create_widget_config_on_tenant_create ON tenants;
CREATE TRIGGER create_widget_config_on_tenant_create
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_default_widget_config();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tenants IS 'Companies/organizations using the platform (multitenant)';
COMMENT ON COLUMN tenants.owner_id IS 'User who created/owns this tenant (tenant admin)';
COMMENT ON COLUMN tenants.subscription_plan IS 'free, starter, professional, enterprise';
