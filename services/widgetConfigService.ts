import { supabase } from './globalChatRealtimeService';

export interface WidgetConfig {
    id: string;
    tenant_id?: string;
    config_key: string;

    // Appearance
    primary_color: string;
    secondary_color: string;
    background_color: string;
    position: string;
    widget_shape: string;
    font_size: string;
    theme: string;

    // Branding
    team_name: string;
    company_logo: string;
    avatar_style: string;
    show_powered_by: boolean;

    // Content
    welcome_message: string;
    offline_message: string;
    pre_chat_message: string;
    thank_you_message: string;

    // Behavior
    auto_open: boolean;
    auto_open_delay: number;
    auto_open_on_scroll: boolean;
    scroll_percentage: number;
    show_on_pages: string;
    hide_on_mobile: boolean;
    sound_notifications: boolean;

    // Pre-Chat Form
    require_name: boolean;
    require_email: boolean;
    require_phone: boolean;
    custom_fields: any[];

    // AI Features
    ai_enabled: boolean;
    ai_provider: string;
    ai_model: string;
    ai_temperature: number;
    ai_auto_respond: boolean;
    ai_greeting: boolean;
    ai_smart_suggestions: boolean;
    ai_sentiment_analysis: boolean;
    ai_language_detection: boolean;
    ai_api_key?: string;
    ai_knowledge_base?: string;

    // Quick Replies & Canned Responses
    enable_canned_responses: boolean;
    canned_responses: Array<{ id: string; shortcut: string; text: string; category: string }>;
    quick_replies: Array<{ id: string; text: string; category: string }>;
    faqs: Array<{ question: string; answer: string; category: string }>;

    // Visitor Tracking
    track_visitors: boolean;
    track_page_views: boolean;
    track_mouse_movement: boolean;
    track_clicks: boolean;
    track_scroll_depth: boolean;
    track_time_on_page: boolean;
    capture_screenshots: boolean;
    session_recording: boolean;

    // Visitor Intelligence
    show_visitor_info: boolean;
    show_location: boolean;
    show_device: boolean;
    show_browser: boolean;
    show_referrer: boolean;
    show_previous_visits: boolean;
    enrich_visitor_data: boolean;

    // Notifications
    email_notifications: boolean;
    desktop_notifications: boolean;
    mobile_notifications: boolean;
    notify_on_new_chat: boolean;
    notify_on_message: boolean;
    notification_sound: string;

    // Integrations
    google_analytics: string;
    facebook_pixel: string;
    webhook_url: string;
    zapier_enabled: boolean;

    // Security
    allowed_domains: string[];
    enable_captcha: boolean;
    captcha_provider: string;
    rate_limit: number;
    block_vpn: boolean;
    ip_whitelist: string[];

    // Business Hours
    enabled_24_7: boolean;
    timezone: string;
    business_hours: {
        [key: string]: {
            enabled: boolean;
            start: string;
            end: string;
        };
    };

    // Advanced
    typing_indicator: boolean;
    read_receipts: boolean;
    file_upload: boolean;
    max_file_size: number;
    allowed_file_types: string[];
    emoji_picker: boolean;
    message_character_limit: number;

    updated_at: string;
}

class WidgetConfigService {
    private async getTenantId(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('[WidgetConfig] No authenticated user - returning NULL (global admin fallback)');
            return null;
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id, role, name')
            .eq('user_id', user.id)
            .single();

        const tenantId = profile?.tenant_id || null;

        console.log('[WidgetConfig] ========== TENANT CONTEXT ==========');
        console.log('[WidgetConfig] User ID:', user.id);
        console.log('[WidgetConfig] User Email:', user.email);
        console.log('[WidgetConfig] Profile Name:', profile?.name);
        console.log('[WidgetConfig] Profile Role:', profile?.role);
        console.log('[WidgetConfig] Tenant ID:', tenantId);
        console.log('[WidgetConfig] Is Global Admin:', tenantId === null);
        console.log('[WidgetConfig] =====================================');

        return tenantId;
    }

    /**
     * Get widget configuration
     */
    async getConfig(tenantIdOverride?: string | null): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            // Use override if provided (even if null), otherwise try to get from current user session
            const tenantId = tenantIdOverride !== undefined ? tenantIdOverride : await this.getTenantId();

