import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { method } = req;
    const url = new URL(req.url);

    // 1. META WEBHOOK VERIFICATION (GET)
    if (method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        // You should set this in your Supabase environment variables
        const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'talkchat_studio_secret';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new Response(challenge, { status: 200 });
        } else {
            return new Response('Forbidden', { status: 403 });
        }
    }

    // 2. INCOMING MESSAGE HANDLING (POST)
    if (method === 'POST') {
        try {
            const payload = await req.json();
            console.log('Incoming Meta Payload:', JSON.stringify(payload, null, 2));

            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Identify Platform and Process
            if (payload.object === 'whatsapp_business_account') {
                await processWhatsApp(payload, supabase);
            } else if (payload.object === 'instagram' || payload.object === 'page') {
                await processMessenger(payload, supabase);
            }

            return new Response(JSON.stringify({ status: 'success' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        } catch (error) {
            console.error('Webhook Error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }
    }

    return new Response('Not Found', { status: 404 });
})

/**
 * Process WhatsApp Messages
 */
async function processWhatsApp(payload: any, supabase: any) {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) return;

    const phoneId = value.metadata.phone_number_id;
    const from = message.from; // Sender WhatsApp ID
    const text = message.text?.body;
    const senderName = contact?.profile?.name || from;

    // 1. Find the Tenant associated with this Phone Number ID
    const { data: config } = await supabase
        .from('global_widget_config')
        .select('tenant_id, integrations')
        .contains('integrations', { whatsapp: { phoneNumberId: phoneId } })
        .single();

    if (!config) {
        console.error('No tenant found for Phone ID:', phoneId);
        return;
    }

    // 2. Sync with talkchat sessions
    const { data: session } = await supabase.rpc('find_or_create_social_session', {
        p_external_id: from,
        p_channel: 'whatsapp',
        p_visitor_name: senderName,
        p_tenant_id: config.tenant_id
    });

    if (session) {
        // 3. Store the message
        await supabase.from('global_chat_messages').insert({
            session_id: session.id,
            content: text,
            sender_type: 'visitor',
            sender_name: senderName
        });

        // 4. Trigger AI Response (Server-to-Server)
        // We can call our ai-chat function or run the logic here
        await triggerAIResponse(session, text, config, supabase);
    }
}

/**
 * Process Instagram/Messenger
 */
async function processMessenger(payload: any, supabase: any) {
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging?.sender?.id;
    const message = messaging?.message;

    if (!message || !message.text) return;

    const pageId = entry.id; // FB Page ID or IG Account ID
    const platform = payload.object === 'instagram' ? 'instagram' : 'facebook';

    // 1. Find Tenant
    const { data: config } = await supabase
        .from('global_widget_config')
        .select('tenant_id, integrations')
        .or(`integrations->instagram->pageId.eq.${pageId},integrations->facebook->pageId.eq.${pageId}`)
        .single();

    if (!config) return;

    // 2. Sync Session
    const { data: session } = await supabase.rpc('find_or_create_social_session', {
        p_external_id: senderId,
        p_channel: platform,
        p_visitor_name: 'Social User', // Meta doesn't always send name in webhook
        p_tenant_id: config.tenant_id
    });

    if (session) {
        await supabase.from('global_chat_messages').insert({
            session_id: session.id,
            content: message.text,
            sender_type: 'visitor',
            sender_name: 'Social User'
        });

        await triggerAIResponse(session, message.text, config, supabase);
    }
}

async function triggerAIResponse(session: any, text: string, config: any, supabase: any) {
    // This logic mimics the ai-chat function but sends output back to Social API
    // Part 1: Logic to get AI response would go here (calling ai-chat internal logic)
    // Part 2: Sending message back to WhatsApp/Meta
    console.log(`Triggering AI for ${session.channel}: ${text}`);

    // For now, we'll just log. Real implementation involves the Meta Send API.
}
