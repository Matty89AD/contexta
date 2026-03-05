import type { SupabaseClient } from "@supabase/supabase-js";
import type { Artifact } from "@/lib/db/types";

export async function listArtifacts(supabase: SupabaseClient): Promise<Artifact[]> {
  const { data, error } = await supabase
    .from("artifacts")
    .select("id, slug, title, domains, use_case, created_at")
    .order("title", { ascending: true });

  if (error) throw new Error(`Failed to list artifacts: ${error.message}`);
  return (data ?? []) as Artifact[];
}

export async function getArtifactBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Artifact | null> {
  const { data, error } = await supabase
    .from("artifacts")
    .select("id, slug, title, domains, use_case, detail, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to get artifact: ${error.message}`);
  return (data ?? null) as Artifact | null;
}

export async function updateArtifactDetail(
  supabase: SupabaseClient,
  slug: string,
  detail: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("artifacts")
    .update({ detail })
    .eq("slug", slug);

  if (error) throw new Error(`Failed to update artifact detail: ${error.message}`);
}
