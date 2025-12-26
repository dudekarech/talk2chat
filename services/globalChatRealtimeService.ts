import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Types
export interface ChatSession {
    id: string;
    visitor_name: string;
    visitor_email?: string;
    visitor_id: string;
    status: 'open' | 'pending' | 'resolved' | 'active' | 'waiting' | 'unassigned' | 'escalated';
    channel: 'web' | 'mobile';
    assigned_agent_id?: string;
    tenant_id?: string | null;
    tags: string[];
    visitor_metadata: {
        ip?: string;
        location?: string;
        browser?: string;
        platform?: string;
        currentUrl?: string;
        scrollDepth?: number;
        clickCount?: number;
        leadScore?: number;
        industry?: string;
        companySize?: string;
    };
    created_at: string;
    updated_at: string;
    last_activity: string;
}

export interface ChatNote {
    id: string;
    session_id: string;
    note: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    content: string;
    sender_type: 'visitor' | 'agent' | 'system';
    sender_id?: string;
    sender_name: string;
    metadata?: {
        attachment_url?: string;
        attachment_type?: string;
    };
    created_at: string;
}

export interface WidgetConfig {
    id: string;
    primary_color: string;
    background_color: string;
    position: string;
    widget_shape: string;
    team_name: string;
    welcome_message: string;
    pre_chat_message: string;
    auto_open: boolean;
    auto_open_delay: number;
    require_name: boolean;
    require_email: boolean;
    allowed_domains: string[];
    enable_captcha: boolean;
    enabled_24_7: boolean;
}

// Realtime Service Class
class GlobalChatRealtimeService {
    private supabase: SupabaseClient;
    private channels: Map<string, RealtimeChannel> = new Map();

    constructor() {
        this.supabase = supabase;
    }

