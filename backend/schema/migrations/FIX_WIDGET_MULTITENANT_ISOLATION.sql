-- ============================================================================
-- CRITICAL FIX: Widget Configuration Multi-Tenant Isolation
-- ============================================================================
-- This migration fixes the critical bug where tenants and global admin
-- were modifying each other's widget configurations.
--
-- Run this IMMEDIATELY to prevent data corruption
-- ============================================================================

BEGIN;

-- Step 1: Audit current state
-- Show all widget configs (for logging purposes)
SELECT 
    id,
    config_key,
    tenant_id,
    team_name,
    primary_color,
    updated_at
FROM global_widget_config
ORDER BY tenant_id NULLS FIRST;

-- Step 2: Ensure global config exists with NULL tenant_id
-- Check if there's a global config
DO $$
BEGIN
    -- If no global config exists, create it
    IF NOT EXISTS (
        SELECT 1 FROM global_widget_config 
        WHERE config_key = 'global_widget' AND tenant_id IS NULL
    ) THEN
        INSERT INTO global_widget_config (
            config_key,
            tenant_id,
            primary_color,
            secondary_color,
            team_name,
            welcome_message
        ) VALUES (
            'global_widget',
            NULL,
            '#8b5cf6',
            '#ec4899',
            'TalkChat Support',
            'Hi! Welcome to TalkChat Studio. How can we help you today?'
        );
        RAISE NOTICE 'Created global widget config';
    ELSE
        RAISE NOTICE 'Global widget config already exists';
    END IF;
END $$;

-- Step 3: Fix any tenant configs that might have wrong config_key
-- Tenant configs should have config_key = 'tenant_' + tenant_id
UPDATE global_widget_config
SET config_key = 'tenant_' || tenant_id
WHERE tenant_id IS NOT NULL 
  AND config_key != 'tenant_' || tenant_id;

-- Step 4: Remove old unique constraint on config_key only
ALTER TABLE global_widget_config
DROP CONSTRAINT IF EXISTS global_widget_config_config_key_key;

-- Step 5: Create partial unique indexes for proper isolation
-- Global config: Only ONE record with config_key='global_widget' and tenant_id IS NULL
DROP INDEX IF EXISTS unique_global_widget_config;
CREATE UNIQUE INDEX unique_global_widget_config 
ON global_widget_config (config_key) 
WHERE tenant_id IS NULL;

-- Tenant configs: One config per tenant
DROP INDEX IF EXISTS unique_tenant_widget_config;
CREATE UNIQUE INDEX unique_tenant_widget_config 
ON global_widget_config (tenant_id) 
WHERE tenant_id IS NOT NULL;

-- Step 6: Add check constraint to ensure data integrity
ALTER TABLE global_widget_config
DROP CONSTRAINT IF EXISTS check_widget_config_tenant_key;

ALTER TABLE global_widget_config
ADD CONSTRAINT check_widget_config_tenant_key CHECK (
    -- Global config must have NULL tenant_id and config_key = 'global_widget'
    (tenant_id IS NULL AND config_key = 'global_widget')
    OR
    -- Tenant config must have non-NULL tenant_id and config_key = 'tenant_' + tenant_id
    (tenant_id IS NOT NULL AND config_key = 'tenant_' || tenant_id)
);

-- Step 7: Verify the fix
DO $$
DECLARE
    global_count INT;
    tenant_count INT;
    invalid_count INT;
BEGIN
    -- Count global configs (should be exactly 1)
    SELECT COUNT(*) INTO global_count
    FROM global_widget_config
    WHERE tenant_id IS NULL;

    -- Count tenant configs
    SELECT COUNT(*) INTO tenant_count
    FROM global_widget_config
    WHERE tenant_id IS NOT NULL;

    -- Count invalid configs (should be 0)
    SELECT COUNT(*) INTO invalid_count
    FROM global_widget_config
    WHERE (tenant_id IS NULL AND config_key != 'global_widget')
       OR (tenant_id IS NOT NULL AND config_key != 'tenant_' || tenant_id);

    RAISE NOTICE '========== VERIFICATION ==========';
    RAISE NOTICE 'Global configs: % (should be 1)', global_count;
    RAISE NOTICE 'Tenant configs: %', tenant_count;
    RAISE NOTICE 'Invalid configs: % (should be 0)', invalid_count;
    RAISE NOTICE '==================================';

    IF global_count != 1 THEN
        RAISE EXCEPTION 'ERROR: Expected exactly 1 global config, found %', global_count;
    END IF;

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Found % invalid configs', invalid_count;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- Post-Migration Verification
-- ============================================================================
-- Run this query after migration to verify everything is correct:
--
-- SELECT 
--     CASE 
--         WHEN tenant_id IS NULL THEN 'GLOBAL'
--         ELSE 'TENANT: ' || tenant_id::TEXT
--     END as config_type,
--     config_key,
--     team_name,
--     primary_color,
--     updated_at
-- FROM global_widget_config
-- ORDER BY tenant_id NULLS FIRST;
--
-- Expected output:
-- - Exactly ONE row with config_type = 'GLOBAL'
-- - One row per tenant with config_type = 'TENANT: <uuid>'
-- ============================================================================
