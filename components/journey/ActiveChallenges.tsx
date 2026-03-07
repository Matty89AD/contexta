"use client";

import Link from "next/link";
import type { Challenge } from "@/lib/db/types";
import { DOMAIN_LABELS } from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
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

export function ActiveChallenges({ challenges }: { challenges: Challenge[] }) {
  const active = challenges.filter(
    (c) => c.status === "open" || c.status === "in_progress"
  );

  if (active.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Active Challenges
        </h2>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            No active challenges yet.
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

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Active Challenges
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {c.domains.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                >
                  {DOMAIN_LABELS[d] ?? d}
                </span>
              ))}
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[c.status] ?? STATUS_COLORS.open}`}
              >
                {STATUS_LABELS[c.status] ?? c.status}
              </span>
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                {c.title ?? c.summary ?? c.raw_description.slice(0, 100)}
              </p>
            </div>

            <Link
              href={`/challenges/${c.id}`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
            >
              {c.status === "in_progress" ? "Continue" : "View"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
