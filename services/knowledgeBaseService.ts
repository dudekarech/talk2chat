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
     * Sycs a tenant's knowledge base. 
     * This will chunk the text and send it to a backend function to generate embeddings.
     */
    async syncTextKnowledge(tenantId: string, fullText: string): Promise<{ success: boolean; error?: any }> {
        try {
            // 1. Clear existing knowledge for this tenant
            await supabase.rpc('clear_tenant_knowledge', { p_tenant_id: tenantId });

            // 2. Chunk the text
            const chunks = this.chunkText(fullText);

            if (chunks.length === 0) return { success: true };

            // 3. Send chunks to Edge Function to generate embeddings and save
            // We use an Edge Function because generating embeddings requires an API key 
            // that should stay on the backend.
            const { data, error } = await supabase.functions.invoke('process-knowledge', {
                body: {
                    tenant_id: tenantId,
                    chunks: chunks.map(content => ({ content, metadata: { source: 'manual_entry' } }))
                }
            });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[KB Service] Sync Error:', error);
            return { success: false, error };
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
