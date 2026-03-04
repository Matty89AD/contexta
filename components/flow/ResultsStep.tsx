"use client";

import type { ChallengeResult } from "@/services/challenge";

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
  onBack,
}: {
  result: ChallengeResult;
  onBack?: () => void;
}) {
  const handleOpen = (contentId: string, title: string, url: string) => {
    logEvent("recommendation_opened", { content_id: contentId, title });
    logEvent("activation_completed", { content_id: contentId, action: "open" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
        >
          ← Edit challenge
        </button>
      )}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Your challenge
        </h2>
        <p className="mt-2 text-zinc-900 dark:text-zinc-100">{result.summary}</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
          Recommended content
        </h2>
        <ul className="space-y-4">
          {result.recommendations.map((rec) => (
            <li
              key={rec.contentId}
              className={`rounded-lg border p-4 ${
                rec.isMostRelevant
                  ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{rec.title}</p>
                  {rec.isMostRelevant && (
                    <span className="inline-block mt-1 text-xs font-medium text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded">
                      Most relevant
                    </span>
                  )}
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{rec.explanation}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {matchReasonLabel(rec.matchReason)}
                  </p>
                </div>
                <div className="shrink-0">
                  {rec.url ? (
                    <button
                      type="button"
                      onClick={() => handleOpen(rec.contentId, rec.title, rec.url!)}
                      className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      Open
                    </button>
                  ) : (
                    <span className="rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 px-4 py-2 text-sm font-medium cursor-not-allowed">
                      Open
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {result.recommendations.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">
            No matching content yet. Add more curated content to get
            recommendations.
          </p>
        )}
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Save your challenges and recommendations
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a free account to return to your results and track your
          progress over time.
        </p>
        <a
          href="/login"
          className="inline-block mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline hover:no-underline"
        >
          Create account →
        </a>
      </div>
    </div>
  );
}