            console.log('[WidgetConfig] Getting config for tenantId:', tenantId);

            let query = supabase
                .from('global_widget_config')
                .select('*');

            if (tenantId) {
                // TENANT: Get configuration for specific tenant
                query = query.eq('tenant_id', tenantId);
                console.log('[WidgetConfig] Querying for tenant:', tenantId);
            } else {
                // GLOBAL ADMIN: Get configuration for landing page ONLY
                // CRITICAL: Must explicitly check tenant_id IS NULL
                query = query.eq('config_key', 'global_widget').is('tenant_id', null);
                console.log('[WidgetConfig] Querying for global config (tenant_id IS NULL)');
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                // If no config exists, create one with defaults
                if (error.code === 'PGRST116') {
                    console.log('[WidgetConfig] No config found, creating default');
                    return this.createDefaultConfig(tenantId);
                }
                console.error('[WidgetConfig] Error fetching config:', error);
                return { config: null, error };
            }

            if (!data && tenantId) {
                // If no data found but we have a tenantId, create default
                console.log('[WidgetConfig] No tenant config found, creating default');
                return this.createDefaultConfig(tenantId);
            }

            if (!data && !tenantId) {
                // If no global config found, create it
                console.log('[WidgetConfig] No global config found, creating default');
                return this.createDefaultConfig(null);
            }

