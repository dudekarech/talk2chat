import { supabase } from './supabaseClient';

export interface SocialMessagePayload {
    platform: 'whatsapp' | 'instagram' | 'facebook';
    recipientId: string;
    content: string;
    tenantId: string | null;
}

class OmnichannelService {
    /**
     * Send a message to an external social platform
     */
    async sendMessage(payload: SocialMessagePayload) {
        console.log(`[Omnichannel] Outgoing ${payload.platform} message:`, payload.content);

        // 1. Fetch Integration Credentials
        const { data: config, error: configError } = await supabase
            .from('global_widget_config')
            .select('integrations')
            .eq('tenant_id', payload.tenantId)
            .single();

        if (configError || !config?.integrations) {
            throw new Error(`Integration credentials not found for tenant ${payload.tenantId}`);
        }

        const integrations = config.integrations;

        switch (payload.platform) {
            case 'whatsapp':
                return this.sendWhatsApp(payload, integrations.whatsapp);
            case 'instagram':
            case 'facebook':
                return this.sendMessenger(payload, integrations[payload.platform]);
            default:
                throw new Error(`Unsupported platform: ${payload.platform}`);
        }
    }

    private async sendWhatsApp(payload: SocialMessagePayload, config: any) {
        if (!config?.enabled || !config?.phoneNumberId || !config?.apiKey) {
            throw new Error('WhatsApp integration is not fully configured');
        }

        const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: payload.recipientId,
                    type: "text",
                    text: { body: payload.content }
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error?.message || 'WhatsApp API Error');

            return { success: true, messageId: result.messages?.[0]?.id };
        } catch (error: any) {
            console.error('[Omnichannel] WhatsApp Send Failed:', error.message);
            throw error;
        }
    }

    private async sendMessenger(payload: SocialMessagePayload, config: any) {
        if (!config?.enabled || !config?.accessToken) {
            throw new Error(`${payload.platform} integration is not fully configured`);
        }

        const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${config.accessToken}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient: { id: payload.recipientId },
                    message: { text: payload.content }
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error?.message || 'Messenger API Error');

            return { success: true, messageId: result.message_id };
        } catch (error: any) {
            console.error(`[Omnichannel] ${payload.platform} Send Failed:`, error.message);
            throw error;
        }
    }
}

export const omnichannelService = new OmnichannelService();
