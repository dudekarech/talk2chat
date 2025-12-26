import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
    /**
     * Generate a response from Gemini
     */
    async generateGeminiResponse(
        message: string, 
        history: Array<{ role: 'user' | 'model'; parts: string }>,
        systemInstructions: string,
        apiKey: string
    ): Promise<string> {
        try {
            if (!apiKey) throw new Error("API Key is required");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: systemInstructions
            });

            const chat = model.startChat({
                history: history,
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

    /**
     * Simplified response handler
     */
    async getAIResponse(payload: {
        message: string;
        history: any[];
        instructions: string;
        provider: string;
        apiKey: string;
        modelName?: string;
    }): Promise<string> {
        const { message, history, instructions, provider, apiKey } = payload;

        if (provider === 'gemini') {
            return this.generateGeminiResponse(message, history, instructions, apiKey);
        }

        // Add OpenAI/Anthropic here later if needed
        return "Support for this AI provider is coming soon. A human will assist you shortly.";
    }
}

export const aiService = new AIService();
