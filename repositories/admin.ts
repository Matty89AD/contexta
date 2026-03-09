/**
 * Admin repository — data access for the Admin UI (Epic 16).
 * All functions expect a service-role Supabase client (bypasses RLS).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Content,
  ContentStatus,
  ContentSourceType,
  ChallengeDomain,
  NewsPost,
  NewsPostType,
  NewsPostStatus,
  ArtifactStatus,
} from "@/lib/db/types";

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface AdminStats {
  content: { total: number; by_status: Record<ContentStatus, number> };
  news: { total: number; by_status: Record<NewsPostStatus, number> };
  artifacts: { total: number; by_status: Record<ArtifactStatus, number> };
  unread_notifications: number;
}

export async function getStats(supabase: SupabaseClient): Promise<AdminStats> {
  const [contentRows, newsRows, artifactRows, notifRows] = await Promise.all([
    supabase.from("content").select("status"),
    supabase.from("news_posts").select("status"),
    supabase.from("artifacts").select("status"),
    supabase.from("admin_notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);

  const contentStatuses = (contentRows.data ?? []) as { status: ContentStatus }[];
  const newsStatuses = (newsRows.data ?? []) as { status: NewsPostStatus }[];
  const artifactStatuses = (artifactRows.data ?? []) as { status: ArtifactStatus }[];

  const contentByStatus: Record<ContentStatus, number> = {
    draft: 0,
    pending_review: 0,
    active: 0,
    archived: 0,
  };
  for (const row of contentStatuses) {
    contentByStatus[row.status] = (contentByStatus[row.status] ?? 0) + 1;
  }

  const newsByStatus: Record<NewsPostStatus, number> = { draft: 0, published: 0 };
  for (const row of newsStatuses) {
    newsByStatus[row.status] = (newsByStatus[row.status] ?? 0) + 1;
  }

  const artifactByStatus: Record<ArtifactStatus, number> = {
    draft: 0,
    pending_review: 0,
    active: 0,
    archived: 0,
  };
  for (const row of artifactStatuses) {
    artifactByStatus[row.status] = (artifactByStatus[row.status] ?? 0) + 1;
  }

  return {
    content: { total: contentStatuses.length, by_status: contentByStatus },
    news: { total: newsStatuses.length, by_status: newsByStatus },
    artifacts: { total: artifactStatuses.length, by_status: artifactByStatus },
    unread_notifications: notifRows.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface ContentFilters {
  status?: ContentStatus;
  source_type?: ContentSourceType;
  domain?: ChallengeDomain;
  page?: number; // 1-indexed, default 1
  limit?: number; // default 50
}

export interface ContentListResult {
  items: Content[];
  total: number;
  page: number;
  limit: number;
}

export async function listContent(
  supabase: SupabaseClient,
  filters: ContentFilters = {}
): Promise<ContentListResult> {
  const limit = filters.limit ?? 50;
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("content")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source_type) query = query.eq("source_type", filters.source_type);
  if (filters.domain) query = query.contains("domains", [filters.domain]);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    items: (data ?? []) as Content[],
    total: count ?? 0,
    page,
    limit,
  };
}

export interface ContentWithChunkCount extends Content {
  chunk_count: number;
}

export async function getContentById(
  supabase: SupabaseClient,
  id: string
): Promise<ContentWithChunkCount | null> {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const { count } = await supabase
    .from("content_chunks")
    .select("id", { count: "exact", head: true })
    .eq("content_id", id);

  return { ...(data as Content), chunk_count: count ?? 0 };
}

export interface AdminContentCreate {
  source_type: ContentSourceType;
  url: string;
  title?: string;
  transcript_raw?: string;
}

export async function createContent(
  supabase: SupabaseClient,
  input: AdminContentCreate
): Promise<Content> {
  const { data, error } = await supabase
    .from("content")
    .insert({
      source_type: input.source_type,
      url: input.url,
      title: input.title ?? input.url,
      status: "draft",
      transcript_raw: input.transcript_raw ?? null,
      domains: [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as Content;
}

export interface AdminContentUpdate {
  title?: string;
  url?: string;
  author?: string;
  domains?: ChallengeDomain[];
  topics?: string[];
  keywords?: string[];
  publication_date?: string | null;
  status?: ContentStatus;
  transcript_raw?: string | null;
}

export async function updateContent(
  supabase: SupabaseClient,
  id: string,
  updates: AdminContentUpdate
): Promise<Content> {
  const { data, error } = await supabase
    .from("content")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Content;
}

export async function deleteContent(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  // Guard: only draft or archived items can be hard-deleted
  const { data } = await supabase
    .from("content")
    .select("status")
    .eq("id", id)
    .single();
  if (data && data.status !== "draft" && data.status !== "archived") {
    throw new Error(
      `Cannot delete content with status "${data.status}". Only draft or archived items may be deleted.`
    );
  }
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// News posts
// ---------------------------------------------------------------------------

export async function listNews(supabase: SupabaseClient): Promise<NewsPost[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NewsPost[];
}

export async function getPublishedNews(
  supabase: SupabaseClient
): Promise<NewsPost[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NewsPost[];
}

export interface NewsPostCreate {
  type: NewsPostType;
  title: string;
  description: string;
  published_date: string;
  status?: NewsPostStatus;
  sort_order?: number;
  /** Epic 19 — AI-generated proposal fields. */
  is_ai_generated?: boolean;
  source_type?: "content" | "artifact" | null;
  source_id?: string | null;
}

export async function createNews(
  supabase: SupabaseClient,
  input: NewsPostCreate
): Promise<NewsPost> {
  const { data, error } = await supabase
    .from("news_posts")
    .insert({
      type: input.type,
      title: input.title,
      description: input.description,
      published_date: input.published_date,
      status: input.status ?? "draft",
      sort_order: input.sort_order ?? 0,
      is_ai_generated: input.is_ai_generated ?? false,
      source_type: input.source_type ?? null,
      source_id: input.source_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as NewsPost;
}

export async function getNewsById(
  supabase: SupabaseClient,
  id: string
): Promise<NewsPost | null> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as NewsPost;
}

export interface NewsPostUpdate {
  type?: NewsPostType;
  title?: string;
  description?: string;
  published_date?: string;
  status?: NewsPostStatus;
  sort_order?: number;
}

export async function updateNews(
  supabase: SupabaseClient,
  id: string,
  updates: NewsPostUpdate
): Promise<NewsPost> {
  const { data, error } = await supabase
    .from("news_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as NewsPost;
}

export async function deleteNews(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) throw error;
}
