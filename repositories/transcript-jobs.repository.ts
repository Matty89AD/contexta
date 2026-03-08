/**
 * Transcript jobs repository — data access for Epic 17.
 * All functions expect a service-role Supabase client (bypasses RLS).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TranscriptJob,
  TranscriptJobInsert,
  TranscriptJobStatus,
} from "@/lib/db/types";

export async function createTranscriptJob(
  supabase: SupabaseClient,
  input: TranscriptJobInsert
): Promise<TranscriptJob> {
  const { data, error } = await supabase
    .from("transcript_jobs")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as TranscriptJob;
}

export async function getTranscriptJobById(
  supabase: SupabaseClient,
  id: string
): Promise<TranscriptJob | null> {
  const { data, error } = await supabase
    .from("transcript_jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as TranscriptJob;
}

export async function listTranscriptJobs(
  supabase: SupabaseClient,
  adminId: string
): Promise<TranscriptJob[]> {
  const { data, error } = await supabase
    .from("transcript_jobs")
    .select("*")
    .eq("created_by", adminId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as TranscriptJob[];
}

export async function updateTranscriptJobStatus(
  supabase: SupabaseClient,
  id: string,
  status: TranscriptJobStatus,
  extra?: { error_message?: string | null; content_id?: string | null }
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (extra?.error_message !== undefined) updates.error_message = extra.error_message;
  if (extra?.content_id !== undefined) updates.content_id = extra.content_id;
  const { error } = await supabase.from("transcript_jobs").update(updates).eq("id", id);
  if (error) throw error;
}

export async function findJobByContentId(
  supabase: SupabaseClient,
  contentId: string
): Promise<TranscriptJob | null> {
  const { data, error } = await supabase
    .from("transcript_jobs")
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as TranscriptJob | null;
}
