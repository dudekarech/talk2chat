-- ============================================================================
-- 📊 ANALYTICS ENHANCEMENT MIGRATION
-- ============================================================================
-- This migration creates specialized views for real-time analytics
-- to support the high-performance Global and Tenant dashboards.
-- ============================================================================

BEGIN;

-- 1. Create a view for Hourly Chat Volume
CREATE OR REPLACE VIEW chat_volume_hourly AS
SELECT 
    tenant_id,
    date_trunc('hour', created_at) as hour,
    count(*) as total_chats
FROM global_chat_sessions
GROUP BY tenant_id, hour
ORDER BY hour DESC;

-- 2. Create a view for Daily AI Token Consumption
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

-- 3. Create a view for Agent Performance Summary
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT 
    p.tenant_id,
    p.user_id,
    p.name as agent_name,
    count(s.id) as sessions_handled,
    avg(extract(epoch from (s.ended_at - s.created_at))) as avg_session_duration_seconds
FROM user_profiles p
LEFT JOIN global_chat_sessions s ON p.user_id = s.assigned_to
WHERE p.role IN ('agent', 'admin', 'manager')
GROUP BY p.tenant_id, p.user_id, p.name;

-- 4. Function to get real-time overview stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_chats', (SELECT count(*) FROM global_chat_sessions WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
        'active_chats', (SELECT count(*) FROM global_chat_sessions WHERE status IN ('open', 'active', 'pending') AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
        'resolved_chats', (SELECT count(*) FROM global_chat_sessions WHERE status = 'resolved' AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
        'total_tokens', (SELECT COALESCE(sum(tokens_input + tokens_output), 0) FROM ai_usage_logs WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
        'ai_cost', (SELECT COALESCE(sum(estimated_cost), 0) FROM ai_usage_logs WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
        'total_tenants', (SELECT count(*) FROM tenants WHERE p_tenant_id IS NULL),
        'active_agents', (SELECT count(*) FROM user_profiles WHERE role IN ('agent', 'admin') AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ✅ ANALYTICS SCHEMA READY.
SELECT 'Analytics views and functions created successfully' as status;
