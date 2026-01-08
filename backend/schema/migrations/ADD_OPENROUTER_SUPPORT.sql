-- ============================================================================
-- 🆕 MIGRATION: Add OpenRouter Support
-- ============================================================================
-- Adds specific column for OpenRouter API key.
-- ============================================================================

BEGIN;

-- 1. Add column for OpenRouter
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT;

-- 2. Add comment for clarity
COMMENT ON COLUMN global_widget_config.openrouter_api_key IS 'API Key for OpenRouter (Aggregator for multiple AI models)';

-- 3. Verify column was added
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_widget_config' AND column_name = 'openrouter_api_key') THEN
        RAISE NOTICE 'SUCCESS: OpenRouter API key column added';
    ELSE
        RAISE EXCEPTION 'FAILURE: Missing openrouter_api_key column';
    END IF;
END $$;

COMMIT;
