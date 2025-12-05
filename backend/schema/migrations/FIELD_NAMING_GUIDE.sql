-- ============================================================================
-- 🔧 FIX: Understanding the camelCase/snake_case Issue
-- ============================================================================

/*
  THE PROBLEM:
  - The hook `useWidgetConfig` converts ALL field names:
    * Database (snake_case) → UI (camelCase)
    * UI (camelCase) → Database (snake_case)
  
  - So if you use `track_visitors` in the UI component, it will be converted to 
    `trackVisitors` when saving, which won't match the database column `track_visitors`
  
  THE SOLUTION:
  - ALWAYS use camelCase in the component
    * trackVisitors (correct) ✅
    * track_visitors (wrong) ❌

  FIELD NAME CONVERSIONS:
  Database               UI (Component)
  --------------------   --------------------
  track_visitors      → trackVisitors
  track_page_views    → trackPageViews
  auto_open_delay     → autoOpenDelay
  ai_enabled          → aiEnabled
  etc...
*/

-- Run this to see all your current columns:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'global_widget_config'
AND column_name NOT IN ('id', 'config_key', 'created_at', 'updated_at')
ORDER BY column_name;

-- ============================================================================
-- This will show you all field names that the hook will convert to camelCase
-- ============================================================================
