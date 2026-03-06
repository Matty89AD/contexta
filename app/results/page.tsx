"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { ChallengePhase1Result } from "@/services/challenge";
import type { ArtifactRecommendation } from "@/lib/db/types";
import type { ContextData } from "@/components/flow/ContextStep";
import { ROLE_LABELS, DOMAIN_LABELS } from "@/lib/constants";

interface SessionResults {
  phase1: ChallengePhase1Result;
  recommendations: ArtifactRecommendation[];
  context: ContextData | null;
  domains: string[];
}

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

function RecommendationCard({
  rec,
  onOpen,
}: {
  rec: ArtifactRecommendation;
  onOpen: (slug: string, title: string) => void;
}) {
  return (
    <div
      className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
      onClick={() => onOpen(rec.slug, rec.title)}
    >
      {rec.isMostRelevant && (
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
      )}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          {rec.isMostRelevant && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
              Most Relevant
            </span>
          )}
          {rec.domains.map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              {DOMAIN_LABELS[d] ?? d}
            </span>
          ))}
        </div>
      </div>
      <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {rec.title}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium">{rec.use_case}</p>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{rec.explanation}</p>
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cid = searchParams?.get("cid") ?? null;

  const [results, setResults] = useState<SessionResults | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!cid) {
      router.replace("/flow");
      return;
    }
    const raw = sessionStorage.getItem(`results:${cid}`);
    if (!raw) {
      router.replace("/flow");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SessionResults;
      sessionStorage.removeItem(`results:${cid}`);
      setResults(parsed);
    } catch {
      router.replace("/flow");
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [cid, router]);

  const handleOpen = (slug: string, title: string) => {
    if (!cid) return;
    logEvent("artifact_opened", { slug, title, challengeId: cid });
    router.push(`/artifacts/${slug}?cid=${cid}`);
  };

  const handleSave = async () => {
    if (!results || !cid) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/challenges/${cid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_saved: true,
          recommendations: results.recommendations,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setSaveError(data.error ?? "Failed to save");
        setSaving(false);
        return;
      }
      logEvent("challenge_saved", { challengeId: cid });
      router.push(`/challenges/${cid}`);
    } catch {
      setSaveError("Network error. Please try again.");
      setSaving(false);
    }
  };

  if (!results) return null;

  const { phase1, recommendations, context, domains } = results;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-3xl p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Your Recommended PM Artifacts
              </h2>
              {context?.role && (
                <p className="text-zinc-500 dark:text-zinc-400">
                  Based on your role as{" "}
                  <span className="text-indigo-600 font-medium">
                    {ROLE_LABELS[context.role] ?? context.role}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-1 space-y-4">
              {/* Challenge Summary */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                  Challenge Summary
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-4 italic">
                  &quot;{phase1.summary}&quot;
                </p>
                {domains.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {domains.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase"
                      >
                        {DOMAIN_LABELS[d] ?? d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save / auth CTA */}
              {user ? (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Save these results</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                    Save to your journey so you can revisit and rerun anytime.
                  </p>
                  {saveError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">{saveError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Challenge
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900">
                  <BookOpen className="mb-4" size={24} />
                  <h4 className="font-bold mb-2">Save your recommendations</h4>
                  <p className="text-indigo-100 text-sm mb-4">
                    Create a free account to return to your results and track progress over time.
                  </p>
                  <a
                    href={`/login?tab=signup&cid=${cid}`}
                    className="block w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold text-center hover:bg-indigo-50 transition"
                  >
                    Create account →
                  </a>
                </div>
              )}
            </div>

            {/* Right column — artifact cards */}
            <div className="lg:col-span-2 space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  No matching artifacts yet. Seed the artifacts table to get recommendations.
                </p>
              ) : (
                recommendations.map((rec) => (
                  <RecommendationCard key={rec.slug} rec={rec} onOpen={handleOpen} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <ResultsContent />
    </Suspense>
  );
}
