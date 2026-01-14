-- ============================================================================
-- 🔧 FIX: Add OpenRouter Support (Idempotent)
-- ============================================================================
-- Ensures the OpenRouter API key column exists in global_widget_config
-- ============================================================================

BEGIN;

-- 1. Add column for OpenRouter if it doesn't exist
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT;

-- 2. Add comment for clarity
COMMENT ON COLUMN global_widget_config.openrouter_api_key IS 'API Key for OpenRouter (Aggregator for multiple AI models)';

-- 3. Verify column was added
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_widget_config' AND column_name = 'openrouter_api_key') THEN
        RAISE NOTICE 'SUCCESS: OpenRouter API key column verified.';
    ELSE
        RAISE EXCEPTION 'FAILURE: openrouter_api_key column could not be created.';
    END IF;
END $$;

COMMIT;
