import { supabase } from './supabaseClient';

export interface KnowledgeChunk {
    id?: string;
    content: string;
    metadata?: any;
    tenant_id: string;
}

class KnowledgeBaseService {
    /**
     * Chunks a large string into smaller pieces for better AI context retrieval
     */
    private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
        const chunks: string[] = [];
        let startIndex = 0;

        while (startIndex < text.length) {
            let endIndex = startIndex + chunkSize;

            // Adjust to end on a space or newline so we don't cut words in half
            if (endIndex < text.length) {
                const lastSpace = text.lastIndexOf(' ', endIndex);
                const lastNewline = text.lastIndexOf('\n', endIndex);
                const bestBreak = Math.max(lastSpace, lastNewline);

                if (bestBreak > startIndex) {
                    endIndex = bestBreak;
                }
            }

            chunks.push(text.substring(startIndex, endIndex).trim());
            startIndex = endIndex - overlap;

            // Prevent infinite loops if overlap is too large or chunk is stuck
            if (startIndex >= text.length || endIndex >= text.length) break;
        }

        return chunks.filter(c => c.length > 20); // Filter out tiny chunks
    }

    /**
     * Syncs a tenant's manual text knowledge base.
     */
    async syncTextKnowledge(tenantId: string, fullText: string): Promise<{ success: boolean; error?: any }> {
        try {
            // 1. Clear ONLY the manual entry knowledge for this tenant
            // We use a specific RPC or filter by metadata in the future.
            // For now, let's just use the process-knowledge function which handles updates.

            const { data, error } = await supabase.functions.invoke('process-knowledge', {
                body: {
                    tenant_id: tenantId,
                    content: fullText,
                    filename: 'manual_entry.txt',
                    metadata: { source: 'manual_entry' }
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return { success: true };
        } catch (error: any) {
            console.error('[KB Service] Sync Error Details:', {
                message: error.message,
                status: error.status,
                context: error.context
            });

            // Try to extract a more specific error message from the response body if available
            let errorMessage = "Synchronization failed. Please check your AI API key and internet connection.";
            if (error.context && typeof error.context === 'object') {
                // Supabase FunctionsHttpError often puts the response text in context
                errorMessage = `Server Error: ${error.message}`;
            }

            return { success: false, error: { message: errorMessage, original: error } };
        }
    }

    /**
     * Get knowledge base info (just count for now)
     */
    async getKnowledgeStats(tenantId: string): Promise<{ count: number }> {
        const { count, error } = await supabase
            .from('knowledge_base_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

        return { count: count || 0 };
    }
}

export const knowledgeBaseService = new KnowledgeBaseService();
