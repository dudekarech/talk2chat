-- ============================================================================
-- 🆕 MIGRATION: Global Notification System
-- ============================================================================
-- This migration adds support for:
-- 1. System notifications (sent by global admin to tenants)
-- 2. Reading status tracking
-- 3. Support tickets (raised by tenants to global admin)
-- ============================================================================

BEGIN;

-- 1. System Notifications Table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('announcement', 'update', 'alert', 'ticket_response')),
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'tenant', 'tier')),
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    target_tier TEXT,
    sender_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Notification Read Status Table (Tracks if a user has seen a notification)
CREATE TABLE IF NOT EXISTS system_notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES system_notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, user_id)
);

-- 3. Support Tickets Table (Tenant -> Global Admin)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ticket Comments Table
CREATE TABLE IF NOT EXISTS support_ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies for system_notifications
CREATE POLICY "Tenants can view relevant notifications" ON system_notifications
    FOR SELECT USING (
        target_type = 'all' OR 
        target_tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()) OR
        target_tier = (SELECT subscription_plan FROM tenants WHERE id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()))
    );

CREATE POLICY "Global Admin can manage notifications" ON system_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Policies for reading status
CREATE POLICY "Users can manage their own read status" ON system_notification_reads
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all read statuses" ON system_notification_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Policies for support tickets
CREATE POLICY "Tenants can manage their own tickets" ON support_tickets
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Global Admin can manage all tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Policies for ticket comments
CREATE POLICY "Tenants can manage their own ticket comments" ON support_ticket_comments
    FOR ALL USING (
        ticket_id IN (
            SELECT id FROM support_tickets 
            WHERE tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Global Admin can manage all ticket comments" ON support_ticket_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

COMMIT;
