-- ============================================================================
-- FIX: Update status constraint to allow 'active'
-- ============================================================================

-- Drop the old constraint
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_status_check;

-- Add new constraint with all status values
ALTER TABLE global_chat_sessions
ADD CONSTRAINT global_chat_sessions_status_check 
CHECK (status IN ('open', 'active', 'pending', 'waiting', 'resolved', 'completed', 'escalated', 'unassigned'));

-- Update any existing 'open' sessions to 'active' so they show in dashboard
UPDATE global_chat_sessions 
SET status = 'active' 
WHERE status = 'open';

COMMENT ON COLUMN global_chat_sessions.status IS 'Chat status - now includes active, pending, waiting, completed, escalated';
