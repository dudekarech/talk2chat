import { supabase } from './supabaseClient';

export interface SystemNotification {
    id: string;
    title: string;
    content: string;
    type: 'announcement' | 'update' | 'alert' | 'ticket_response';
    target_type: 'all' | 'tenant' | 'tier';
    target_tenant_id?: string;
    target_tier?: string;
    sender_id?: string;
    created_at: string;
    is_read?: boolean;
}

export interface SupportTicket {
    id: string;
    tenant_id: string;
    user_id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
}

export class NotificationService {
    /**
     * Send a notification (Global Admin only)
     */
    async sendNotification(notification: Partial<SystemNotification>) {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('system_notifications')
            .insert({
                ...notification,
                sender_id: user?.id
            })
            .select()
            .single();

        return { data, error };
    }

    /**
     * Fetch notifications for the current user
     */
    async getNotifications() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: [], error: 'Not authenticated' };

        // Get notifications and then check read status
        const { data: notifications, error } = await supabase
            .from('system_notifications')
            .select(`
                *,
                system_notification_reads(user_id)
            `)
            .order('created_at', { ascending: false });

        if (error) return { data: [], error };

        const formatted = notifications.map(n => ({
            ...n,
            is_read: n.system_notification_reads?.some((r: any) => r.user_id === user.id)
        }));

        return { data: formatted, error: null };
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { error } = await supabase
            .from('system_notification_reads')
            .upsert({
                notification_id: notificationId,
                user_id: user.id
            });

        return { error };
    }

    /**
     * Get unread count
     */
    async getUnreadCount() {
        const { data } = await this.getNotifications();
        return data?.filter(n => !n.is_read).length || 0;
    }

    /**
     * Create a support ticket (Tenant)
     */
    async createTicket(ticket: Partial<SupportTicket>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: 'Not authenticated' } };

        // Fetch tenant_id from user profile explicitly
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile?.tenant_id) {
            return { error: { message: profileError?.message || 'Tenant ID not found for user. Please ensure your account is linked to a company.' } };
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                ...ticket,
                user_id: user.id,
                tenant_id: profile.tenant_id
            })
            .select()
            .single();

        return { data, error };
    }

    /**
     * Get tickets for current tenant
     */
    async getMyTickets() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        return { data, error };
    }

    /**
     * Get all tickets (Global Admin or Tenant Admin/Agent)
     */
    async getAllTickets(isGlobal: boolean = true) {
        let query = supabase
            .from('support_tickets')
            .select(`
                *,
                tenants(name)
            `)
            .order('created_at', { ascending: false });

        if (!isGlobal) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { data: [], error: 'Not authenticated' };

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            } else {
                return { data: [], error: 'Tenant context required' };
            }
        }

        const { data, error } = await query;
        return { data, error };
    }

    /**
     * Update ticket (Global Admin or Tenant Admin)
     */
    async updateTicket(ticketId: string, updates: Partial<SupportTicket>) {
        const { data, error } = await supabase
            .from('support_tickets')
            .update(updates)
            .eq('id', ticketId)
            .select()
            .single();

        return { data, error };
    }

    /**
     * Assign agent to ticket
     */
    async assignTicketAgent(ticketId: string, agentId: string) {
        return this.updateTicket(ticketId, {
            assigned_agent_id: agentId as any, // Cast to any as SupportTicket interface might need update
            status: 'in_progress'
        });
    }

    /**
     * Get agents/team members
     */
    async getAgents(tenantId?: string | null) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: [], error: 'Not authenticated' };

        let query = supabase
            .from('user_profiles')
            .select('user_id, name, email, role, tenant_id')
            .in('role', ['admin', 'agent', 'manager', 'super_admin']);

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        } else if (tenantId === null) {
            query = query.is('tenant_id', null);
        } else {
            // Fallback: try to find current user's tenant if not specified
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();

            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            } else {
                query = query.is('tenant_id', null);
            }
        }

        const { data, error } = await query;
        return { data, error };
    }
}

export const notificationService = new NotificationService();
