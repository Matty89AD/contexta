import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentView } from "@/lib/db/types";

/**
 * Insert a view row or increment view_count + update last_viewed_at.
 * Uses select-then-write to support atomic increment without a DB function.
 */
export async function upsertView(
  supabase: SupabaseClient,
  userId: string,
  contentId: string
): Promise<ContentView> {
  const existing = await getView(supabase, userId, contentId);

  if (existing) {
    const { data, error } = await supabase
      .from("user_content_views")
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: existing.view_count + 1,
      })
      .eq("user_id", userId)
      .eq("content_id", contentId)
      .select()
      .single();
    if (error) throw error;
    return data as ContentView;
  }

  const { data, error } = await supabase
    .from("user_content_views")
    .insert({ user_id: userId, content_id: contentId })
    .select()
    .single();
  if (error) throw error;
  return data as ContentView;
}

/** Fetch a single view record; returns null if not viewed yet. */
export async function getView(
  supabase: SupabaseClient,
  userId: string,
  contentId: string
): Promise<ContentView | null> {
  const { data, error } = await supabase
    .from("user_content_views")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as ContentView;
}

/** Batch fetch view records for a list of content IDs (for hydrating cards). */
export async function getViewsForContents(
  supabase: SupabaseClient,
  userId: string,
  contentIds: string[]
): Promise<ContentView[]> {
  if (contentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("user_content_views")
    .select("*")
    .eq("user_id", userId)
    .in("content_id", contentIds);

  if (error) throw error;
  return (data ?? []) as ContentView[];
}
