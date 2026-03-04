import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Content,
  ContentInsert,
  ContentChunk,
  ContentChunkInsert,
  ChunkType,
} from "@/lib/db/types";

export async function createContent(
  supabase: SupabaseClient,
  input: ContentInsert
): Promise<Content> {
  const { data, error } = await supabase
    .from("content")
    .insert({
      source_type: input.source_type,
      title: input.title,
      url: input.url ?? null,
      primary_domain: input.primary_domain ?? null,
      domains: input.domains ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as Content;
}

export async function createContentChunk(
  supabase: SupabaseClient,
  input: ContentChunkInsert
): Promise<ContentChunk> {
  const { data, error } = await supabase
    .from("content_chunks")
    .insert({
      content_id: input.content_id,
      body: input.body,
      embedding: input.embedding,
      chunk_index: input.chunk_index,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContentChunk;
}

/** Update document-level intelligence fields on a content record (Epic 8). */
export async function updateContentIntelligence(
  supabase: SupabaseClient,
  contentId: string,
  intel: {
    topics: string[];
    keywords: string[];
    author: string | null;
    publication_date: string | null;
    content_category: string | null;
    language: string;
    extraction_confidence: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("content")
    .update(intel)
    .eq("id", contentId);
  if (error) throw error;
}

/** Update chunk-level intelligence fields on a content_chunk record (Epic 8). */
export async function updateChunkIntelligence(
  supabase: SupabaseClient,
  chunkId: string,
  intel: {
    chunk_type: ChunkType;
    key_concepts: string[];
  }
): Promise<void> {
  const { error } = await supabase
    .from("content_chunks")
    .update(intel)
    .eq("id", chunkId);
  if (error) throw error;
}

/** Load all chunks for a content record ordered by chunk_index (Epic 8 backfill). */
export async function listChunksByContentId(
  supabase: SupabaseClient,
  contentId: string
): Promise<ContentChunk[]> {
  const { data, error } = await supabase
    .from("content_chunks")
    .select("*")
    .eq("content_id", contentId)
    .order("chunk_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContentChunk[];
}

export async function getContentById(
  supabase: SupabaseClient,
  id: string
): Promise<Content | null> {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Content;
}

export async function listContent(
  supabase: SupabaseClient
): Promise<Content[]> {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Content[];
}
