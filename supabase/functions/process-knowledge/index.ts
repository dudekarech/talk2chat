import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { tenant_id, chunks } = await req.json()

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get API Keys (Gemini preferred, OpenRouter fallback)
        let query = supabaseAdmin
            .from('global_widget_config')
            .select('ai_api_key, openrouter_api_key')

        if (tenant_id) {
            query = query.eq('tenant_id', tenant_id)
        } else {
            query = query.eq('config_key', 'global_widget').is('tenant_id', null)
        }

        const { data: config } = await query.maybeSingle()

        const geminiKey = config?.ai_api_key || Deno.env.get('GEMINI_API_KEY');
        const openRouterKey = config?.openrouter_api_key;

        if (!geminiKey && !openRouterKey) {
            throw new Error("No valid API key found (Gemini or OpenRouter) for generating Knowledge Base embeddings.")
        }

        // 2. Process chunks in batches
        for (const chunk of chunks) {
            let vector = [];

            if (geminiKey) {
                // Use Google Direct
                const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "models/text-embedding-004",
                        content: { parts: [{ text: chunk.content }] }
                    })
                });
                const embedData = await embedRes.json();
                if (embedData.error) throw new Error(`Gemini Embedding Error: ${embedData.error.message}`);
                vector = embedData.embedding.values;
            } else if (openRouterKey) {
                // Use OpenRouter (must map to a 768d model, using google/gemini-embedding-001 if available, or similar)
                // Note: OpenRouter 'google/text-embedding-004' might not be standard, checking docs or using 'google/gemini-embedding-001'
                const embedRes = await fetch('https://openrouter.ai/api/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://talkchat.studio',
                        'X-Title': 'TalkChat Studio'
                    },
                    body: JSON.stringify({
                        model: 'google/text-embedding-004', // Try direct mapping first
                        input: chunk.content
                    })
                });

                if (!embedRes.ok) {
                    const errText = await embedRes.text();
                    throw new Error(`OpenRouter Embedding Error: ${errText}`);
                }

                const embedData = await embedRes.json();
                vector = embedData.data[0].embedding;
            }

            if (!vector || vector.length === 0) throw new Error("Failed to generate embedding vector.");

            // 3. Save to database
            await supabaseAdmin.from('knowledge_base_chunks').insert({
                tenant_id,
                content: chunk.content,
                metadata: chunk.metadata || {},
                embedding: vector
            })
        }

        return new Response(JSON.stringify({ success: true, processed: chunks.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
