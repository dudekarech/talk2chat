import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, SenderType } from '../types';

// Declare process to avoid TS errors if types are missing
declare const process: any;

const getAiClient = () => {
  // Try to get API key from environment
  const apiKey = process.env.API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '');

  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled or simulated.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generates a suggested reply for the agent based on chat history.
 */
export const generateAgentSuggestion = async (
  chatHistory: Message[],
  visitorName: string,
  businessContext: string,
  temperature: number = 0.7
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Configuration Error: Missing API Key. Please configure your environment.";

  // Format history for the prompt
  const conversationText = chatHistory
    .map(m => `${m.senderType === SenderType.VISITOR ? 'Visitor' : 'Agent'}: ${m.content}`)
    .join('\n');

  const prompt = `
    You are an expert customer support AI assistant for a SaaS company called "TalkChat Studio".
    Your goal is to suggest a professional, helpful, and concise response for the AGENT to send to the VISITOR.
    
    Context:
    ${businessContext}
    
    Conversation History:
    ${conversationText}
    
    Suggest a response for the Agent:
  `;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
      }
    });
    const response = await result.response;
    return response.text() ? response.text().trim() : "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the AI brain right now.";
  }
};

/**
 * Simulates a visitor replying (for testing/demo purposes).
 */
export const simulateVisitorReply = async (
  chatHistory: Message[]
): Promise<string> => {
  const ai = getAiClient();

  // Fallback simulation if no API key is present
  if (!ai) {
    const responses = [
      "That sounds great, thanks!",
      "Can you tell me more about pricing?",
      "I'm still not sure about the integration.",
      "Does this work with WordPress?",
      "Okay, I'll check the docs."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  const conversationText = chatHistory
    .map(m => `${m.senderType === SenderType.VISITOR ? 'Me' : 'Support Agent'}: ${m.content}`)
    .join('\n');

  const prompt = `
    Roleplay: You are a customer visiting a website. You are chatting with support.
    Based on the history below, write a short, natural follow-up message or question.
    Keep it under 20 words.
    
    History:
    ${conversationText}
    
    Your reply:
  `;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const response = await result.response;
    return response.text() ? response.text().trim() : "Thanks for the info.";
  } catch (error) {
    return "Thanks for the info.";
  }
};