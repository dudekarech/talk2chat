-- ============================================================================
-- 🔧 FIX: Remove Duplicate Widget Config Rows
-- ============================================================================
-- This fixes the "Cannot coerce to single JSON object" error
-- by removing duplicates and adding a unique constraint
-- ============================================================================

-- ⚠️ COPY AND RUN EVERYTHING BELOW THIS LINE IN SUPABASE SQL EDITOR ⚠️

-- Step 1: Delete duplicate rows (keep only one)
DELETE FROM global_widget_config
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM global_widget_config
    WHERE config_key = 'global_widget'
    GROUP BY config_key
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE global_widget_config
DROP CONSTRAINT IF EXISTS global_widget_config_config_key_key;

ALTER TABLE global_widget_config
ADD CONSTRAINT global_widget_config_config_key_key UNIQUE (config_key);

-- Step 3: Verify only one row exists
SELECT COUNT(*) as row_count, config_key
FROM global_widget_config
WHERE config_key = 'global_widget'
GROUP BY config_key;

-- ============================================================================
-- ✅ You should see exactly 1 row with config_key = 'global_widget'
-- ============================================================================
