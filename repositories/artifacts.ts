import type { SupabaseClient } from "@supabase/supabase-js";
import type { Artifact, ArtifactStatus, ChallengeDomain } from "@/lib/db/types";

export async function listArtifacts(supabase: SupabaseClient): Promise<Artifact[]> {
  // Use select("*") for forward-compatibility with new columns added via migration
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw new Error(`Failed to list artifacts: ${error.message}`);
  // Filter to active only in-memory so this works before migration adds the status column
  const rows = (data ?? []) as Artifact[];
  return rows.filter((a) => !a.status || a.status === "active");
}

export async function getArtifactBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Artifact | null> {
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
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

// ---------------------------------------------------------------------------
// Admin artifact management (Epic 19)
// ---------------------------------------------------------------------------

export interface ArtifactAdminFilters {
  status?: ArtifactStatus;
  domain?: ChallengeDomain;
  is_ai_generated?: boolean;
  page?: number;
  limit?: number;
}

export interface ArtifactListResult {
  items: Artifact[];
  total: number;
  page: number;
  limit: number;
}

export async function listArtifactsAdmin(
  supabase: SupabaseClient,
  filters: ArtifactAdminFilters = {}
): Promise<ArtifactListResult> {
  const limit = filters.limit ?? 50;
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("artifacts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.domain) query = query.contains("domains", [filters.domain]);
  if (filters.is_ai_generated !== undefined)
    query = query.eq("is_ai_generated", filters.is_ai_generated);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to list artifacts: ${error.message}`);

  return {
    items: (data ?? []) as Artifact[],
    total: count ?? 0,
    page,
    limit,
  };
}

export async function getArtifactById(
  supabase: SupabaseClient,
  id: string
): Promise<Artifact | null> {
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to get artifact: ${error.message}`);
  return (data ?? null) as Artifact | null;
}

export interface ArtifactCreate {
  slug: string;
  title: string;
  domains: ChallengeDomain[];
  use_case: string;
  detail?: Record<string, unknown> | null;
  status?: ArtifactStatus;
  is_ai_generated?: boolean;
  source_content_id?: string | null;
  possible_duplicate_of?: string | null;
}

export async function createArtifact(
  supabase: SupabaseClient,
  data: ArtifactCreate
): Promise<Artifact> {
  const { data: row, error } = await supabase
    .from("artifacts")
    .insert({
      slug: data.slug,
      title: data.title,
      domains: data.domains,
      use_case: data.use_case,
      detail: data.detail ?? null,
      status: data.status ?? "active",
      is_ai_generated: data.is_ai_generated ?? false,
      source_content_id: data.source_content_id ?? null,
      possible_duplicate_of: data.possible_duplicate_of ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create artifact: ${error.message}`);
  return row as Artifact;
}

export interface ArtifactUpdate {
  title?: string;
  slug?: string;
  domains?: ChallengeDomain[];
  use_case?: string;
  detail?: Record<string, unknown> | null;
  status?: ArtifactStatus;
  possible_duplicate_of?: string | null;
}

export async function updateArtifact(
  supabase: SupabaseClient,
  id: string,
  updates: ArtifactUpdate
): Promise<Artifact> {
  const { data, error } = await supabase
    .from("artifacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update artifact: ${error.message}`);
  return data as Artifact;
}

export async function deleteArtifact(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  // Guard: active artifacts cannot be hard-deleted
  const { data } = await supabase
    .from("artifacts")
    .select("status")
    .eq("id", id)
    .single();
  if (data?.status === "active") {
    throw new Error("Cannot delete an active artifact. Archive it first.");
  }
  const { error } = await supabase.from("artifacts").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete artifact: ${error.message}`);
}

export async function getArtifactTitlesAndSlugs(
  supabase: SupabaseClient
): Promise<{ title: string; slug: string }[]> {
  const { data, error } = await supabase
    .from("artifacts")
    .select("title, slug")
    .order("title", { ascending: true });
  if (error) throw new Error(`Failed to get artifact titles: ${error.message}`);
  return (data ?? []) as { title: string; slug: string }[];
}

export async function getArtifactCountsByStatus(
  supabase: SupabaseClient
): Promise<Record<ArtifactStatus, number>> {
  const { data, error } = await supabase.from("artifacts").select("status");
  if (error) throw new Error(`Failed to get artifact counts: ${error.message}`);

  const counts: Record<ArtifactStatus, number> = {
    draft: 0,
    pending_review: 0,
    active: 0,
    archived: 0,
  };
  for (const row of (data ?? []) as { status: ArtifactStatus }[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}
