import type { SupabaseClient } from "@supabase/supabase-js";
import * as challengesRepo from "@/repositories/challenges";
import type { Challenge } from "@/lib/db/types";

export interface JourneyStats {
  total: number;
  active: number;
  completed: number;
}

export interface JourneyData {
  challenges: Challenge[];
  stats: JourneyStats;
}

export async function getJourneyData(
  supabase: SupabaseClient,
  userId: string
): Promise<JourneyData> {
  const challenges = await challengesRepo.getSavedChallengesByUserId(supabase, userId);

  const stats: JourneyStats = {
    total: challenges.length,
    active: challenges.filter(
      (c) => c.status === "open" || c.status === "in_progress"
    ).length,
    completed: challenges.filter((c) => c.status === "completed").length,
  };

  return { challenges, stats };
}
