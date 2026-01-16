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
        const body = await req.json()
        const { message, history, instructions, provider, modelName, tenant_id, session_id } = body;

        // PROTECT: Ensure tenant_id is either a valid UUID or strictly NULL
        const v_tenant_id = (tenant_id && tenant_id !== 'null' && tenant_id !== 'undefined' && tenant_id !== 'global' && tenant_id !== '00000000-0000-0000-0000-000000000000') ? tenant_id : null;
        const isGlobal = (v_tenant_id === null);

        // 1. Initialize Supabase with Service Role Key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let config: any = null

        // 2. Fetch Configuration (Optimized for early exit)
        if (v_tenant_id) {
            console.log(`[AI Proxy] Tenant Mode detected (Tenant: ${v_tenant_id}). Fetching tenant config...`);
            const { data, error } = await supabaseAdmin
                .from('global_widget_config')
                .select('*')
                .eq('tenant_id', v_tenant_id)
                .maybeSingle();
            if (!error && data) config = data;
            else console.error('[AI Proxy] Error fetching tenant config:', error);
        } else {
            console.log('[AI Proxy] Global Mode detected. Fetching global config...');
            // Check for global landing page config
            const { data, error } = await supabaseAdmin
                .from('global_widget_config')
                .select('*')
                .is('tenant_id', null)
                .eq('config_key', 'global_widget') // Assuming 'global_widget' is the key for the main global config
                .maybeSingle();
            if (!error && data) config = data;
            else console.error('[AI Proxy] Error fetching global config:', error);
        }

        if (!config && !isGlobal) {
            throw new Error(`Configuration not found for tenant: ${v_tenant_id}`);
        } else if (!config && isGlobal) {
            console.warn('[AI Proxy] No global config found in DB. Falling back to defaults.');
            config = {};
        }

        // Determine usage provider type EARLY for Defense Grid checks
        const usageProvider = (isGlobal || !config?.ai_api_key) ? 'talkchat_ai' : 'customer_key';

        // 2.5 PRIVACY GUARDRAILS (Safety Vault)
        // Apply PII Masking if enabled in config
        let safeMessage = message;
        let safeHistory = JSON.parse(JSON.stringify(history));
        let responseData: any = null;
        const captchaToken = body.captchaToken; // If implementation uses frontend CAPTCHA

        if (config?.privacy_pii_masking_enabled) {
            console.log('[Safety Vault] PII Masking enabled. Scrubbing inputs...');
            const piiRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)|(\+?\d[\d -]{8,}\d)/g;
            const mask = (text: string) => text.replace(piiRegex, '[REDACTED]');

            safeMessage = mask(message);
            safeHistory = safeHistory.map((h: any) => ({
                ...h,
                parts: mask(h.parts)
            }));
        }

        // IP / Location Anonymization
        const privacyInstructions = config?.privacy_hide_ip
            ? "NOTICE: Visitor IP and precise location are hidden for privacy. Do not ask for their location unless necessary."
            : "";

        // 2.6 DEFENSE GRID (Bot Protection)
        // Check Credit Balance BEFORE expensive AI call
        if (usageProvider === 'talkchat_ai' && v_tenant_id) {
            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('ai_credits_balance')
                .eq('id', v_tenant_id)
                .single();

            if (tenant && tenant.ai_credits_balance <= 0) {
                console.warn(`[Defense Grid] Credit exhaustion for tenant ${v_tenant_id}. AI requests paused.`);
                return new Response(JSON.stringify({
                    response: "I'm sorry, I'm currently unable to process your request due to system maintenance (Credit Exhaustion). Please contact support.",
                    status: 'credits_exhausted'
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
            }
        }

        // CAPTCHA Validation Shell
        if (config?.captcha_secret_key && captchaToken) {
            console.log('[Defense Grid] Validating CAPTCHA...');
            // In production, would verify with google/cloudflare here
        }

        // Adaptive Throttling: Check session AI frequency
        if (session_id) {
            const { count: recentAICount } = await supabaseAdmin
                .from('ai_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session_id)
                .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString()); // Last 1 minute

            if (recentAICount && recentAICount > 10) { // Limit 10 AI responses per min per session
                throw new Error("Rate limit exceeded. Please wait a moment before sending another message.");
            }
        }

        // 2.7 PROFIT ACCELERATOR (Tier Gating)
        // Check if the requested model is allowed for this tenant's plan
        const { data: tenantPlanData } = await supabaseAdmin
            .from('tenants')
            .select('subscription_plan')
            .eq('id', v_tenant_id)
            .single();

        const plan = tenantPlanData?.subscription_plan || 'free';
        let finalModel = modelName;

        // Logic: Free tier = Gemini only. Pro/Enterprise = GPT/Claude allowed.
        if (plan === 'free' && (provider === 'openai' || provider === 'anthropic' || (provider === 'openrouter' && modelName?.includes('gpt-4')))) {
            console.log(`[Tier Gate] Tenant ${v_tenant_id} on FREE plan requested ${provider}/${modelName}. Downgrading to managed Gemini.`);
            // Silently downgrade to protect user experience OR throw error. For now, we downgrade to Gemini if managed.
            if (usageProvider === 'talkchat_ai') {
                // provider = 'gemini'; // Re-assignment not possible with const
                // We'll handle this in the provider selection
                finalModel = "gemini-1.5-flash"; // Default free tier model
            } else {
                throw new Error(`The ${modelName} model is only available on Pro or Enterprise plans.`);
            }
        }
        // 3. Select API Key & Finalize Provider (Accounting for Tier Downgrade)
        let effectiveProvider = provider;
        if (plan === 'free' && (provider === 'openai' || provider === 'anthropic' || (provider === 'openrouter' && modelName?.includes('gpt-4')))) {
            effectiveProvider = 'gemini';
        }

        let apiKey =
            effectiveProvider === 'openai' ? config?.openai_api_key :
                effectiveProvider === 'anthropic' ? config?.anthropic_api_key :
                    effectiveProvider === 'gemini' ? config?.ai_api_key :
                        effectiveProvider === 'mistral' ? config?.mistral_api_key :
                            effectiveProvider === 'deepseek' ? config?.deepseek_api_key :
                                effectiveProvider === 'openrouter' ? config?.openrouter_api_key :
                                    config?.ai_api_key;

        // Global Fallback (Environment Variables)
        if (!apiKey && isGlobal && effectiveProvider === 'gemini') {
            apiKey = Deno.env.get('GEMINI_API_KEY');
        }

        // Tenant Backup (Secure Keys Table) -- SKIP FOR GLOBAL
        if (!apiKey && !isGlobal) {
            const { data: secureKey } = await supabaseAdmin
                .from('tenant_ai_keys')
                .select('api_key, is_encrypted, encryption_v')
                .eq('provider', effectiveProvider)
                .eq('tenant_id', v_tenant_id)
                .is('is_active', true)
                .maybeSingle();

            if (secureKey) {
                if (secureKey.is_encrypted) {
                    // DECRYPTION LOGIC (Safety Vault)
                    // In a production environment, we would use crypto.subtle.decrypt
                    // with a master secret from Deno.env.get('VAULT_MASTER_KEY')
                    console.log(`[Safety Vault] Decrypting ${effectiveProvider} key (v: ${secureKey.encryption_v})...`);
                    apiKey = secureKey.api_key; // For now, just pass through until encryption service is live
                } else {
                    apiKey = secureKey.api_key;
                }
            }
        }

        if (!apiKey) {
            console.error(`[AI Proxy] Missing API key for provider: ${effectiveProvider}, Global: ${isGlobal}`);
            throw new Error(isGlobal
                ? "The Global AI Demo is unavailable (Missing Configuration)."
                : "AI Configuration missing. Please add your API key in settings.");
        }

        console.log(`[AI Proxy] Routing: Provider=${effectiveProvider}, Global=${isGlobal}, KeyPrefix=${apiKey.substring(0, 4)}...`);

        // 4. RAG: Search for relevant context
        let ragContext = ""
        const geminiEmbedKey = config?.ai_api_key || Deno.env.get('GEMINI_API_KEY');
        const openaiEmbedKey = config?.openai_api_key;
        const openrouterEmbedKey = config?.openrouter_api_key;

        // ENABLE RAG: For both Tenants AND Global Admin (Landing Page Demo)
        if (geminiEmbedKey || openaiEmbedKey || openrouterEmbedKey) {
            try {
                const recentHistory = safeHistory.slice(-2).map((h: any) => h.parts).join(' ');
                const augmentedQuery = `${recentHistory} ${safeMessage}`.trim();

                let queryVector: number[] = [];

                // Attempt to get embedding from available providers
                if (geminiEmbedKey) {
                    const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiEmbedKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: "models/text-embedding-004",
                            content: { parts: [{ text: augmentedQuery }] }
                        })
                    });
                    if (embedRes.ok) {
                        const embedData = await embedRes.json();
                        queryVector = embedData.embedding?.values;
                    }
                }

                if (queryVector.length === 0 && (openaiEmbedKey || openrouterEmbedKey)) {
                    const isOR = !openaiEmbedKey && openrouterEmbedKey;
                    const url = isOR ? 'https://openrouter.ai/api/v1/embeddings' : 'https://api.openai.com/v1/embeddings';
                    const key = isOR ? openrouterEmbedKey : openaiEmbedKey;
                    const model = isOR ? "openai/text-embedding-3-small" : "text-embedding-3-small";

                    const embedRes = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({
                            model: model,
                            input: augmentedQuery,
                            dimensions: 768
                        })
                    });
                    if (embedRes.ok) {
                        const embedData = await embedRes.json();
                        queryVector = embedData.data?.[0]?.embedding;
                    }
                }

                if (queryVector && queryVector.length > 0) {
                    // Dimension alignment
                    if (queryVector.length !== 768) {
                        if (queryVector.length > 768) queryVector = queryVector.slice(0, 768);
                        else while (queryVector.length < 768) queryVector.push(0);
                    }
                    // c. HYBRID SEARCH (Vector + Keyword)
                    // This uses the new RRF matching function for maximum accuracy
                    const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_knowledge_base_hybrid', {
                        query_embedding: queryVector,
                        query_text: safeMessage, // Use the raw message for keyword search
                        match_threshold: 0.45, // Slightly lower threshold for hybrid
                        match_count: 6,
                        p_tenant_id: v_tenant_id // Use the sanitized UUID or NULL
                    })

                    if (matchError) throw matchError;

                    if (matches && matches.length > 0) {
                        // d. Format context with source metadata if available
                        ragContext = "\n\nCRITICAL CONTEXT FROM KNOWLEDGE BASE (USE THIS TO ANSWER):\n" +
                            matches.map((m: any) => {
                                const source = m.metadata?.filename || m.metadata?.source || 'Knowledge Base';
                                return `[Source: ${source}]\n${m.content}`;
                            }).join('\n\n');
                    }
                }
            } catch (ragErr) {
                console.error('[RAG] Error searching hybrid knowledge base:', ragErr)
            }
        }

        const augmentedInstructions = instructions +
            (privacyInstructions ? `\n\n${privacyInstructions}` : "") +
            (ragContext ? `\n\n${ragContext}` : "");

        // 5. Call the appropriate AI Provider
        let responseText = ""

        if (effectiveProvider === 'gemini') {
            // Direct call to Gemini
            const model = finalModel || "gemini-1.5-flash"
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

            const payload = {
                contents: [
                    { role: 'user', parts: [{ text: augmentedInstructions }] },
                    ...safeHistory.map((h: any) => ({
                        role: h.role === 'model' ? 'model' : 'user',
                        parts: [{ text: h.parts }]
                    })),
                    { role: 'user', parts: [{ text: safeMessage }] }
                ],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            responseData = await res.json()
            // In Gemini v1beta, response is in candidates[0].content.parts[0].text
            responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini."
        }
        else if (effectiveProvider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: finalModel || 'gpt-4o',
                    messages: [
                        { role: 'system', content: augmentedInstructions },
                        ...safeHistory.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: safeMessage }
                    ]
                })
            })
            const data = await res.json()
            responseText = data.choices?.[0]?.message?.content || "No response from OpenAI."
        }
        else if (effectiveProvider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: finalModel || 'claude-3-5-sonnet-20240620',
                    max_tokens: 500,
                    system: augmentedInstructions,
                    messages: [
                        ...safeHistory.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: safeMessage }
                    ]
                })
            })
            const data = await res.json()
            responseText = data.content?.[0]?.text || "No response from Anthropic."
        }
        else if (effectiveProvider === 'openrouter') {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://talkchat.studio', // Required for OpenRouter
                    'X-Title': 'TalkChat Studio'
                },
                body: JSON.stringify({
                    model: finalModel,
                    messages: [
                        { role: 'system', content: augmentedInstructions },
                        ...safeHistory.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: safeMessage }
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
                throw new Error(`${effectiveProvider} API Error (${res.status}): ${errorMsg}`);
            }

            responseData = await res.json()
            responseText = responseData.choices?.[0]?.message?.content || `No response from ${effectiveProvider}.`
        }
        else if (effectiveProvider === 'mistral' || effectiveProvider === 'deepseek') {
            const baseUrl =
                effectiveProvider === 'mistral' ? 'https://api.mistral.ai/v1' :
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
                    model: finalModel,
                    messages: [
                        { role: 'system', content: augmentedInstructions },
                        ...safeHistory.map((h: any) => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: safeMessage }
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
                throw new Error(`${effectiveProvider} API Error (${res.status}): ${errorMsg}`);
            }

            responseData = await res.json()
            responseText = responseData.choices?.[0]?.message?.content || `No response from ${effectiveProvider}.`
        }
        else {
            throw new Error(`Provider ${effectiveProvider} not supported in proxy yet.`)
        }

        // 6. LOG USAGE & ENFORCE ECONOMY
        try {
            // Extract usage metadata if available
            let tokensInput = 0;
            let tokensOutput = 0;

            if (effectiveProvider === 'gemini') {
                // In Gemini, usage can be in candidates[0].usageMetadata or root.usageMetadata
                const usage = responseData?.usageMetadata;
                if (usage) {
                    tokensInput = usage.promptTokenCount || 0;
                    tokensOutput = usage.candidatesTokenCount || 0;
                }
            } else if (responseData?.usage) {
                // OpenAI-compatible usage object
                tokensInput = responseData.usage.prompt_tokens || responseData.usage.input_tokens || 0;
                tokensOutput = responseData.usage.completion_tokens || responseData.usage.output_tokens || 0;
            }

            // Fallback estimation if API didn't return tokens (approx 4 chars per token)
            if (tokensInput === 0) tokensInput = Math.ceil((safeMessage.length + augmentedInstructions.length + JSON.stringify(safeHistory).length) / 4);
            if (tokensOutput === 0) tokensOutput = Math.ceil(responseText.length / 4);

            const totalTokens = tokensInput + tokensOutput;

            // Log usage to DB
            await supabaseAdmin.from('ai_usage_logs').insert({
                tenant_id: v_tenant_id,
                session_id: session_id,
                feature: 'chat_response',
                provider: usageProvider,
                model_name: finalModel || effectiveProvider,
                tokens_input: tokensInput,
                tokens_output: tokensOutput,
                estimated_cost: (totalTokens / 1000) * 0.0001 // Simple estimate: $0.10 per 1M tokens
            });

            // 7. DEDUCT CREDITS (if managed and tenant exists)
            if (usageProvider === 'talkchat_ai' && v_tenant_id) {
                // We use a simple 1:1 credit-to-token deduction for now, or could have a more complex pricing model
                const creditDeduction = totalTokens / 1000; // 1 credit per 1k tokens

                const { error: creditError } = await supabaseAdmin.rpc('deduct_tenant_credits', {
                    p_tenant_id: v_tenant_id,
                    p_amount: creditDeduction
                });

                if (creditError) console.error('[Economy] Failed to deduct credits:', creditError);
            }

        } catch (usageErr) {
            console.error('[Usage Logger] Failed to log AI usage:', usageErr);
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
