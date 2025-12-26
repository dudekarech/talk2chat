-- ============================================================================
-- 🆕 MIGRATION: Add AI API Key and Knowledge Base Columns
-- ============================================================================
-- This migration adds support for:
-- 1. Tenant-specific AI API keys (Google Gemini, OpenAI, etc.)
-- 2. Knowledge Base (training data for the AI Bot)
-- 3. Structured FAQs for quick responses
-- ============================================================================

BEGIN;

-- Step 1: Add columns to global_widget_config
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS ai_api_key TEXT,
ADD COLUMN IF NOT EXISTS ai_knowledge_base TEXT,
ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add comments for clarity
COMMENT ON COLUMN global_widget_config.ai_api_key IS 'Tenant-specific API key for AI provider (encrypted at rest if possible)';
COMMENT ON COLUMN global_widget_config.ai_knowledge_base IS 'Custom instructions and knowledge data to train the AI bot';
COMMENT ON COLUMN global_widget_config.faqs IS 'Structured FAQ data for quick responses and AI training';

-- Step 3: Verify the fix
DO $$
DECLARE
    column_exists_api_key BOOLEAN;
    column_exists_kb BOOLEAN;
    column_exists_faqs BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_widget_config' AND column_name = 'ai_api_key') INTO column_exists_api_key;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_widget_config' AND column_name = 'ai_knowledge_base') INTO column_exists_kb;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_widget_config' AND column_name = 'faqs') INTO column_exists_faqs;

    IF column_exists_api_key AND column_exists_kb AND column_exists_faqs THEN
        RAISE NOTICE 'SUCCESS: AI columns added to global_widget_config';
    ELSE
        RAISE EXCEPTION 'FAILURE: One or more columns could not be added';
    END IF;
END $$;

COMMIT;
