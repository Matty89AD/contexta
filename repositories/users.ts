import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileInsert } from "@/lib/db/types";

export async function getProfileById(
  supabase: SupabaseClient,
  id: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Profile;
}

export async function createProfile(
  supabase: SupabaseClient,
  profile: ProfileInsert
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<ProfileInsert, "id">>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function createOrUpdateProfile(
  supabase: SupabaseClient,
  profile: ProfileInsert
): Promise<Profile> {
  const existing = await getProfileById(supabase, profile.id);
  if (existing) {
    return updateProfile(supabase, profile.id, {
      role: profile.role,
      company_stage: profile.company_stage,
      team_size: profile.team_size,
      experience_level: profile.experience_level,
    });
  }
  return createProfile(supabase, profile);
}
