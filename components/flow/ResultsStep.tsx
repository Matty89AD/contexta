"use client";

import { ExternalLink, Target, BookOpen } from "lucide-react";
import type { ChallengeResult } from "@/services/challenge";
import type { ContextData } from "@/components/flow/ContextStep";
import { ROLE_LABELS, DOMAIN_LABELS } from "@/lib/constants";

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

function matchReasonLabel(reason: string): string {
  return reason === "structured_fit"
    ? "Matches your focus area"
    : "Semantically relevant";
}

export function ResultsStep({
  result,
  contextData,
  domains,
  onBack,
}: {
  result: ChallengeResult;
  contextData?: ContextData | null;
  domains?: string[];
  onBack?: () => void;
}) {
  const contentById = new Map(result.matches.map((m) => [m.content.id, m.content]));

  const handleOpen = (contentId: string, title: string, url: string) => {
    logEvent("recommendation_opened", { content_id: contentId, title });
    logEvent("activation_completed", { content_id: contentId, action: "open" });
    window.open(url, "_blank", "noopener,noreferrer");
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
          {/* Challenge Analysis card */}
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
              href="/login"
              className="block w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold text-center hover:bg-indigo-50 transition"
            >
              Create account →
            </a>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {result.recommendations.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">
              No matching content yet. Add more curated content to get recommendations.
            </p>
          ) : (
            result.recommendations.map((rec) => (
              <div
                key={rec.contentId}
                className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                {rec.isMostRelevant && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                )}

                {/* Top: tag + ExternalLink */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rec.isMostRelevant
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {rec.isMostRelevant ? "Most Relevant" : matchReasonLabel(rec.matchReason)}
                    </span>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {rec.title}
                    </h4>
                    {contentById.get(rec.contentId)?.author && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        by {contentById.get(rec.contentId)?.author}
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 transition-colors ml-4 shrink-0">
                    {rec.url ? (
                      <button
                        type="button"
                        onClick={() => handleOpen(rec.contentId, rec.title, rec.url!)}
                        aria-label="Open resource"
                      >
                        <ExternalLink size={18} className="text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </button>
                    ) : (
                      <ExternalLink size={18} className="text-zinc-300 dark:text-zinc-600 cursor-not-allowed" />
                    )}
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 leading-relaxed">{rec.explanation}</p>

                {/* Footer */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Target size={14} /> {matchReasonLabel(rec.matchReason)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
