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
