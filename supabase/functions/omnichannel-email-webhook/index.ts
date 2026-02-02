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
        console.log('Incoming Email Webhook:', JSON.stringify(payload, null, 2));

        // 1. EXTRACT DATA (Assuming Postmark/Generic format)
        const fromEmail = payload.From || payload.from_email || payload.sender;
        const fromName = payload.FromName || payload.from_name || fromEmail;
        const toEmail = payload.To || payload.to_email || payload.recipient;
        const subject = payload.Subject || payload.subject || '(No Subject)';
        const content = payload.TextBody || payload.html_body || payload.content || payload.body;

        if (!fromEmail || !toEmail) {
            throw new Error('Email must have a sender and recipient');
        }

        // 2. FIND TENANT
        // We look for the tenant who owns this recipient email
        // Logic: Search global_widget_config or tenants table
        const { data: config, error: configError } = await supabase
            .from('global_widget_config')
            .select('tenant_id, knowledge_base')
            .or(`integrations->email->inboundAddress.eq.${toEmail},tenant_id.in.(select id from tenants where company_email = '${toEmail}')`)
            .maybeSingle();

        if (configError || !config) {
            console.error('[Email Webhook] No tenant found for recipient:', toEmail);
            return new Response(JSON.stringify({ error: 'Tenant not identified' }), { status: 404 });
        }

        const tenantId = config.tenant_id;

        // 3. FIND OR CREATE SESSION
        const { data: session } = await supabase.rpc('find_or_create_social_session', {
            p_external_id: fromEmail,
            p_channel: 'email',
            p_visitor_name: fromName,
            p_tenant_id: tenantId,
            p_subject: subject
        });

        if (!session) {
            throw new Error('Failed to create/sync email session');
        }

        // 4. STORE MESSAGE
        const { error: messageError } = await supabase.from('global_chat_messages').insert({
            session_id: session.id,
            content: content,
            sender_type: 'visitor',
            sender_name: fromName,
            metadata: {
                email_subject: subject,
                inbound_to: toEmail,
                provider_raw_payload: payload
            }
        });

        if (messageError) throw messageError;

        // 5. TRIGGER AI RESPONSE
        // We reuse the same logic as social!
        await triggerAIResponse(session, content, config, supabase);

        return new Response(JSON.stringify({ status: 'success', session_id: session.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Email Webhook Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
})

async function triggerAIResponse(session: any, text: string, config: any, supabase: any) {
    console.log(`[Email AI] Triggering for Session: ${session.id}`);

    try {
        const aiUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-chat`;

        // Fetch history
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
                instructions: config.knowledgeBase?.textContext || "You are a professional email support assistant.",
                provider: 'google',
                modelName: 'gemini-1.5-flash',
                tenant_id: session.tenant_id,
                session_id: session.id
            })
        });

        const aiData = await aiResponse.json();
        const aiText = aiData.response;

        if (aiText) {
            await supabase.from('global_chat_messages').insert({
                session_id: session.id,
                content: aiText,
                sender_type: 'ai',
                sender_name: config.botName || 'TalkChat AI'
            });
        }
    } catch (err) {
        console.error('Email AI Trigger Failed:', err);
    }
}
