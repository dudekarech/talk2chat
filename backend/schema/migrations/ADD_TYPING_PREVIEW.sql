-- ============================================================================
-- 🚀 TYPING PREVIEW FEATURE
-- ============================================================================
-- Adds a toggle to enable/disable real-time typing previews for admins.
-- This feature allows agents to see what visitors are typing before they send it.
-- ============================================================================

BEGIN;

-- 1. Add toggle to config
ALTER TABLE global_widget_config 
ADD COLUMN IF NOT EXISTS typing_preview_enabled BOOLEAN DEFAULT true;

-- 2. Add comment
COMMENT ON COLUMN global_widget_config.typing_preview_enabled IS 'If true, visitor keystrokes are broadcasted to agents in real-time.';

COMMIT;

-- ✅ SUCCESS
SELECT 'Typing Preview enabled in schema.' as result;
