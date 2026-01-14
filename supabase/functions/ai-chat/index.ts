import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, history, instructions, provider, modelName, tenant_id } = await req.json()

        // 1. Initialize Supabase with Service Role Key (to bypass RLS and get keys)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Determine Mode (Tenant vs Global)
        const isGlobal = !tenant_id;
        let config: any = null;

        if (isGlobal) {
            console.log('[AI Proxy] Global Mode detected (Landing Page). Fetching global config...');
            // GLOBAL MODE: Fetch global config explicitly using the 'global_widget' key
            const { data, error } = await supabaseAdmin
                .from('global_widget_config')
                .select('*')
                .eq('config_key', 'global_widget')
                .is('tenant_id', null)
                .maybeSingle();

            if (!error && data) config = data;
            else console.error('[AI Proxy] Error fetching global config:', error);

        } else {
            console.log(`[AI Proxy] Tenant Mode detected (Tenant: ${tenant_id}). Fetching tenant config...`);
            // TENANT MODE: Fetch tenant config
            const { data, error } = await supabaseAdmin
                .from('global_widget_config')
                .select('*')
                .eq('tenant_id', tenant_id)
                .maybeSingle();

            if (!error && data) config = data;
        }

        if (!config && !isGlobal) {
            throw new Error(`Configuration not found for tenant: ${tenant_id}`);
        } else if (!config && isGlobal) {
            console.warn('[AI Proxy] No global config found in DB. Falling back to defaults.');
            config = {};
        }

        // 3. Select API Key
        let apiKey =
            provider === 'openai' ? config?.openai_api_key :
                provider === 'anthropic' ? config?.anthropic_api_key :
                    provider === 'mistral' ? config?.mistral_api_key :
                        provider === 'deepseek' ? config?.deepseek_api_key :
                            provider === 'openrouter' ? config?.openrouter_api_key :
                                config?.ai_api_key;

        // Global Fallback (Environment Variables)
        if (!apiKey && isGlobal && provider === 'gemini') {
            apiKey = Deno.env.get('GEMINI_API_KEY');
        }

        // Tenant Backup (Secure Keys Table) -- SKIP FOR GLOBAL
        if (!apiKey && !isGlobal) {
            const { data: secureKey } = await supabaseAdmin
                .from('tenant_ai_keys')
                .select('api_key')
                .eq('provider', provider)
                .eq('tenant_id', tenant_id)
                .is('is_active', true)
                .maybeSingle();

            if (secureKey) apiKey = secureKey.api_key;
        }

        if (!apiKey) {
            console.error(`[AI Proxy] Missing API key for provider: ${provider}, Global: ${isGlobal}`);
            throw new Error(isGlobal
                ? "The Global AI Demo is unavailable (Missing Configuration)."
                : "AI Configuration missing. Please add your API key in settings.");
        }

        console.log(`[AI Proxy] Routing: Provider=${provider}, Global=${isGlobal}, KeyPrefix=${apiKey.substring(0, 4)}...`);

        // 4. RAG: Search for relevant context (TENANT ONLY)
        // We explicitly disable RAG for Global Mode to ensure stability
        let ragContext = ""
        const embeddingKey = config?.ai_api_key || Deno.env.get('GEMINI_API_KEY');

        // CAUTIOUS: Only run RAG if we are NOT in global mode and have a tenant ID
        if (!isGlobal && tenant_id && embeddingKey) {
            try {
                // a. Generate embedding for current message
                const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${embeddingKey}`
                const embedRes = await fetch(embedUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "models/text-embedding-004",
                        content: { parts: [{ text: message }] }
                    })
                })
                const embedData = await embedRes.json()
                const queryVector = embedData.embedding?.values

                if (queryVector) {
                    // b. Match in DB
                    const { data: matches } = await supabaseAdmin.rpc('match_knowledge_base', {
                        query_embedding: queryVector,
                        match_threshold: 0.5,
                        match_count: 5,
                        p_tenant_id: tenant_id
                    })

                    if (matches && matches.length > 0) {
                        ragContext = "\n\nRELEVANT CONTEXT FROM KNOWLEDGE BASE:\n" +
                            matches.map((m: any) => `--- CHUNK ---\n${m.content}`).join('\n')
                    }
                }
            } catch (ragErr) {
                console.error('[RAG] Error searching knowledge base:', ragErr)
                // Continue without RAG if it fails
            }
        }

        const augmentedInstructions = instructions + (ragContext ? `\n\n${ragContext}` : "");

        // 5. Call the appropriate AI Provider
        let responseText = ""

        if (provider === 'gemini' || !provider) {
            // Direct call to Gemini
            const model = modelName || "gemini-1.5-flash"
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

            const payload = {
                contents: [
                    { role: 'user', parts: [{ text: augmentedInstructions }] },
                    ...history.map((h: any) => ({
                        role: h.role === 'model' ? 'model' : 'user',
                        parts: [{ text: h.parts }]
                    })),
                    { role: 'user', parts: [{ text: message }] }
                ],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini."
        }
        else if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName || 'gpt-4o',
                    messages: [
                        { role: 'system', content: augmentedInstructions },
                        ...history.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ]
                })
            })
            const data = await res.json()
            responseText = data.choices?.[0]?.message?.content || "No response from OpenAI."
        }
        else if (provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: modelName || 'claude-3-5-sonnet-20240620',
                    max_tokens: 500,
                    system: augmentedInstructions,
                    messages: [
                        ...history.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ]
                })
            })
            const data = await res.json()
            responseText = data.content?.[0]?.text || "No response from Anthropic."
        }
        else if (provider === 'openrouter' || provider === 'mistral' || provider === 'deepseek') {
            const baseUrl =
                provider === 'openrouter' ? 'https://openrouter.ai/api/v1' :
                    provider === 'mistral' ? 'https://api.mistral.ai/v1' :
                        'https://api.deepseek.com';

            const res = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://talkchat.studio', // Required for OpenRouter
                    'X-Title': 'TalkChat Studio'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: augmentedInstructions },
                        ...history.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ]
                })
            })

            if (!res.ok) {
                const errorText = await res.text().catch(() => "Unknown error");
                let errorMsg = res.statusText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.error || errorText || res.statusText;
                } catch (e) {
                    errorMsg = errorText || res.statusText;
                }
                throw new Error(`${provider} API Error (${res.status}): ${errorMsg}`);
            }

            const data = await res.json()
            responseText = data.choices?.[0]?.message?.content || `No response from ${provider}.`
        }
        else {
            throw new Error(`Provider ${provider} not supported in proxy yet.`)
        }

        return new Response(JSON.stringify({ response: responseText }), {
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
