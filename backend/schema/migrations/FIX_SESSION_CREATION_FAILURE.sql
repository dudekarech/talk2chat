-- ============================================================================
-- CRITICAL FIX: Global Chat Sessions Schema Integrity
-- ============================================================================
-- 1. Fix status check constraint to support 'active' status
-- 2. Fix visitor_id uniqueness to support multi-tenancy (visitor can have sessions with multiple tenants)
-- ============================================================================

BEGIN;

-- Step 1: Update status check constraint
-- First drop the old one
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_status_check;

-- Add updated check constraint
ALTER TABLE global_chat_sessions 
ADD CONSTRAINT global_chat_sessions_status_check 
CHECK (status IN ('open', 'pending', 'resolved', 'active'));

-- Step 2: Fix visitor_id uniqueness
-- Drop the old unique constraint (which was global across all tenants)
ALTER TABLE global_chat_sessions 
DROP CONSTRAINT IF EXISTS global_chat_sessions_visitor_id_key;

-- Create a new unique index that is tenant-aware
-- Postgres handles NULLs in unique indexes (multiple NULLs are allowed unless we use a partial index)
-- But we want a visitor to have ONLY ONE active session per tenant context
DROP INDEX IF EXISTS idx_visitor_tenant_unique;
CREATE UNIQUE INDEX idx_visitor_tenant_unique 
ON global_chat_sessions (visitor_id, tenant_id) 
WHERE status = 'active' OR status = 'open';

-- Step 3: Ensure data consistency for existing sessions
-- If there are sessions with 'open' status, migrate them to 'active' for consistency with current code
UPDATE global_chat_sessions SET status = 'active' WHERE status = 'open';

-- Step 4: Verify the fix
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'global_chat_sessions' AND constraint_name = 'global_chat_sessions_status_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'SUCCESS: Status check constraint updated';
    ELSE
        RAISE EXCEPTION 'FAILURE: Status check constraint not found';
    END IF;
END $$;

COMMIT;
