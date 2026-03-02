"use client";

import type { ChallengeResult } from "@/services/challenge";

export function ResultsStep({ result }: { result: ChallengeResult }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
          Your challenge
        </h2>
        <p className="mt-2 text-zinc-900">{result.summary}</p>
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
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{rec.title}</p>
                  {rec.isMostRelevant && (
                    <span className="inline-block mt-1 text-xs font-medium text-zinc-600 bg-zinc-200 px-2 py-0.5 rounded">
                      Most relevant
                    </span>
                  )}
                  <p className="mt-2 text-sm text-zinc-600">{rec.explanation}</p>
                </div>
                <div className="shrink-0">
                  {rec.url ? (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="rounded-lg bg-zinc-200 text-zinc-500 px-4 py-2 text-sm font-medium cursor-not-allowed">
                      Open
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {result.recommendations.length === 0 && (
          <p className="text-zinc-500">
            No matching content yet. Add more curated content to get
            recommendations.
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-200">
        <p className="text-sm text-zinc-600">
          Sign up to save your challenges and recommendations and return to them
          later.
        </p>
        <a
          href="/login"
          className="inline-block mt-2 text-sm font-medium text-zinc-900 underline hover:no-underline"
        >
          Create account
        </a>
      </div>
    </div>
  );
}
