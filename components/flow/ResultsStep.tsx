"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { ChallengePhase1Result } from "@/services/challenge";
import type { ArtifactRecommendation } from "@/lib/db/types";
import type { ContextData } from "@/components/flow/ContextStep";
import { ROLE_LABELS, DOMAIN_LABELS } from "@/lib/constants";

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

function RecommendationSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
            <div className="h-6 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 pt-2">
        Matching frameworks to your challenge…
      </p>
    </div>
  );
}

export function ResultsStep({
  result,
  recommendations,
  contextData,
  domains,
  onBack,
}: {
  result: ChallengePhase1Result;
  /** null = loading; empty array = no matches */
  recommendations: ArtifactRecommendation[] | null;
  contextData?: ContextData | null;
  domains?: string[];
  onBack?: () => void;
}) {
  const router = useRouter();

  const handleOpen = (slug: string, title: string) => {
    logEvent("artifact_opened", { slug, title });
    router.push(`/artifacts/${slug}?cid=${result.challengeId}`);
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Your Recommended PM Artifacts</h2>
          {contextData?.role && (
            <p className="text-zinc-500 dark:text-zinc-400">
              Based on your role as{" "}
              <span className="text-indigo-600 font-medium">{ROLE_LABELS[contextData.role] ?? contextData.role}</span>
            </p>
          )}
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Edit challenge
          </button>
        )}
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Challenge Summary card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Challenge Summary</h3>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-4 italic">&quot;{result.summary}&quot;</p>
            {domains && domains.length > 0 && (
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

          {/* Create account card */}
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900">
            <BookOpen className="mb-4" size={24} />
            <h4 className="font-bold mb-2">Save your recommendations</h4>
            <p className="text-indigo-100 text-sm mb-4">Create a free account to return to your results and track progress over time.</p>
            <a
              href={`/login?tab=signup&cid=${result.challengeId}`}
              className="block w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold text-center hover:bg-indigo-50 transition"
            >
              Create account →
            </a>
          </div>
        </div>

        {/* Right column — artifact cards or skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {recommendations === null ? (
            <RecommendationSkeleton />
          ) : recommendations.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No matching artifacts yet. Seed the artifacts table to get recommendations.
            </p>
          ) : (
            recommendations.map((rec) => (
              <div
                key={rec.slug}
                className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                onClick={() => handleOpen(rec.slug, rec.title)}
              >
                {rec.isMostRelevant && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                )}

                {/* Top: badge row */}
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

                {/* Title */}
                <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {rec.title}
                </h4>

                {/* Use-case */}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium">
                  {rec.use_case}
                </p>

                {/* Explanation */}
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  {rec.explanation}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
