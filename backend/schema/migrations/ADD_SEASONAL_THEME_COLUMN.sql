-- ============================================================================
-- 🆕 MIGRATION: Add Seasonal Decorations Support
-- ============================================================================
-- This migration adds support for seasonal decorations on the chat widget.
-- ============================================================================

BEGIN;

-- Step 1: Add seasonal_theme column to global_widget_config
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS seasonal_theme TEXT DEFAULT 'none';

-- Step 2: Add comment for clarity
COMMENT ON COLUMN global_widget_config.seasonal_theme IS 'Current seasonal theme for the widget (e.g., christmas, halloween, easter, none)';

COMMIT;
