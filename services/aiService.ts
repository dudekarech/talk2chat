import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabaseClient";

export class AIService {
    /**
     * Generate a response from Gemini
     */
    async generateGeminiResponse(
        message: string,
        history: Array<{ role: 'user' | 'model'; parts: string }>,
        systemInstructions: string,
        apiKey: string,
        modelName: string = "gemini-1.5-flash"
    ): Promise<string> {
        try {
            if (!apiKey) throw new Error("API Key is required");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelName || "gemini-1.5-flash",
                systemInstruction: systemInstructions
            });

            const chat = model.startChat({
                history: history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                })),
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('[AI Service] Gemini Error:', error);
            return "I'm sorry, I'm having trouble thinking right now. A human agent will be with you shortly.";
        }
    }

    async getAIResponse(payload: {
        message: string;
        history: any[];
        instructions: string;
        provider: string;
        apiKey?: string;
        modelName?: string;
        tenant_id?: string | null;
        session_id?: string;
    }): Promise<string> {
        const { message, instructions, provider, modelName } = payload;

        console.log('[AI Service] ========== AI REQUEST ==========');
        console.log('[AI Service] Provider:', provider);
        console.log('[AI Service] Model:', modelName);
        console.log('[AI Service] Instructions:', instructions?.substring(0, 50) || '(none)');

        // SECURITY UPDATE: Always route through the secure backend proxy.
        // This ensures keys are never exposed and all requests are logged/managed centrally.
        console.log('[AI Service] Routing through secure backend proxy...');
        return this.getAIResponseProxy(payload);
    }

    /**
     * Calls the secure Supabase Edge Function proxy
     */
    private async getAIResponseProxy(payload: any): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-chat', {
                body: payload
            });

            if (error) {
                console.error('[AI Service] ❌ Edge Function Error:', error);
                console.error('[AI Service] Error Status:', error.status);
                console.error('[AI Service] Error Context:', error.context);
                throw error;
            }

            if (data.error) {
                console.error('[AI Service] ❌ Data Error:', data.error);
                throw new Error(data.error);
            }

            return data.response || "No response from AI proxy.";
        } catch (error: any) {
            console.error('[AI Service] ===== PROXY ERROR DETAILS =====');
            console.error('[AI Service] Full Error Object:', error);
            console.error('[AI Service] Error Name:', error.name);
            console.error('[AI Service] Error Message:', error.message);
            console.error('[AI Service] Error Context:', error.context);

            let message = 'The AI service is temporarily unavailable.';
            let technicalDetails = '';

            // Try to extract detailed error from Supabase FunctionsHttpError
            if (error.context && error.context.body) {
                try {
                    const body = error.context.body;
                    let bodyJson: any;

                    // Handle null/undefined body safely
                    if (!body) {
                        message = error.message || 'Unknown network error';
                    }
                    // Handle string body
                    else if (typeof body === 'string') {
                        console.log('[AI Service] Response Body (String):', body);
                        try { bodyJson = JSON.parse(body); } catch { bodyJson = { message: body }; }
                    }
                    // Handle Blob/Response-like body
                    else if (typeof body.text === 'function') {
                        const text = await body.text();
                        console.log('[AI Service] Response Body (Text):', text);
                        try { bodyJson = JSON.parse(text); } catch { bodyJson = { message: text }; }
                    }
                    // Handle plain object body
                    else if (typeof body === 'object') {
                        console.log('[AI Service] Response Body (Object):', body);
                        bodyJson = body;
                    }

                    console.log('[AI Service] Parsed Body JSON:', bodyJson);
                    message = bodyJson?.error?.message || bodyJson?.error || bodyJson?.message || message;
                    technicalDetails = bodyJson?.details || bodyJson?.hint || '';

                    console.error('[AI Service] Extracted Error Message:', message);
                    console.error('[AI Service] Technical Details:', technicalDetails);
                } catch (e) {
                    console.warn('[AI Service] Failed to parse error body:', e);
                }
            } else if (error.message) {
                message = error.message;
            }

            // Create a detailed error message for logging
            const fullError = technicalDetails
                ? `${message} (${technicalDetails})`
                : message;

            console.error('[AI Service] ===== FINAL ERROR MESSAGE =====');
            console.error('[AI Service]', fullError);

            return `AI Service Error: ${message}`;
        }
    }

    private async generateOpenAIResponse(
        message: string,
        history: any[],
        instructions: string,
        apiKey: string,
        model: string = 'gpt-4o'
    ): Promise<string> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: instructions },
                        ...history.map(h => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "No response from OpenAI";
        } catch (error) {
            throw error;
        }
    }

    private async generateAnthropicResponse(
        message: string,
        history: any[],
        instructions: string,
        apiKey: string,
        model: string = 'claude-3-sonnet-20240229'
    ): Promise<string> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model,
                    system: instructions,
                    messages: [
                        ...history.map(h => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            return data.content?.[0]?.text || "No response from Anthropic";
        } catch (error) {
            throw error;
        }
    }

    private async generateGenericOpenAICompatibleResponse(
        message: string,
        history: any[],
        instructions: string,
        apiKey: string,
        model: string,
        provider: string
    ): Promise<string> {
        const baseUrl = provider === 'mistral' ? 'https://api.mistral.ai/v1' : 'https://api.deepseek.com/v1';
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: instructions },
                        ...history.map(h => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            return data.choices?.[0]?.message?.content || `No response from ${provider}`;
        } catch (error) {
            throw error;
        }
    }

    private async generateOpenRouterResponse(
        message: string,
        history: any[],
        instructions: string,
        apiKey: string,
        model: string
    ): Promise<string> {
        const targetModel = model || 'google/gemini-2.0-flash-001';
        console.log('[OpenRouter] Final Request Model:', targetModel);
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                    'X-Title': 'TalkChat Studio'
                },
                body: JSON.stringify({
                    model: targetModel,
                    messages: [
                        { role: 'system', content: instructions || 'You are a helpful assistant.' },
                        ...history.map(h => ({
                            role: h.role === 'model' ? 'assistant' : 'user',
                            content: h.parts
                        })),
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[OpenRouter] API Error Detail:', errorData);
                const errorMessage = errorData.error?.message || `Status ${response.status}`;
                throw new Error(`OpenRouter Error: ${errorMessage}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "No response from OpenRouter";
        } catch (error) {
            console.error('[OpenRouter] Fetch Error:', error);
            throw error;
        }
    }

    /**
     * Analyze a full chat transcript for summaries and leads
     */
    async analyzeChatTranscript(transcript: string, tenant_id: string | null = null, apiKey?: string): Promise<{
        summary: string;
        sentiment: string;
        leads: any;
        category: string;
    }> {
        if (!tenant_id && !apiKey) throw new Error("Tenant ID or API Key required for analysis");

        const prompt = `
            Analyze the following chat transcript between a support assistant and a visitor.
            Provide a JSON response with the following fields:
            1. "summary": A concise 2-sentence summary of the conversation and its resolution.
            2. "sentiment": One word: "Positive", "Neutral", or "Negative".
            3. "leads": A JSON object containing any extracted "email", "phone", "name", or "company" mentioned by the visitor.
            4. "category": A 1-2 word category (e.g. "Pricing", "Technical Issue", "Feature Request", "General Inquiry").

            Transcript:
            ${transcript}

            Response MUST be valid JSON.
        `;

        try {
            const response = await this.getAIResponse({
                message: prompt,
                history: [],
                instructions: "You are a data analyst. Always respond in valid JSON format.",
                provider: 'gemini', // Defaulting to gemini for analysis
                apiKey: apiKey,
                tenant_id: tenant_id,
                modelName: 'gemini-1.5-flash'
            });

            // Clean response if it contains markdown code blocks
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            return {
                summary: data.summary || "No summary available.",
                sentiment: data.sentiment || "Neutral",
                leads: data.leads || {},
                category: data.category || "Uncategorized"
            };
        } catch (error) {
            console.error('[AI Analysis] Error:', error);
            return {
                summary: "Error generating summary.",
                sentiment: "Neutral",
                leads: {},
                category: "General Inquiry"
            };
        }
    }

    /**
     * Legacy wrapper for backward compatibility
     * Required for some tenant-embedded versions of the widget.
     */
    async generateResponse(message: string, instructions: string, history: any[]): Promise<string> {
        console.log('[AI Service] Legacy generateResponse called');
        return this.getAIResponse({
            message,
            history: history?.map(h => ({ role: h.role, parts: h.content || h.parts })) || [],
            instructions: instructions || '',
            provider: 'gemini',
            apiKey: (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '')
        });
    }
    /**
     * Ingest a raw document into the Knowledge Base
     */
    async ingestKnowledgeBase(payload: {
        tenant_id: string | null;
        content: string;
        filename: string;
        metadata?: any;
    }): Promise<{ success: boolean; message: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('process-knowledge', {
                body: payload
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data;
        } catch (error: any) {
            console.error('[AI Service] Ingestion Error:', error);
            throw error;
        }
    }
}

console.log('[AI Service] Instance initialized v1.2');
export const aiService = new AIService();
