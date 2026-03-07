import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavedArtifact } from "@/lib/db/types";

export async function saveArtifact(
  supabase: SupabaseClient,
  userId: string,
  slug: string
): Promise<void> {
  const { error } = await supabase
    .from("user_saved_artifacts")
    .upsert({ user_id: userId, artifact_slug: slug }, { onConflict: "user_id,artifact_slug" });

  if (error) throw new Error(`Failed to save artifact: ${error.message}`);
}

export async function unsaveArtifact(
  supabase: SupabaseClient,
  userId: string,
  slug: string
): Promise<void> {
  const { error } = await supabase
    .from("user_saved_artifacts")
    .delete()
    .eq("user_id", userId)
    .eq("artifact_slug", slug);

  if (error) throw new Error(`Failed to unsave artifact: ${error.message}`);
}

export async function isArtifactSaved(
  supabase: SupabaseClient,
  userId: string,
  slug: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_saved_artifacts")
    .select("id")
    .eq("user_id", userId)
    .eq("artifact_slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to check artifact saved state: ${error.message}`);
  return data !== null;
}

export async function getSavedArtifacts(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedArtifact[]> {
  const { data, error } = await supabase
    .from("user_saved_artifacts")
    .select("artifact_slug, saved_at, artifacts(title, domains, use_case)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) throw new Error(`Failed to get saved artifacts: ${error.message}`);

  type RawRow = {
    artifact_slug: string;
    saved_at: string;
    // Supabase returns joined one-to-one relations as an object or null
    // but its inferred type can be an array; cast via unknown.
    artifacts: { title: string; domains: string[]; use_case: string } | null;
  };

  return ((data ?? []) as unknown as RawRow[])
    .filter((row) => row.artifacts !== null)
    .map((row) => ({
      slug: row.artifact_slug,
      title: row.artifacts!.title,
      domains: row.artifacts!.domains,
      use_case: row.artifacts!.use_case,
      saved_at: row.saved_at,
    }));
}