    /**
     * Subscribe to a specific chat session for real-time updates
     */
    subscribeToSession(
        sessionId: string,
        onMessage: (message: ChatMessage) => void,
        onSessionUpdate?: (session: Partial<ChatSession>) => void
    ): RealtimeChannel {
        const channelName = `session:${sessionId}`;

        // Check if already subscribed
        if (this.channels.has(channelName)) {
            return this.channels.get(channelName)!;
        }

        const channel = this.supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'global_chat_messages',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload) => {
                    console.log('[Realtime] New message:', payload.new);
                    onMessage(payload.new as ChatMessage);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'global_chat_sessions',
                    filter: `id=eq.${sessionId}`
                },
                (payload) => {
                    console.log('[Realtime] Session updated:', payload.new);
                    if (onSessionUpdate) {
                        onSessionUpdate(payload.new as Partial<ChatSession>);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Channel ${channelName} status:`, status);
            });

        this.channels.set(channelName, channel);
        return channel;
    }

    /**
     * Subscribe to all chat sessions (for Global Admin Inbox)
     */
    subscribeToAllSessions(
        onNewSession: (session: ChatSession) => void,
        onMessage: (message: ChatMessage) => void,
        onSessionUpdate: (session: Partial<ChatSession>) => void
    ): RealtimeChannel {
        const channelName = 'all_sessions';

        if (this.channels.has(channelName)) {
            return this.channels.get(channelName)!;
        }

        const channel = this.supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'global_chat_sessions'
                },
                (payload) => {
                    console.log('[Realtime] New session:', payload.new);
                    onNewSession(payload.new as ChatSession);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'global_chat_messages'
                },
                (payload) => {
                    console.log('[Realtime] New message (global):', payload.new);
                    onMessage(payload.new as ChatMessage);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'global_chat_sessions'
                },
                (payload) => {
                    console.log('[Realtime] Session updated (global):', payload.new);
                    onSessionUpdate(payload.new as Partial<ChatSession>);
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Channel ${channelName} status:`, status);
            });

        this.channels.set(channelName, channel);
        return channel;
    }

    /**
     * Unsubscribe from a channel
     */
    unsubscribe(channelName: string) {
        const channel = this.channels.get(channelName);
        if (channel) {
            this.supabase.removeChannel(channel);
            this.channels.delete(channelName);
            console.log(`[Realtime] Unsubscribed from ${channelName}`);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll() {
        this.channels.forEach((channel, name) => {
            this.supabase.removeChannel(channel);
            console.log(`[Realtime] Unsubscribed from ${name}`);
        });
        this.channels.clear();
    }

    /**
     * Create a new chat session
     */
    async createSession(data: {
        visitor_name: string;
        visitor_email?: string;
        visitor_id: string;
        visitor_metadata?: Partial<ChatSession['visitor_metadata']>;
        tenant_id?: string | null;
    }): Promise<{ session: ChatSession | null; error: any }> {
        const { data: session, error } = await this.supabase
            .from('global_chat_sessions')
            .insert({
                visitor_name: data.visitor_name,
                visitor_email: data.visitor_email,
                visitor_id: data.visitor_id,
                status: 'active',
                channel: 'web',
                visitor_metadata: data.visitor_metadata || {},
                tenant_id: data.tenant_id // Critical: Pass tenant_id correctly
            })
            .select()
            .single();

        if (error) {
            console.error('[Realtime] Error creating session:', error);
            return { session: null, error };
        }

        console.log('[Realtime] Session created:', session);
        return { session: session as ChatSession, error: null };
    }

    /**
     * Send a message
     */
    async sendMessage(data: {
        session_id: string;
        content: string;
        sender_type: 'visitor' | 'agent' | 'system';
        sender_id?: string;
        sender_name: string;
    }): Promise<{ message: ChatMessage | null; error: any }> {
        const { data: message, error } = await this.supabase
            .from('global_chat_messages')
            .insert({
                session_id: data.session_id,
                content: data.content,
                sender_type: data.sender_type,
                sender_id: data.sender_id,
                sender_name: data.sender_name,
                metadata: {}
            })
            .select()
            .single();

        if (error) {
            console.error('[Realtime] Error sending message:', error);
            return { message: null, error };
        }

        console.log('[Realtime] Message sent:', message);
        return { message: message as ChatMessage, error: null };
    }

    /**
     * Get all messages for a session
     */
    async getMessages(sessionId: string): Promise<{ messages: ChatMessage[]; error: any }> {
        const { data, error } = await this.supabase
            .from('global_chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Realtime] Error fetching messages:', error);
            return { messages: [], error };
        }

        return { messages: data as ChatMessage[], error: null };
    }

    /**
     * Get all chat sessions
     */
    async getSessions(filters?: {
        status?: 'open' | 'pending' | 'resolved' | 'active';
        assigned_to?: string;
        forceGlobal?: boolean;
    }): Promise<{ sessions: ChatSession[]; error: any }> {
        // Get tenant_id
        let tenantId = null;

        if (!filters?.forceGlobal) {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (user) {
                const { data: profile } = await this.supabase
                    .from('user_profiles')
                    .select('tenant_id')
                    .eq('user_id', user.id)
                    .single();
                tenantId = profile?.tenant_id;
            }
        }

        let query = this.supabase
            .from('global_chat_sessions')
            .select('*')
            .order('last_activity', { ascending: false });

        if (tenantId) {
            // Tenant admin sees their own sessions
            query = query.eq('tenant_id', tenantId);
        } else {
            // Global admin ONLY sees sessions where tenant_id IS NULL
            query = query.is('tenant_id', null);
        }

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.assigned_to) {
            query = query.eq('assigned_agent_id', filters.assigned_to);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Realtime] Error fetching sessions:', error);
            return { sessions: [], error };
        }

        return { sessions: data as ChatSession[], error: null };
    }

    /**
     * Get notes for a session
     */
    async getNotes(sessionId: string): Promise<{ notes: ChatNote[]; error: any }> {
        const { data, error } = await this.supabase
            .from('chat_notes')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });

        return { notes: data as ChatNote[], error };
    }

    /**
     * Add a note to a session
     */
    async addNote(sessionId: string, note: string): Promise<{ note: ChatNote | null; error: any }> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return { note: null, error: 'Not authenticated' };

        const { data, error } = await this.supabase
            .from('chat_notes')
            .insert({
                session_id: sessionId,
                note,
                created_by: user.id
            })
            .select()
            .single();

        return { note: data as ChatNote, error };
    }

    /**
     * Update visitor metadata (Lead Qualification / Metrics)
     */
    async updateVisitorMetadata(sessionId: string, metadata: Partial<ChatSession['visitor_metadata']>) {
        const { data: session } = await this.supabase
            .from('global_chat_sessions')
            .select('visitor_metadata')
            .eq('id', sessionId)
            .single();

        const updatedMetadata = {
            ...(session?.visitor_metadata || {}),
            ...metadata
        };

        return this.updateSession(sessionId, { visitor_metadata: updatedMetadata });
    }

    /**
     * Update session status
     */
    async updateSession(
        sessionId: string,
        updates: Partial<ChatSession>
    ): Promise<{ session: ChatSession | null; error: any }> {
        const { data, error } = await this.supabase
            .from('global_chat_sessions')
            .update(updates)
            .eq('id', sessionId)
            .select()
            .single();

        if (error) {
            console.error('[Realtime] Error updating session:', error);
            return { session: null, error };
        }

        return { session: data as ChatSession, error: null };
    }

    /**
     * Get widget configuration
     */
    async getWidgetConfig(): Promise<{ config: WidgetConfig | null; error: any }> {
        const { data, error } = await this.supabase
            .from('global_widget_config')
            .select('*')
            .eq('config_key', 'global_widget')
            .single();

        if (error) {
            console.error('[Realtime] Error fetching widget config:', error);
            return { config: null, error };
        }

        return { config: data as WidgetConfig, error: null };
    }

    async findOrCreateSession(visitorData: {
        visitor_name: string;
        visitor_email?: string;
        visitor_id: string;
        visitor_metadata?: Partial<ChatSession['visitor_metadata']>;
        tenant_id?: string | null;
    }): Promise<{ session: ChatSession | null; error: any }> {
        // First, try to find an existing active session matching visitor AND tenant_id
        let findQuery = this.supabase
            .from('global_chat_sessions')
            .select('*')
            .eq('visitor_id', visitorData.visitor_id)
            .eq('status', 'active');

        if (visitorData.tenant_id) {
            findQuery = findQuery.eq('tenant_id', visitorData.tenant_id);
        } else {
            findQuery = findQuery.is('tenant_id', null);
        }

        const { data: existingSession } = await findQuery.maybeSingle();

        if (existingSession) {
            console.log('[Realtime] Found existing session:', existingSession);
            return { session: existingSession as ChatSession, error: null };
        }

        // Create new session if none exists
        return this.createSession(visitorData);
    }
}

// Export singleton instance
export const globalChatService = new GlobalChatRealtimeService();
