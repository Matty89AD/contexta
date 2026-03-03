import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChunkWithContent, Content, ContentChunk } from "@/lib/db/types";

/** Match pgvector cosine distance: 1 - (embedding <=> query) is cosine similarity */
export async function findSimilarChunks(
  supabase: SupabaseClient,
  embedding: number[],
  topK: number
): Promise<ChunkWithContent[]> {
  const { data: chunks, error } = await supabase.rpc("match_content_chunks", {
    query_embedding: embedding,
    match_count: topK,
  });
  if (error) {
    throw error;
  }
  if (!chunks || !Array.isArray(chunks)) return [];

  return chunks.map((row: { chunk: ContentChunk; content: Content; similarity?: number }) => ({
    chunk: row.chunk,
    content: row.content,
    similarity: row.similarity,
  }));
}

/**
 * Full-text keyword search on content_chunks using tsvector/tsquery (Epic 7).
 * Returns chunks ranked by ts_rank_cd keyword relevance score.
 * Returns empty array (not an error) if no matches or tsvector not yet populated.
 */
export async function findChunksByKeyword(
  supabase: SupabaseClient,
  query: string,
  topK: number
): Promise<ChunkWithContent[]> {
  if (!query.trim()) return [];
  const { data: chunks, error } = await supabase.rpc("keyword_match_content_chunks", {
    query_text: query,
    match_count: topK,
  });
  if (error) {
    // Keyword search failure is non-fatal: fall back to vector-only (Epic 7 note: latency target)
    console.warn("[embeddings] keyword_match_content_chunks error:", error.message);
    return [];
  }
  if (!chunks || !Array.isArray(chunks)) return [];

  return chunks.map(
    (row: { chunk: ContentChunk; content: Content; keyword_score?: number }) => ({
      chunk: row.chunk,
      content: row.content,
      keywordScore: row.keyword_score ?? 0,
    })
  );
}
