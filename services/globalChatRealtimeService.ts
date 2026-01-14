import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { aiService } from './aiService';
import { supabase } from './supabaseClient';

// Export supabase from central client to avoid multiple instances
export { supabase };

// Types
export interface ChatSession {
    id: string;
    visitor_name: string;
    visitor_email?: string;
    visitor_id: string;
    status: 'open' | 'pending' | 'resolved' | 'active' | 'waiting' | 'unassigned' | 'escalated' | 'expired';
    channel: 'web' | 'mobile';
    assigned_to?: string;
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
    ended_at?: string;
    is_deleted?: boolean;
    deleted_at?: string;
    // AI Enrichment Fields
    ai_summary?: string;
    ai_sentiment?: string;
    extracted_lead_info?: {
        email?: string;
        phone?: string;
        company?: string;
        name?: string;
    };
    resolution_category?: string;
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
    sender_type: 'visitor' | 'agent' | 'system' | 'ai';
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
    ai_enabled?: boolean;
    ai_provider?: string;
    ai_model?: string;
    ai_api_key?: string;
    openrouter_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    mistral_api_key?: string;
    deepseek_api_key?: string;
    ai_knowledge_base?: string;
    tenant_id?: string | null;
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
        sender_type: 'visitor' | 'agent' | 'system' | 'ai';
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
            query = query.eq('assigned_to', filters.assigned_to);
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
        try {
            const { data: session, error: fetchError } = await this.supabase
                .from('global_chat_sessions')
                .select('visitor_metadata')
                .eq('id', sessionId)
                .maybeSingle();

            if (fetchError) {
                console.warn('[Realtime] Failed to fetch existing metadata:', fetchError);
            }

            const updatedMetadata = {
                ...(session?.visitor_metadata || {}),
                ...metadata
            };

            return this.updateSession(sessionId, { visitor_metadata: updatedMetadata });
        } catch (error) {
            console.error('[Realtime] Exception in updateVisitorMetadata:', error);
            return { session: null, error };
        }
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
    /**
     * Get widget configuration (tenant-aware)
     */
    async getWidgetConfig(): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            let tenantId = null;

            if (user) {
                const { data: profile } = await this.supabase
                    .from('user_profiles')
                    .select('tenant_id')
                    .eq('user_id', user.id)
                    .single();
                tenantId = profile?.tenant_id;
            }

            let query = this.supabase
                .from('global_widget_config')
                .select('*');

            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            } else {
                query = query.eq('config_key', 'global_widget').is('tenant_id', null);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error('[Realtime] Error fetching widget config:', error);
                return { config: null, error };
            }

            return { config: data as WidgetConfig, error: null };
        } catch (error) {
            console.error('[Realtime] Exception in getWidgetConfig:', error);
            return { config: null, error };
        }
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
            // CHECK EXPIRATION: If 30 minutes of inactivity, mark as expired and start fresh
            const lastActivity = new Date(existingSession.last_activity).getTime();
            const now = new Date().getTime();
            const inactiveMinutes = (now - lastActivity) / (1000 * 60);

            if (inactiveMinutes > 30) {
                console.log(`[Realtime] Session ${existingSession.id} expired (${Math.round(inactiveMinutes)}m inactive). Starting fresh.`);
                await this.updateSession(existingSession.id, {
                    status: 'expired',
                    ended_at: new Date().toISOString()
                });
            } else {
                console.log('[Realtime] Found existing session:', existingSession);
                return { session: existingSession as ChatSession, error: null };
            }
        }

        // Create new session if none exists or previous expired
        return this.createSession(visitorData);
    }

    /**
     * Explicitly end a session with AI analysis enrichment
     */
    async endSession(sessionId: string): Promise<{ success: boolean; error: any }> {
        console.log('[Realtime] Ending session and starting AI enrichment:', sessionId);

        // 1. Mark as resolved immediately for UI responsiveness
        const { error: updateError } = await this.updateSession(sessionId, {
            status: 'resolved',
            ended_at: new Date().toISOString()
        });

        if (updateError) return { success: false, error: updateError };

        // 2. Perform AI Analysis Background Task (don't await to avoid blocking UI)
        this.enrichSessionWithAI(sessionId).catch(err =>
            console.error('[Realtime] AI Enrichment failed:', err)
        );

        return { success: true, error: null };
    }

    /**
     * Background task to summarize and extract info from a chat
     */
    private async enrichSessionWithAI(sessionId: string) {
        // Fetch messages for transcript
        const { messages } = await this.getMessages(sessionId);
        if (!messages || messages.length === 0) return;

        const transcript = messages
            .map(m => `${m.sender_name}: ${m.content}`)
            .join('\n');

        // Fetch widget config to get tenant setting
        const { config } = await this.getWidgetConfig();
        const tenant_id = config?.tenant_id || null;

        // Use AI Proxy with the session's tenant_id
        const analysis = await aiService.analyzeChatTranscript(
            transcript,
            tenant_id // Pass tenant_id for secure server-side key fetching
        );

        // Save enrichment data
        await this.updateSession(sessionId, {
            ai_summary: analysis.summary,
            ai_sentiment: analysis.sentiment,
            extracted_lead_info: analysis.leads,
            resolution_category: analysis.category
        } as any);

        console.log('[Realtime] AI Enrichment complete for:', sessionId);
    }

    /**
     * Soft delete a session (Deletion Protocol)
     */
    async softDeleteSession(sessionId: string): Promise<{ success: boolean; error: any }> {
        const { error } = await this.updateSession(sessionId, {
            is_deleted: true,
            deleted_at: new Date().toISOString()
        } as any);

        return { success: !error, error };
    }
}

// Export singleton instance
export const globalChatService = new GlobalChatRealtimeService();
