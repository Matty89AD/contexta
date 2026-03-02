import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as usersRepo from "@/repositories/users";
import type {
  Profile,
  ProfileRole,
  CompanyStage,
  TeamSize,
  ExperienceLevel,
} from "@/lib/db/types";
import { ValidationError } from "@/core/errors";

const profileSchema = z.object({
  role: z.enum(["founder", "cpo_director", "head_of_product", "sr_pm", "associate_pm"]),
  company_stage: z.enum([
    "preseed_seed",
    "series_a_b",
    "growth_series_c_plus",
    "enterprise",
    "corporate",
  ]),
  team_size: z.enum(["1-5", "6-15", "16-50", "51+"]),
  experience_level: z.enum(["junior", "mid", "senior", "lead"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function createOrUpdateProfile(
  supabase: SupabaseClient,
  userId: string,
  input: unknown
): Promise<Profile> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  const { role, company_stage, team_size, experience_level } = parsed.data;
  return usersRepo.createOrUpdateProfile(supabase, {
    id: userId,
    role: role as ProfileRole,
    company_stage: company_stage as CompanyStage,
    team_size: team_size as TeamSize,
    experience_level: experience_level as ExperienceLevel,
  });
}
