-- ============================================================================
-- 🆕 MIGRATION: Enhance Agent Management and Ticketing
-- ============================================================================

BEGIN;

-- 1. Add assigned_agent_id to support_tickets
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES auth.users(id);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_agent ON support_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- 3. Add default tags if they don't exist in global_chat_sessions (already added in previous migration but ensuring)
-- ALTER TABLE global_chat_sessions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 4. Enable RLS for ticket comments for agents (verify existing policies)
-- The existing policy for support_ticket_comments:
-- FOR ALL USING (ticket_id IN (SELECT id FROM support_tickets WHERE tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid())))
-- This should work for both Tenant Admins and Agents of the same tenant.

-- 5. Add a function to qualify leads (update visitor metadata) - usually handled via direct updates but adding a helper
CREATE OR REPLACE FUNCTION update_visitor_meta(session_id UUID, new_metadata JSONB)
RETURNS void AS $$
BEGIN
    UPDATE global_chat_sessions
    SET visitor_metadata = visitor_metadata || new_metadata
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
