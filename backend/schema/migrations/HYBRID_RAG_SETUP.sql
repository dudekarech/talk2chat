-- ============================================================================
-- 🚀 HYBRID RAG: SEMANTIC + LEXICAL SEARCH
-- ============================================================================
-- Combines Vector Embeddings with Full-Text Search using RRF.
-- This ensures that both 'meaning' and 'exact keywords' find results.
-- ============================================================================

BEGIN;

-- 1. ADD FULL-TEXT SEARCH CAPABILITIES
-- This stores the searchable 'tokens' of your documents
ALTER TABLE knowledge_base_chunks 
ADD COLUMN IF NOT EXISTS fts_tokens tsvector;

-- 2. CREATE A TRIGGER TO AUTOMATICALLY UPDATE TOKENS
-- This happens every time you insert or edit a document chunk
CREATE OR REPLACE FUNCTION update_kb_fts_tokens() RETURNS trigger AS $$
BEGIN
  new.fts_tokens := to_tsvector('english', new.content);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_kb_fts_update ON knowledge_base_chunks;
CREATE TRIGGER tr_kb_fts_update
BEFORE INSERT OR UPDATE ON knowledge_base_chunks
FOR EACH ROW EXECUTE FUNCTION update_kb_fts_tokens();

-- 3. SPEED UP KEYWORD SEARCH
-- Create a GIN index for lightning-fast text lookups
CREATE INDEX IF NOT EXISTS idx_kb_chunks_fts ON knowledge_base_chunks USING GIN(fts_tokens);

-- 4. HYBRID MATCH FUNCTION (RRF)
-- Combines Vector Search and Full-Text Search
CREATE OR REPLACE FUNCTION match_knowledge_base_hybrid(
    query_embedding vector(768),
    query_text TEXT,
    match_threshold float,
    match_count int,
    p_tenant_id UUID,
    rrf_k int DEFAULT 60
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity float,
    rrf_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vector_results AS (
        SELECT 
            kb.id,
            1 - (kb.embedding <=> query_embedding) as similarity,
            row_number() OVER (ORDER BY (kb.embedding <=> query_embedding) ASC) as rank
        FROM knowledge_base_chunks kb
        WHERE kb.tenant_id IS NOT DISTINCT FROM p_tenant_id
          AND 1 - (kb.embedding <=> query_embedding) > match_threshold
        LIMIT 10 -- Get more candidates for fusion
    ),
    fts_results AS (
        SELECT 
            kb.id,
            ts_rank_cd(kb.fts_tokens, websearch_to_tsquery('english', query_text)) as text_score,
            row_number() OVER (ORDER BY ts_rank_cd(kb.fts_tokens, websearch_to_tsquery('english', query_text)) DESC) as rank
        FROM knowledge_base_chunks kb
        WHERE kb.tenant_id IS NOT DISTINCT FROM p_tenant_id
          AND kb.fts_tokens @@ websearch_to_tsquery('english', query_text)
        LIMIT 10
    )
    SELECT
        kb.id,
        kb.content,
        kb.metadata,
        COALESCE(vr.similarity, 0)::float as similarity,
        (
            COALESCE(1.0 / (rrf_k + vr.rank), 0.0) +
            COALESCE(1.0 / (rrf_k + fr.rank), 0.0)
        )::float as rrf_score
    FROM knowledge_base_chunks kb
    LEFT JOIN vector_results vr ON kb.id = vr.id
    LEFT JOIN fts_results fr ON kb.id = fr.id
    WHERE (vr.id IS NOT NULL OR fr.id IS NOT NULL)
    AND kb.tenant_id IS NOT DISTINCT FROM p_tenant_id
    ORDER BY rrf_score DESC
    LIMIT match_count;
END;
$$;

-- 5. INITIALIZE EXISTING DATA
-- Pre-generate tokens for any documents already in the database
UPDATE knowledge_base_chunks SET fts_tokens = to_tsvector('english', content) WHERE fts_tokens IS NULL;

COMMIT;

-- ✅ HYBRID RAG ACTIVATED.
SELECT 'Hybrid Search (Semantic + Lexical) is now active in the database.' as result;
