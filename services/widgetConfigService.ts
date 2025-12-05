import { supabase } from './globalChatRealtimeService';

export interface WidgetConfig {
    id: string;
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

    // Quick Replies & Canned Responses
    quick_replies_enabled: boolean;
    quick_replies: Array<{ id: string; text: string; category: string }>;
    canned_responses: Array<{ id: string; shortcut: string; text: string; category: string }>;

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
    /**
     * Get widget configuration
     */
    async getConfig(): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('global_widget_config')
                .select('*')
                .eq('config_key', 'global_widget')
                .maybeSingle();

            if (error) {
                // If no config exists, create one with defaults
                if (error.code === 'PGRST116') {
                    return this.createDefaultConfig();
                }
                console.error('[WidgetConfig] Error fetching config:', error);
                return { config: null, error };
            }

            console.log('[WidgetConfig] Config loaded:', data);
            return { config: data as WidgetConfig, error: null };
        } catch (err) {
            console.error('[WidgetConfig] Exception fetching config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Create default configuration
     */
    async createDefaultConfig(): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            const { data, error } = await supabase
                .from('global_widget_config')
                .insert({
                    config_key: 'global_widget'
                    // All other fields will use their default values from the schema
                })
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
    async updateConfig(updates: Partial<WidgetConfig>): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            // Remove id and config_key from updates if present
            const { id, config_key, updated_at, ...cleanUpdates } = updates as any;

            const { data, error } = await supabase
                .from('global_widget_config')
                .update({
                    ...cleanUpdates,
                    updated_at: new Date().toISOString()
                })
                .eq('config_key', 'global_widget')
                .select()
                .maybeSingle();

            if (error) {
                console.error('[WidgetConfig] Error updating config:', error);
                return { config: null, error };
            }

            console.log('[WidgetConfig] Config updated:', data);
            return { config: data as WidgetConfig, error: null };
        } catch (err) {
            console.error('[WidgetConfig] Exception updating config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Reset configuration to defaults
     */
    async resetToDefaults(): Promise<{ config: WidgetConfig | null; error: any }> {
        try {
            // Delete existing config
            await supabase
                .from('global_widget_config')
                .delete()
                .eq('config_key', 'global_widget');

            // Create new default config
            return this.createDefaultConfig();
        } catch (err) {
            console.error('[WidgetConfig] Exception resetting config:', err);
            return { config: null, error: err };
        }
    }

    /**
     * Subscribe to configuration changes (real-time)
     */
    subscribeToConfigChanges(callback: (config: WidgetConfig) => void) {
        const channel = supabase
            .channel('widget_config_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'global_widget_config',
                    filter: 'config_key=eq.global_widget'
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
