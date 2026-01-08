-- ============================================================================
-- 🚀 TRENDSETTER ENHANCEMENT: AI Intelligence & Data Enrichment
-- ============================================================================
-- Adds columns for AI-driven summaries, lead extraction, and privacy.
-- ============================================================================

BEGIN;

-- 1. Enrichment Columns for AI Insights
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
ADD COLUMN IF NOT EXISTS extracted_lead_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS resolution_category TEXT;

-- 2. Privacy & Deletion Protocol Columns (Soft-Delete)
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 3. Indexes for Filtering & Analytics
CREATE INDEX IF NOT EXISTS idx_chat_sessions_sentiment ON global_chat_sessions(ai_sentiment);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_category ON global_chat_sessions(resolution_category);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_deleted ON global_chat_sessions(is_deleted);

COMMIT;

-- ============================================================================
-- ✅ SUCCESS: Database ready for AI Intelligence layers.
-- ============================================================================
