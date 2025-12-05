-- ============================================================================
-- CHAT NOTES TABLE - For Agent Internal Notes
-- ============================================================================

-- Create chat_notes table
CREATE TABLE IF NOT EXISTS chat_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES global_chat_sessions(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_notes_session_id ON chat_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_notes_created_by ON chat_notes(created_by);

-- Enable RLS
ALTER TABLE chat_notes ENABLE ROW LEVEL SECURITY;

-- Policies - Allow authenticated users (agents) to view and create notes
CREATE POLICY "agents_can_view_notes"
    ON chat_notes
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "agents_can_create_notes"
    ON chat_notes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "agents_can_update_own_notes"
    ON chat_notes
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "agents_can_delete_own_notes"
    ON chat_notes
    FOR DELETE
    USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_chat_notes_updated_at
    BEFORE UPDATE ON chat_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add escalation fields to global_chat_sessions if not exists
ALTER TABLE global_chat_sessions 
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Add completed_at if not exists
ALTER TABLE global_chat_sessions
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update status enum to include 'escalated'
-- Note: In PostgreSQL, you'd need to add the value to the enum if it exists
-- or make status a TEXT field and use CHECK constraint

COMMENT ON TABLE chat_notes IS 'Internal notes for chat sessions - only visible to agents/admins';
COMMENT ON COLUMN global_chat_sessions.escalated_at IS 'Timestamp when chat was escalated';
COMMENT ON COLUMN global_chat_sessions.completed_at IS 'Timestamp when chat was marked as completed';
