-- ============================================================================
-- 🆕 MIGRATION: Add Support for Multiple AI Providers
-- ============================================================================
-- Adds specific columns for different AI provider API keys to allow 
-- users to store multiple keys and switch between providers seamlessly.
-- ============================================================================

BEGIN;

-- 1. Add columns for different AI providers
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT,
ADD COLUMN IF NOT EXISTS mistral_api_key TEXT,
ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;

-- 2. Add comments for clarity
COMMENT ON COLUMN global_widget_config.openai_api_key IS 'API Key for OpenAI (GPT-4, GPT-4o, etc.)';
COMMENT ON COLUMN global_widget_config.anthropic_api_key IS 'API Key for Anthropic (Claude 3.5, etc.)';
COMMENT ON COLUMN global_widget_config.mistral_api_key IS 'API Key for Mistral AI';
COMMENT ON COLUMN global_widget_config.deepseek_api_key IS 'API Key for DeepSeek';

-- 3. Verify columns were added
DO $$
DECLARE
    cols_count INTEGER;
BEGIN
    SELECT count(*) INTO cols_count 
    FROM information_schema.columns 
    WHERE table_name = 'global_widget_config' 
    AND column_name IN ('openai_api_key', 'anthropic_api_key', 'mistral_api_key', 'deepseek_api_key');

    IF cols_count >= 4 THEN
        RAISE NOTICE 'SUCCESS: Multiple AI provider API key columns added';
    ELSE
        RAISE EXCEPTION 'FAILURE: Missing columns. Only % out of 4 added', cols_count;
    END IF;
END $$;

COMMIT;
