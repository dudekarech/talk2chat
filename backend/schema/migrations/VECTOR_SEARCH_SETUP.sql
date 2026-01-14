-- ============================================================================
-- 🧠 INTELLIGENT KNOWLEDGE BASE (VECTOR SEARCH / RAG)
-- ============================================================================
-- 1. Enables pgvector extension for semantic search.
-- 2. Creates storage for knowledge base chunks and their embeddings.
-- 3. Implements high-performance vector similarity search.
-- ============================================================================

-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

BEGIN;

-- 1. KNOWLEDGE BASE STORAGE
-- This table stores the actual text chunks and their mathematical 'meaning' (embeddings)
CREATE TABLE IF NOT EXISTS knowledge_base_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768), -- Matching Gemini 'text-embedding-004' dimensions (usually 768)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SEARCH OPTIMIZATION
-- Create an index for fast vector similarity search (IVFFlat or HNSW)
-- HNSW is generally better for performance in Postgres
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding ON knowledge_base_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Index for tenant isolation
CREATE INDEX IF NOT EXISTS idx_kb_chunks_tenant_id ON knowledge_base_chunks(tenant_id);

-- 3. VECTOR SEARCH FUNCTION
-- This is called by the AI Service to find the most relevant context for a question
CREATE OR REPLACE FUNCTION match_knowledge_base(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_tenant_id UUID
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        knowledge_base_chunks.id,
        knowledge_base_chunks.content,
        knowledge_base_chunks.metadata,
        1 - (knowledge_base_chunks.embedding <=> query_embedding) AS similarity
    FROM knowledge_base_chunks
    WHERE (1 - (knowledge_base_chunks.embedding <=> query_embedding) > match_threshold)
    AND (knowledge_base_chunks.tenant_id = p_tenant_id)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- 4. HOUSEKEEPING: Clear old knowledge for a tenant
CREATE OR REPLACE FUNCTION clear_tenant_knowledge(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM knowledge_base_chunks WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS POLICIES
ALTER TABLE knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own knowledge chunks"
ON knowledge_base_chunks FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

COMMIT;

-- ✅ VECTOR INFRASTRUCTURE READY.
SELECT 'Vector Search / RAG infrastructure initialized.' as result;
