"use client";

import { useState } from "react";
import Link from "next/link";
import type { Challenge, ChallengeStatus } from "@/lib/db/types";
import { DOMAIN_LABELS } from "@/lib/constants";

type FilterOption = ChallengeStatus | "all";

const STATUS_LABELS: Record<FilterOption, string> = {
  all: "All",
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
  abandoned: "Abandoned",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  abandoned: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition shrink-0"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function ChallengeHistoryTable({ challenges }: { challenges: Challenge[] }) {
  const [filter, setFilter] = useState<FilterOption>("all");

  if (challenges.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Challenge History
        </h2>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            You haven&apos;t saved any challenges yet.
          </p>
          <Link
            href="/flow"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
          >
            Start a Challenge
          </Link>
        </div>
      </section>
    );
  }

  const visible =
    filter === "all" ? challenges : challenges.filter((c) => c.status === filter);
  const filterOptions: FilterOption[] = ["all", "open", "in_progress", "completed", "archived", "abandoned"];

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Challenge History</h2>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === option
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        {visible.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">
              No challenges match this filter.
            </p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((c) => {
              const dateStr = new Date(c.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const domainStr = c.domains
                .slice(0, 2)
                .map((d) => DOMAIN_LABELS[d] ?? d)
                .join(" · ");
              const metaLine = domainStr ? `${domainStr} · ${dateStr}` : dateStr;
              return (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {c.title ?? c.summary ?? c.raw_description.slice(0, 80)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 sm:hidden">
                      {metaLine}
                    </p>
                    <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {c.summary ?? c.raw_description.slice(0, 60)}
                    </p>
                  </div>

                  {/* Domains */}
                  <div className="hidden sm:flex gap-1.5 flex-wrap shrink-0">
                    {c.domains.slice(0, 2).map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      >
                        {DOMAIN_LABELS[d] ?? d}
                      </span>
                    ))}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${STATUS_COLORS[c.status] ?? STATUS_COLORS.open}`}
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>

                  {/* Date */}
                  <span className="hidden sm:block text-xs text-zinc-400 shrink-0">
                    {dateStr}
                  </span>

                  <ChevronRight />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
