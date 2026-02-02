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
    console.log(`Triggering AI for ${session.channel} (Session: ${session.id})`);

    try {
        // 1. Check if an agent is assigned
        const { data: sessionData } = await supabase
            .from('global_chat_sessions')
            .select('assigned_to, status')
            .eq('id', session.id)
            .single();

        if (sessionData?.assigned_to) {
            console.log(`[AI] Session ${session.id} is assigned to agent ${sessionData.assigned_to}. Skipping AI auto-reply.`);
            return;
        }

        // 2. Call AI Function
        const aiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-chat`;

        // Fetch history for context
        const { data: history } = await supabase
            .from('global_chat_messages')
            .select('sender_type, content')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(10);

        const formattedHistory = history ? history.reverse().map((h: any) => ({
            role: h.sender_type === 'visitor' ? 'user' : 'model',
            parts: h.content
        })) : [];

        const aiResponse = await fetch(aiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                history: formattedHistory,
                instructions: config.knowledgeBase?.textContext || "You are a helpful assistant.",
                provider: 'google', // Default to Gemini for speed/cost
                modelName: 'gemini-1.5-flash',
                tenant_id: session.tenant_id,
                session_id: session.id
            })
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            throw new Error(`AI Function Error: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const aiText = aiData.response;

        if (aiText) {
            // 2. Insert AI Reply to DB 
            // This INSERT will trigger the 'send-social-message' Database Webhook if configured
            const { error: insertError } = await supabase.from('global_chat_messages').insert({
                session_id: session.id,
                content: aiText,
                sender_type: 'ai',
                sender_name: config.botName || 'AI Assistant'
            });

            if (insertError) console.error('Failed to save AI reply:', insertError);
            else console.log('AI Reply Saved & Queued:', aiText.substring(0, 50) + '...');
        }

    } catch (err) {
        console.error('AI Trigger Failed:', err);
    }
}
