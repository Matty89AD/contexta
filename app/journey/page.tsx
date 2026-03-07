"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JourneyInsights } from "@/components/journey/JourneyInsights";
import { ActiveChallenges } from "@/components/journey/ActiveChallenges";
import { ChallengeHistoryTable } from "@/components/journey/ChallengeHistoryTable";
import { ArtifactVault } from "@/components/journey/ArtifactVault";
import type { Challenge, SavedArtifact } from "@/lib/db/types";
import type { JourneyStats } from "@/services/journey";

function LoadingSkeleton() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Journey Dashboard</h1>
      <div className="animate-pulse space-y-4 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
      </div>
    </main>
  );
}

type JourneyTab = "challenges" | "vault";

function JourneyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cid = searchParams?.get("cid") ?? null;

  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [savedArtifacts, setSavedArtifacts] = useState<SavedArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JourneyTab>("challenges");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login?next=/journey");
        return;
      }

      // Auto-claim challenge arriving from Google OAuth redirect.
      if (cid) {
        try {
          await fetch(`/api/challenges/${cid}/claim`, { method: "PATCH" });
        } catch {
          // Non-fatal.
        }
      }

      // Fetch journey data.
      try {
        const res = await fetch("/api/journey");
        if (res.ok) {
          const data = await res.json();
          setChallenges(data.challenges ?? []);
          setStats(data.stats ?? { total: 0, active: 0, completed: 0, savedArtifacts: 0 });
          setSavedArtifacts(data.savedArtifacts ?? []);
        } else {
          setChallenges([]);
          setStats({ total: 0, active: 0, completed: 0, savedArtifacts: 0 });
        }
      } catch {
        setChallenges([]);
        setStats({ total: 0, active: 0, completed: 0, savedArtifacts: 0 });
      }

      setLoading(false);
    });
  }, [cid, router]);

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Journey Dashboard</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-10">
        My Challenge history with insights and artifacts vault
      </p>

      {stats && <JourneyInsights stats={stats} />}

      {/* Sub-navigation tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6" data-testid="journey-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("challenges")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "challenges"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
          data-testid="tab-challenges"
        >
       Challenges
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "vault"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
          data-testid="tab-vault"
        >
        Artifacts Vault
          {savedArtifacts.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
              {savedArtifacts.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "challenges" && challenges && (
        <>
          <ActiveChallenges challenges={challenges} />
          <ChallengeHistoryTable challenges={challenges} />
        </>
      )}
      {activeTab === "vault" && (
        <ArtifactVault artifacts={savedArtifacts} />
      )}
    </main>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <JourneyContent />
    </Suspense>
  );
}
