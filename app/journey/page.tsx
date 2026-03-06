"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JourneyInsights } from "@/components/journey/JourneyInsights";
import { ActiveChallenges } from "@/components/journey/ActiveChallenges";
import { ChallengeHistoryTable } from "@/components/journey/ChallengeHistoryTable";
import type { Challenge } from "@/lib/db/types";
import type { JourneyStats } from "@/services/journey";

function LoadingSkeleton() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Your Journey</h1>
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

function JourneyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cid = searchParams?.get("cid") ?? null;

  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [loading, setLoading] = useState(true);

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
          setStats(data.stats ?? { total: 0, active: 0, completed: 0 });
        } else {
          setChallenges([]);
          setStats({ total: 0, active: 0, completed: 0 });
        }
      } catch {
        setChallenges([]);
        setStats({ total: 0, active: 0, completed: 0 });
      }

      setLoading(false);
    });
  }, [cid, router]);

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Your Journey</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-10">
        Your challenge history, insights, and recommended frameworks.
      </p>

      {stats && <JourneyInsights stats={stats} />}
      {challenges && <ActiveChallenges challenges={challenges} />}
      {challenges && <ChallengeHistoryTable challenges={challenges} />}
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
