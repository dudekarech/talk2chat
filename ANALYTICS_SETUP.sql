-- ============================================================================
-- 📊 ANALYTICS COMPLETE SETUP
-- ============================================================================
-- Creates all missing analytics infrastructure in one safe script.
-- Safe to re-run: uses CREATE OR REPLACE and IF NOT EXISTS everywhere.
-- 
-- Prerequisites: global_chat_sessions and user_profiles tables must exist.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Ensure dependent tables exist
-- ============================================================================

-- AI Usage Logs table (may already exist from AI_ECONOMY_SCHEMA)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    session_id UUID,
    feature TEXT NOT NULL DEFAULT 'chat_response',
    provider TEXT NOT NULL DEFAULT 'gemini',
    model_name TEXT,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10, 6) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled on ai_usage_logs
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the RLS policy to avoid "already exists" errors
DROP POLICY IF EXISTS "Admins can view their own tenant usage" ON ai_usage_logs;
CREATE POLICY "Admins can view their own tenant usage"
ON ai_usage_logs FOR SELECT
USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'super_admin' AND tenant_id IS NULL)
);

-- ============================================================================
-- STEP 2: Create analytics views
-- ============================================================================

-- View 1: Hourly Chat Volume
-- Used by: analyticsService.getChatVolume()
-- Expected columns: hour, total_chats, tenant_id
CREATE OR REPLACE VIEW chat_volume_hourly AS
SELECT 
    tenant_id,
    date_trunc('hour', created_at) as hour,
    count(*) as total_chats
FROM global_chat_sessions
GROUP BY tenant_id, hour
ORDER BY hour DESC;

-- View 2: Daily AI Usage
-- Used by: analyticsService.getAIUsageData()
-- Expected columns: date, total_requests, tenant_id
CREATE OR REPLACE VIEW ai_usage_daily AS
SELECT 
    tenant_id,
    date_trunc('day', created_at) as date,
    sum(tokens_input) as total_input_tokens,
    sum(tokens_output) as total_output_tokens,
    sum(estimated_cost) as total_cost,
    count(*) as total_requests
FROM ai_usage_logs
GROUP BY tenant_id, date
ORDER BY date DESC;

-- View 3: Agent Performance Summary
-- Used by: analyticsService.getTopPerformers()
-- Expected columns: agent_name, sessions_handled, avg_session_duration_seconds, tenant_id
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT 
    p.tenant_id,
    p.user_id,
    p.name as agent_name,
    count(s.id) as sessions_handled,
    COALESCE(
        avg(
            CASE 
                WHEN s.ended_at IS NOT NULL 
                THEN extract(epoch from (s.ended_at - s.created_at))
                ELSE NULL 
            END
        ), 
        0
    ) as avg_session_duration_seconds
FROM user_profiles p
LEFT JOIN global_chat_sessions s ON p.user_id = s.assigned_to
WHERE p.role IN ('agent', 'admin', 'manager', 'super_admin')
GROUP BY p.tenant_id, p.user_id, p.name;

-- ============================================================================
-- STEP 3: Create the dashboard stats RPC
-- ============================================================================

-- Used by: analyticsService.getDashboardStats()
-- Returns: total_chats, active_chats, resolved_chats, total_tokens, ai_cost, total_tenants, active_agents
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_chats', (
            SELECT count(*) FROM global_chat_sessions 
            WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        ),
        'active_chats', (
            SELECT count(*) FROM global_chat_sessions 
            WHERE status IN ('open', 'active', 'pending') 
            AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        ),
        'resolved_chats', (
            SELECT count(*) FROM global_chat_sessions 
            WHERE status = 'resolved' 
            AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        ),
        'total_tokens', (
            SELECT COALESCE(sum(tokens_input + tokens_output), 0) 
            FROM ai_usage_logs 
            WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        ),
        'ai_cost', (
            SELECT COALESCE(sum(estimated_cost), 0) 
            FROM ai_usage_logs 
            WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        ),
        'total_tenants', (
            SELECT count(*) FROM tenants WHERE p_tenant_id IS NULL
        ),
        'active_agents', (
            SELECT count(*) FROM user_profiles 
            WHERE role IN ('agent', 'admin', 'manager') 
            AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- ✅ VERIFICATION: Quick sanity check
-- ============================================================================
SELECT 'Analytics infrastructure created successfully' as status;
SELECT get_dashboard_stats(NULL) as global_stats;
