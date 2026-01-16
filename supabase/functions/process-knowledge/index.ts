import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const body = await req.json();
        const { tenant_id, content, metadata, filename } = body;

        // PROTECT: Ensure tenant_id is either a valid UUID or strictly NULL
        const v_tenant_id = (tenant_id && tenant_id !== 'null' && tenant_id !== 'undefined' && tenant_id !== '') ? tenant_id : null;

        console.log(`[Ingest] Received request. Tenant: ${v_tenant_id || 'GLOBAL'}, Source: ${filename || 'manual'}`);

        if (!content || typeof content !== 'string') {
            throw new Error("Content is required and must be a string.");
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch config from DB to get all possible keys
        console.log(`[Ingest] Fetching keys for: ${v_tenant_id || 'GLOBAL'}...`);
        const { data: config, error: configError } = await (v_tenant_id
            ? supabaseAdmin.from('global_widget_config').select('*').eq('tenant_id', v_tenant_id)
            : supabaseAdmin.from('global_widget_config').select('*').eq('config_key', 'global_widget').is('tenant_id', null)
        ).maybeSingle();

        if (configError) {
            console.error('[Ingest] Database Error fetching config:', configError);
            throw new Error(`Database Configuration Error: ${configError.message}`);
        }

        const finalGeminiKey = Deno.env.get('GEMINI_API_KEY') || config?.ai_api_key;
        const finalOpenAIKey = Deno.env.get('OPENAI_API_KEY') || config?.openai_api_key;
        const finalOpenRouterKey = Deno.env.get('OPENROUTER_API_KEY') || config?.openrouter_api_key;

        console.log(`[Ingest] Keys found -> Gemini: ${!!finalGeminiKey}, OpenAI: ${!!finalOpenAIKey}, OpenRouter: ${!!finalOpenRouterKey}`);

        if (!finalGeminiKey && !finalOpenAIKey && !finalOpenRouterKey) {
            throw new Error("No AI API keys configured. Please add your API keys in settings.");
        }

        // 1. CLEANUP: Delete previous chunks for this exact document/source to avoid duplicates
        const cleanupSource = filename || (metadata && metadata.source === 'manual_entry' ? 'manual_entry' : null);

        if (cleanupSource) {
            console.log(`[Ingest] Cleaning up old chunks for source: "${cleanupSource}"...`);
            let deleteQuery = supabaseAdmin
                .from('knowledge_base_chunks')
                .delete();

            if (v_tenant_id) {
                deleteQuery = deleteQuery.eq('tenant_id', v_tenant_id);
            } else {
                deleteQuery = deleteQuery.is('tenant_id', null);
            }

            // Perform cleanup using safe, explicit filters.
            // We prioritize filename if provided, otherwise fallback to source.
            if (filename) {
                deleteQuery = deleteQuery.eq('metadata->>filename', filename);
            } else if (metadata && metadata.source === 'manual_entry') {
                deleteQuery = deleteQuery.eq('metadata->>source', 'manual_entry');
            } else {
                // If neither is strictly defined, we skip cleanup to avoid accidental mass deletion
                console.log('[Ingest] Skipping cleanup: No specific source identifier found.');
                deleteQuery = null;
            }

            if (deleteQuery) {
                const { error: deleteError } = await deleteQuery;
                if (deleteError) {
                    console.warn('[Ingest] Cleanup warning (likely non-fatal):', deleteError);
                }
            }
        }

        // 2. SMART CHUNKING (Recursive Character Splitting)
        const CHUNK_SIZE = 800;
        const CHUNK_OVERLAP = 150;
        const chunks: string[] = [];

        // Simple but safe chunking
        let cur = 0;
        while (cur < content.length) {
            let end = cur + CHUNK_SIZE;
            if (end < content.length) {
                // Try to find a good break point
                const lastSpace = content.lastIndexOf(' ', end);
                const lastNewline = content.lastIndexOf('\n', end);
                const bestBreak = Math.max(lastSpace, lastNewline);
                if (bestBreak > cur + (CHUNK_SIZE * 0.5)) {
                    end = bestBreak;
                }
            } else {
                end = content.length;
            }

            const chunk = content.substring(cur, end).trim();
            if (chunk.length > 10) {
                chunks.push(chunk);
            }

            cur = end - CHUNK_OVERLAP;
            if (cur >= content.length || end >= content.length) break;
        }

        console.log(`[Ingest] Chunking complete. Generated ${chunks.length} chunks.`);

        // 3. Process chunks and generate embeddings
        let totalInputTokens = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            let vector: number[] = [];

            if (finalGeminiKey) {
                // Option A: Use Gemini (Google)
                const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${finalGeminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "models/text-embedding-004",
                        content: { parts: [{ text: chunkContent }] }
                    })
                });

                if (embedRes.ok) {
                    const embedData = await embedRes.json();
                    vector = embedData.embedding?.values;
                    // Log estimation or capture usage if available
                    totalInputTokens += Math.ceil(chunkContent.length / 4);
                } else if (!finalOpenAIKey && !finalOpenRouterKey) {
                    const errorData = await embedRes.json().catch(() => ({}));
                    throw new Error(`Gemini Embedding Error: ${errorData.error?.message || embedRes.statusText}`);
                }
            }

            if (vector.length === 0 && (finalOpenAIKey || finalOpenRouterKey)) {
                // Option B/C: Use OpenAI or OpenRouter (OpenAI-compatible)
                const isOR = !finalOpenAIKey && finalOpenRouterKey;
                const url = isOR ? 'https://openrouter.ai/api/v1/embeddings' : 'https://api.openai.com/v1/embeddings';
                const key = isOR ? finalOpenRouterKey : finalOpenAIKey;
                const model = isOR ? "openai/text-embedding-3-small" : "text-embedding-3-small";

                console.log(`[Ingest] Chunk ${i}: Attempting embedding via ${isOR ? 'OpenRouter' : 'OpenAI'} (${model})...`);

                const embedRes = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: model,
                        input: chunkContent,
                        dimensions: 768
                    })
                });

                if (embedRes.ok) {
                    const embedData = await embedRes.json();
                    vector = embedData.data?.[0]?.embedding;
                    totalInputTokens += embedData.usage?.total_tokens || Math.ceil(chunkContent.length / 4);
                } else {
                    const errorData = await embedRes.json().catch(() => ({}));
                    console.error(`[Ingest] ${isOR ? 'OpenRouter' : 'OpenAI'} Error:`, errorData);
                    throw new Error(`${isOR ? 'OpenRouter' : 'OpenAI'} Embedding Error: ${errorData.error?.message || embedRes.statusText}`);
                }
            }

            if (!vector || vector.length === 0) {
                throw new Error("Failed to generate embedding vector from any available provider.");
            }

            // Dimension check - IMPORTANT: our DB column is vector(768)
            if (vector.length !== 768) {
                console.warn(`[Ingest] Dimension mismatch: Expected 768, got ${vector.length}. Attempting to truncate/pad.`);
                if (vector.length > 768) vector = vector.slice(0, 768);
                else while (vector.length < 768) vector.push(0);
            }

            // Save to database
            const { error: insertError } = await supabaseAdmin.from('knowledge_base_chunks').insert({
                tenant_id: v_tenant_id,
                content: chunkContent,
                metadata: {
                    ...metadata,
                    filename,
                    chunk_index: i,
                    total_chunks: chunks.length,
                    ingested_at: new Date().toISOString()
                },
                embedding: vector
            });

            if (insertError) {
                console.error('[Ingest] Insert Error:', insertError);
                throw new Error(`Database Insert Error: ${insertError.message}`);
            }
        }

        // 4. LOG AGGREGATED USAGE
        try {
            const usageProvider = (v_tenant_id && !config?.ai_api_key) ? 'talkchat_ai' : 'customer_key';
            await supabaseAdmin.from('ai_usage_logs').insert({
                tenant_id: v_tenant_id,
                feature: 'knowledge_ingestion',
                provider: usageProvider,
                model_name: 'text-embedding',
                tokens_input: totalInputTokens,
                tokens_output: 0,
                estimated_cost: (totalInputTokens / 1000) * 0.00005 // Embeddings are cheaper
            });

            // Deduct credits if managed
            if (usageProvider === 'talkchat_ai' && v_tenant_id) {
                await supabaseAdmin.rpc('deduct_tenant_credits', {
                    p_tenant_id: v_tenant_id,
                    p_amount: totalInputTokens / 1000
                });
            }
        } catch (usageLogErr) {
            console.error('[Ingest] Usage log warning:', usageLogErr);
        }

        return new Response(JSON.stringify({
            success: true,
            chunks: chunks.length,
            message: `Successfully indexed ${chunks.length} chunks.`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('[Ingest Error]', error);
        return new Response(JSON.stringify({
            error: error.message,
            details: error instanceof Error ? error.stack : undefined
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
