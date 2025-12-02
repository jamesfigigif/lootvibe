-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('INVENTORY_ADDED', 'ITEM_SHIPPED', 'DEPOSIT_CONFIRMED', 'WITHDRAWAL_APPROVED', 'BATTLE_WON', 'GENERAL')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like item_id, box_id, etc.
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Note: RLS is disabled because this app uses Clerk for authentication, not Supabase Auth
-- Application-level security ensures users can only access their own notifications
-- (by filtering by user_id in queries and ensuring user_id matches logged-in user)

-- Disable RLS (since Clerk is used instead of Supabase Auth)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Service role can do anything (functions use this)

