-- ============================================================================
-- 🚀 FIX: Chat Message Sender Type Constraint
-- ============================================================================
-- The previous constraint was missing the 'ai' type, causing inserts to fail.
-- This migration updates the constraint to support all necessary types.
-- ============================================================================

BEGIN;

-- 1. Drop the old constraint
ALTER TABLE global_chat_messages 
DROP CONSTRAINT IF EXISTS global_chat_messages_sender_type_check;

-- 2. Add the comprehensive constraint
ALTER TABLE global_chat_messages 
ADD CONSTRAINT global_chat_messages_sender_type_check 
CHECK (sender_type IN ('visitor', 'agent', 'system', 'ai'));

-- 3. Also fix the session status constraint just in case
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_status_check;

ALTER TABLE global_chat_sessions 
ADD CONSTRAINT global_chat_sessions_status_check 
CHECK (status IN ('open', 'pending', 'resolved', 'active', 'unassigned', 'escalated', 'waiting', 'completed'));

COMMIT;

-- ============================================================================
-- ✅ SUCCESS: Database constraints updated. 
-- Now the AI Assistant can successfully save messages to the database.
-- ============================================================================
