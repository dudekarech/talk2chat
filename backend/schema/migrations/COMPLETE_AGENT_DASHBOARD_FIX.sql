-- ============================================================================
-- COMPLETE SETUP: Fix all Agent Dashboard and Chat issues
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor to fix everything!

-- 1. Drop old status constraint
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_status_check;

-- 2. Add new constraint with all status values
ALTER TABLE global_chat_sessions
ADD CONSTRAINT global_chat_sessions_status_check 
CHECK (status IN ('open', 'active', 'pending', 'waiting', 'resolved', 'completed', 'escalated', 'unassigned'));

-- 3. Add missing columns
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 4. Create agent_stats table
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

-- 5. Create chat_notes table
CREATE TABLE IF NOT EXISTS chat_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES global_chat_sessions(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Disable RLS for development (re-enable for production!)
ALTER TABLE global_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notes DISABLE ROW LEVEL SECURITY;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON global_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_agent ON global_chat_sessions(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_id ON global_chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON global_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_agent_id ON agent_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_date ON agent_stats(date);
CREATE INDEX IF NOT EXISTS idx_chat_notes_session_id ON chat_notes(session_id);

-- 8. Update any existing 'open' sessions to 'active'
UPDATE global_chat_sessions 
SET status = 'active' 
WHERE status = 'open';

-- Done!
SELECT 'Setup complete! Refresh your browser.' AS message;
