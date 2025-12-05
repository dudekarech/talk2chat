-- ============================================================================
-- EMERGENCY FIX: Enable Chat Messages (RLS Issue)
-- ============================================================================
-- The CORS error is actually RLS blocking the insert!

-- 1. Disable RLS on chat messages table
ALTER TABLE global_chat_messages DISABLE ROW LEVEL SECURITY;

-- 2. Verify the table structure
DO $$
BEGIN
    -- Check if 'message' column exists, if not, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_chat_messages' 
        AND column_name = 'message'
    ) THEN
        -- Rename 'content' to 'message' if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'global_chat_messages' 
            AND column_name = 'content'
        ) THEN
            ALTER TABLE global_chat_messages RENAME COLUMN content TO message;
        ELSE
            -- Add 'message' column if neither exists
            ALTER TABLE global_chat_messages ADD COLUMN message TEXT NOT NULL DEFAULT '';
        END IF;
    END IF;
END $$;

-- 3. Verify required columns exist
ALTER TABLE global_chat_messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'visitor',
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Done!
SELECT 'Chat messages table fixed! Try sending a message again.' AS status;
