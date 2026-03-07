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
  // Step 1: fetch saved rows for this user
  const { data: savedRows, error: savedError } = await supabase
    .from("user_saved_artifacts")
    .select("artifact_slug, saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (savedError) throw new Error(`Failed to get saved artifacts: ${savedError.message}`);
  if (!savedRows || savedRows.length === 0) return [];

  const slugs = savedRows.map((r) => r.artifact_slug as string);

  // Step 2: fetch artifact details by slug (no implicit FK join needed)
  const { data: artifacts, error: artError } = await supabase
    .from("artifacts")
    .select("slug, title, domains, use_case")
    .in("slug", slugs);

  if (artError) throw new Error(`Failed to get artifact details: ${artError.message}`);

  const artifactMap = new Map(
    (artifacts ?? []).map((a) => [
      a.slug as string,
      a as { slug: string; title: string; domains: string[]; use_case: string },
    ])
  );

  return savedRows
    .filter((row) => artifactMap.has(row.artifact_slug as string))
    .map((row) => {
      const art = artifactMap.get(row.artifact_slug as string)!;
      return {
        slug: art.slug,
        title: art.title,
        domains: art.domains,
        use_case: art.use_case,
        saved_at: row.saved_at as string,
      };
    });
}
