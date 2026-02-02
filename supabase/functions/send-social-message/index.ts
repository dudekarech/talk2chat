import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json();
        console.log('Outgoing Social Task:', payload);

        const { record } = payload; // The new message record

        // 1. Only process agent or AI replies
        if (record.sender_type !== 'agent' && record.sender_type !== 'ai') {
            return new Response(JSON.stringify({ status: 'ignored_sender' }), { status: 200 });
        }

        // 2. Fetch Session to check channel and external_id
        const { data: session } = await supabase
            .from('global_chat_sessions')
            .select('*')
            .eq('id', record.session_id)
            .single();

        if (!session || session.channel === 'web') {
            return new Response(JSON.stringify({ status: 'ignored_channel' }), { status: 200 });
        }

        // 3. Fetch Integration Keys
        const { data: config } = await supabase
            .from('global_widget_config')
            .select('integrations')
            .eq('tenant_id', session.tenant_id)
            .single();

        if (!config?.integrations) return new Response('Missing config', { status: 400 });

        const content = record.content;
        const recipientId = session.external_id;
        const platform = session.channel;
        const integrations = config.integrations;

        // 4. Send to Provider
        let result;
        if (platform === 'whatsapp') {
            result = await sendWhatsApp(recipientId, content, integrations.whatsapp);
        } else if (platform === 'instagram' || platform === 'facebook') {
            result = await sendMessenger(recipientId, content, integrations[platform]);
        } else if (platform === 'email') {
            const subject = session.subject || 'Re: Support Request';
            result = await sendEmail(recipientId, subject, content, integrations.email);
        }

        console.log(`[Outbound] ${platform} Response:`, JSON.stringify(result));

        // 5. Update message with provider ID
        const providerId = result?.messages?.[0]?.id || result?.message_id || result?.id;

        if (providerId) {
            await supabase.from('global_chat_messages').update({
                metadata: {
                    ...(record.metadata || {}),
                    provider_message_id: providerId,
                    sent_at: new Date().toISOString()
                }
            }).eq('id', record.id);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Send Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
})

async function sendWhatsApp(to: string, text: string, config: any) {
    const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: text }
        }),
    });
    return res.json();
}

async function sendMessenger(to: string, text: string, config: any) {
    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${config.accessToken}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: to },
            message: { text: text }
        }),
    });
    return res.json();
}

async function sendEmail(to: string, subject: string, text: string, config: any) {
    console.log(`[Outbound Email] To: ${to}, Subject: ${subject}`);

    if (!config?.apiKey) {
        return { error: 'Email API Key not configured' };
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: config.fromEmail || 'TalkChat Support <support@talkchat.io>',
            to: [to],
            subject: subject,
            text: text,
        }),
    });
    return res.json();
}
