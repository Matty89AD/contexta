import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Content,
  ContentInsert,
  ContentChunk,
  ContentChunkInsert,
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
      summary: input.summary ?? null,
      key_takeaways: input.key_takeaways ?? null,
      metadata: input.metadata ?? {},
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
