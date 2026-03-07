import type { SupabaseClient } from "@supabase/supabase-js";
import * as challengesRepo from "@/repositories/challenges";
import * as savedArtifactsRepo from "@/repositories/saved-artifacts";
import type { Challenge, SavedArtifact } from "@/lib/db/types";

export interface JourneyStats {
  total: number;
  active: number;
  completed: number;
  savedArtifacts: number;
}

export interface JourneyData {
  challenges: Challenge[];
  stats: JourneyStats;
  savedArtifacts: SavedArtifact[];
}

export async function getJourneyData(
  supabase: SupabaseClient,
  userId: string
): Promise<JourneyData> {
  const [challenges, savedArtifacts] = await Promise.all([
    challengesRepo.getSavedChallengesByUserId(supabase, userId),
    savedArtifactsRepo.getSavedArtifacts(supabase, userId).catch(() => [] as SavedArtifact[]),
  ]);

  const stats: JourneyStats = {
    total: challenges.length,
    active: challenges.filter(
      (c) => c.status === "open" || c.status === "in_progress"
    ).length,
    completed: challenges.filter((c) => c.status === "completed").length,
    savedArtifacts: savedArtifacts.length,
  };

  return { challenges, stats, savedArtifacts };
}
