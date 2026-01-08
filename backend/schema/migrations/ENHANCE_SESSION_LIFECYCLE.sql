-- ============================================================================
-- 🚀 ENHANCEMENT: Session Lifecycle Management
-- ============================================================================
-- Adds support for session expiration and explicit ending.
-- ============================================================================

BEGIN;

-- 1. Update session status constraint to include 'expired'
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_status_check;

ALTER TABLE global_chat_sessions 
ADD CONSTRAINT global_chat_sessions_status_check 
CHECK (status IN ('open', 'pending', 'resolved', 'active', 'unassigned', 'escalated', 'waiting', 'completed', 'expired'));

-- 2. Add ended_at column to track when a conversation was finished
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- 3. Update existing statuses to be consistent
-- If a session is 'active' but hasn't had activity in 24 hours, marks as expired (fallback)
UPDATE global_chat_sessions 
SET status = 'expired', ended_at = last_activity
WHERE status = 'active' AND last_activity < NOW() - INTERVAL '24 hours';

COMMIT;

-- ============================================================================
-- ✅ SUCCESS: Session lifecycle columns and statuses added.
-- ============================================================================
