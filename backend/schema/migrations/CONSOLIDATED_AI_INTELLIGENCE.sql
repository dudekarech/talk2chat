-- ============================================================================
-- 🚀 CONSOLIDATED: AI CHAT INTELLIGENCE & SESSION LIFECYCLE
-- ============================================================================
-- This migration adds AI enrichment columns and session lifecycle tracking
-- Run this to enable AI-powered summaries, sentiment analysis, and lead extraction
-- ============================================================================

BEGIN;

-- 1. Add AI Enrichment Columns
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
ADD COLUMN IF NOT EXISTS extracted_lead_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS resolution_category TEXT;

-- 2. Add Session Lifecycle Columns
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 3. Update Status Constraint to Include All Statuses
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_status_check;

ALTER TABLE global_chat_sessions 
ADD CONSTRAINT global_chat_sessions_status_check 
CHECK (status IN ('open', 'pending', 'resolved', 'active', 'unassigned', 'escalated', 'waiting', 'completed', 'expired'));

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_ai_sentiment ON global_chat_sessions(ai_sentiment);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_resolution_category ON global_chat_sessions(resolution_category);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_deleted ON global_chat_sessions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_ended_at ON global_chat_sessions(ended_at);

-- 5. Ensure RLS Policy Allows Updates
DROP POLICY IF EXISTS "Allow session updates" ON global_chat_sessions;
CREATE POLICY "Allow session updates" ON global_chat_sessions 
FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Force Schema Reload
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- ✅ SUCCESS: AI Intelligence Layer Activated
-- ============================================================================
-- Columns Added: ai_summary, ai_sentiment, extracted_lead_info, resolution_category
-- Lifecycle Tracking: ended_at, is_deleted, deleted_at
-- Next Step: Resolve a chat to see AI enrichment in action
-- ============================================================================