            console.log('[WidgetConfig] Config loaded:', data);
            return { config: data as WidgetConfig, error: null };
        } catch (err) {
            console.error('[WidgetConfig] Exception fetching config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Get GLOBAL widget configuration (for landing page)
     * This ALWAYS returns the global config regardless of logged-in user
     * CRITICAL: Landing page must NEVER use tenant configs
     */
    async getGlobalConfig(): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            console.log('[WidgetConfig] Getting GLOBAL config (forcing tenant_id IS NULL)');

            const { data, error } = await supabase
                .from('global_widget_config')
                .select('*')
                .eq('config_key', 'global_widget')
                .is('tenant_id', null)
                .maybeSingle();

            if (error) {
                console.error('[WidgetConfig] Error fetching global config:', error);
                return { config: null, error };
            }

            if (!data) {
                console.log('[WidgetConfig] No global config found, creating default');
                return this.createDefaultConfig(null);
            }

            console.log('[WidgetConfig] Global config loaded:', data);
            return { config: data as WidgetConfig, error: null };
        } catch (err) {
            console.error('[WidgetConfig] Exception fetching global config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Create default configuration
     */
    async createDefaultConfig(tenantId: string | null): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            const isGlobal = !tenantId;
            const defaultConfig = {
                config_key: tenantId ? `tenant_${tenantId}` : 'global_widget',
                tenant_id: tenantId,
                ai_enabled: isGlobal, // Enable AI by default for global admin
                ai_provider: 'gemini',
                ai_model: 'gemini-1.5-flash',
                ai_temperature: 0.7,
                ai_auto_respond: isGlobal,
                ai_greeting: isGlobal,
                ai_knowledge_base: isGlobal ?
                    `You are the official TalkChat Studio assistant. TalkChat is a premium omnichannel customer support platform.
Features: 
- Multi-channel support (Web, WhatsApp, Facebook, Instagram)
- AI-powered responses with bot-to-human handover
- Real-time visitor tracking and analytics
- Dedicated team mailboxes
- Easy widget embedding

Pricing: 
- Free: 5 agents, basic features
- Pro: $49/mo, unlimited agents, AI assistant
- Enterprise: Contact us for custom pricing

Goal: Be helpful, answer questions about TalkChat. 
IMPORTANT: Your goal is to generate leads. If a user seems interested, kindly ask for their official email and phone number if they haven't provided it yet. Say you'll have a human specialist reach out to them.` : '',
                faqs: isGlobal ? [
                    { question: 'What is TalkChat?', answer: 'TalkChat is an omnichannel customer support platform that integrates Web Chat, WhatsApp, and Social Media into one inbox.', category: 'General' },
                    { question: 'How much does it cost?', answer: 'We offer a Free plan and a Pro plan at $49/month.', category: 'Pricing' }
                ] : []
            };

            const { data, error } = await supabase
                .from('global_widget_config')
                .insert(defaultConfig)
                .select()
                .single();

            if (error) {
                console.error('[WidgetConfig] Error creating default config:', error);
                return { config: null, error };
            }

            console.log('[WidgetConfig] Default config created:', data);
            return { config: data as WidgetConfig, error: null };
        } catch (err) {
            console.error('[WidgetConfig] Exception creating default config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Update widget configuration
     */
    async updateConfig(updates: Partial<WidgetConfig>, tenantIdOverride?: string | null): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            // Use override if provided, otherwise try to get from current user session
            const tenantId = tenantIdOverride !== undefined ? tenantIdOverride : await this.getTenantId();

            console.log('[WidgetConfig] Updating config for tenantId:', tenantId);

            // Remove id and config_key from updates if present
            const { id, config_key, updated_at, tenant_id, ...cleanUpdates } = updates as any;

            let query = supabase
                .from('global_widget_config')
                .update({
                    ...cleanUpdates,
                    updated_at: new Date().toISOString()
                });

            if (tenantId) {
                // TENANT: Update configuration for specific tenant ONLY
                query = query.eq('tenant_id', tenantId);
                console.log('[WidgetConfig] Updating for tenant:', tenantId);
            } else {
                // GLOBAL ADMIN: Update configuration for landing page ONLY
                // CRITICAL: Must explicitly check tenant_id IS NULL
                query = query.eq('config_key', 'global_widget').is('tenant_id', null);
                console.log('[WidgetConfig] Updating global config (tenant_id IS NULL)');
            }

            const { data, error } = await query.select().maybeSingle();

            if (error) {
                console.error('[WidgetConfig] Error updating config:', error);
                return { config: null, error };
            }

            if (!data) {
                console.error('[WidgetConfig] No config found to update. TenantId:', tenantId);
                return { config: null, error: new Error('No configuration found to update') };
            }

            console.log('[WidgetConfig] Config updated successfully:', data);
            return { config: data as WidgetConfig, error: null };
        } catch (err) {
            console.error('[WidgetConfig] Exception updating config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Reset configuration to defaults
     */
    async resetToDefaults(tenantIdOverride?: string | null): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            // Use override if provided, otherwise try to get from current user session
            const tenantId = tenantIdOverride !== undefined ? tenantIdOverride : await this.getTenantId();

            console.log('[WidgetConfig] Resetting config for tenantId:', tenantId);

            let query = supabase
                .from('global_widget_config')
                .delete();

            if (tenantId) {
                // TENANT: Delete tenant-specific configuration ONLY
                query = query.eq('tenant_id', tenantId);
                console.log('[WidgetConfig] Resetting for tenant:', tenantId);
            } else {
                // GLOBAL ADMIN: Delete global configuration ONLY
                // CRITICAL: Must explicitly check tenant_id IS NULL
                query = query.eq('config_key', 'global_widget').is('tenant_id', null);
                console.log('[WidgetConfig] Resetting global config (tenant_id IS NULL)');
            }

            await query;

            // Create new default config
            console.log('[WidgetConfig] Creating new default config');
            return this.createDefaultConfig(tenantId);
        } catch (err) {
            console.error('[WidgetConfig] Exception resetting config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Subscribe to configuration changes (real-time)
     */
    subscribeToConfigChanges(callback: (config: WidgetConfig) => void) {
        // This is tricky because we need tenantId to subscribe to specific row.
        // For now, we'll subscribe to all and filter in callback or rely on RLS (if enabled).
        // Better: Fetch tenantId first then subscribe. But this method is synchronous in signature.
        // We'll just subscribe to the table and let RLS handle visibility if possible, 
        // or filter by checking if the update matches our loaded config ID.

        const channel = supabase
            .channel('widget_config_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'global_widget_config'
                },
                (payload) => {
                    console.log('[WidgetConfig] Config updated (realtime):', payload.new);
                    callback(payload.new as WidgetConfig);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Unsubscribe from configuration changes
     */
    unsubscribeFromConfigChanges(channel: any) {
        supabase.removeChannel(channel);
    }
}

export const widgetConfigService = new WidgetConfigService();
