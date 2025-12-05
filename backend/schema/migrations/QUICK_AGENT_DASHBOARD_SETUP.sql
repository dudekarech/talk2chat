-- ============================================================================
-- QUICK SETUP: Create all required tables for Agent Dashboard
-- ============================================================================

-- 1. Create agent_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_chats INTEGER DEFAULT 0,
    active_chats INTEGER DEFAULT 0,
    completed_chats INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    satisfaction_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, date)
);

-- 2. Ensure global_chat_sessions has required fields
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES auth.users(id);

-- 3. Disable RLS for development (re-enable for production)
ALTER TABLE agent_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_messages DISABLE ROW LEVEL SECURITY;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_stats_agent_id ON agent_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_date ON agent_stats(date);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON global_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_agent ON global_chat_sessions(assigned_agent_id);

COMMENT ON TABLE agent_stats IS 'Agent performance metrics (RLS disabled for dev)';
