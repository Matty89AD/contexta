import type { SupabaseClient } from "@supabase/supabase-js";
import type { Challenge, ChallengeInsert } from "@/lib/db/types";

export async function createChallenge(
  supabase: SupabaseClient,
  input: ChallengeInsert
): Promise<Challenge> {
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      user_id: input.user_id ?? null,
      raw_description: input.raw_description,
      domain: input.domain,
      domains: input.domains,
      subdomain: input.subdomain ?? null,
      impact_reach: input.impact_reach ?? null,
      summary: input.summary ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Challenge;
}

export async function updateChallengeAnalysis(
  supabase: SupabaseClient,
  id: string,
  fields: { summary: string; problem_statement: string; desired_outcome_statement: string }
): Promise<void> {
  const { error } = await supabase
    .from("challenges")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function getChallengeById(
  supabase: SupabaseClient,
  id: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Challenge;
}

export async function getChallengesByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Challenge[];
}
