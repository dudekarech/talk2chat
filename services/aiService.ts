import { GoogleGenerativeAI } from "@google/generative-ai";

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
        apiKey: string;
        modelName?: string;
    }): Promise<string> {
        const { message, history, instructions, provider, apiKey, modelName } = payload;

        console.log('[AI Service] ========== AI REQUEST ==========');
        console.log('[AI Service] Provider:', provider);
        console.log('[AI Service] Model:', modelName);
        console.log('[AI Service] API Key present:', !!apiKey);
        console.log('[AI Service] API Key length:', apiKey?.length || 0);
        console.log('[AI Service] Instructions:', instructions?.substring(0, 100) || '(none)');
        console.log('[AI Service] Message:', message);

        if (!apiKey || apiKey.trim() === '') {
            console.error('[AI Service] ❌ No API key provided');
            return "AI API Key is missing. Please configure it in the Widget Settings.";
        }

        try {
            let response: string;

            if (provider === 'gemini') {
                console.log('[AI Service] Calling Gemini...');
                response = await this.generateGeminiResponse(message, history, instructions, apiKey, modelName);
            }
            else if (provider === 'openai') {
                console.log('[AI Service] Calling OpenAI...');
                response = await this.generateOpenAIResponse(message, history, instructions, apiKey, modelName);
            }
            else if (provider === 'anthropic') {
                console.log('[AI Service] Calling Anthropic...');
                response = await this.generateAnthropicResponse(message, history, instructions, apiKey, modelName);
            }
            else if (provider === 'mistral' || provider === 'deepseek') {
                console.log(`[AI Service] Calling ${provider}...`);
                response = await this.generateGenericOpenAICompatibleResponse(message, history, instructions, apiKey, modelName, provider);
            }
            else if (provider === 'openrouter') {
                const effectiveModel = modelName || 'google/gemini-2.0-flash-001';
                console.log(`[AI Service] Calling OpenRouter with model: ${effectiveModel}`);
                response = await this.generateOpenRouterResponse(message, history, instructions, apiKey, effectiveModel);
            }
            else {
                console.error(`[AI Service] ❌ Unsupported provider: ${provider}`);
                return "Support for this AI provider is coming soon. A human will assist you shortly.";
            }

            // Validate response
            if (!response || response.trim() === '') {
                console.error('[AI Service] ❌ Empty response received from AI');
                return "I'm having trouble generating a response. A human agent will assist you shortly.";
            }

            console.log('[AI Service] ✅ Response received:', response.substring(0, 100) + '...');
            return response;

        } catch (error) {
            console.error(`[AI Service] ❌ ${provider} Error:`, error);
            console.error('[AI Service] Error details:', JSON.stringify(error, null, 2));
            return "I'm having trouble thinking right now. A human agent will be with you shortly.";
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
    async analyzeChatTranscript(transcript: string, apiKey: string): Promise<{
        summary: string;
        sentiment: string;
        leads: any;
        category: string;
    }> {
        if (!apiKey) throw new Error("API Key required for analysis");

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
}

console.log('[AI Service] Instance initialized v1.1');
export const aiService = new AIService();
