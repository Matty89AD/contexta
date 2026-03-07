"use client";

import { ListTodo, CheckCircle2, Bookmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { JourneyStats } from "@/services/journey";
import type { Challenge } from "@/lib/db/types";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

const statItems = [
  {
    key: "total" as const,
    label: "Total Challenges",
    border: "border-zinc-200 dark:border-zinc-700",
    value: (s: JourneyStats) => s.total,
    color: "text-zinc-900 dark:text-zinc-100",
    iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
    icon: <ListTodo className="w-4 h-4" />,
  },
  {
    key: "completed" as const,
    label: "Completed Challenges",
    border: "border-green-200 dark:border-green-800",
    value: (s: JourneyStats) => s.completed,
    color: "text-green-700 dark:text-green-300",
    iconBg: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    key: "savedArtifacts" as const,
    label: "Saved Artifacts",
    border: "border-violet-200 dark:border-violet-800",
    value: (s: JourneyStats) => s.savedArtifacts,
    color: "text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400",
    icon: <Bookmark className="w-4 h-4" />,
  },
];

export function JourneyInsights({
  stats,
  challenges,
}: {
  stats: JourneyStats;
  challenges: Challenge[];
}) {
  const active = challenges.filter(
    (c) => c.status === "open" || c.status === "in_progress"
  );

  return (
    <section className="mb-8 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
      {/* Compact stat column */}
      <div className="flex flex-row md:flex-col gap-3">
        {statItems.map((s) => (
          <div
            key={s.key}
            className={`flex-1 md:flex-initial bg-card rounded-xl border ${s.border} px-3 py-3 flex items-center gap-3`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.iconBg}`}
              aria-hidden
            >
              {s.icon}
            </div>
            <div>
              <p className={`text-xl font-bold leading-none ${s.color}`}>
                {s.value(stats)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active challenges sidebar */}
      <div className="bg-card rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 flex flex-col min-h-[120px]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
          Active Challenges
        </p>
        {active.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No active challenges yet.</p>
            <Link
              href="/flow"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Start a challenge →
            </Link>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-44 space-y-0.5">
            {active.map((c) => (
              <Link
                key={c.id}
                href={`/challenges/${c.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group"
              >
                <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {c.title ?? c.raw_description.slice(0, 70)}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${STATUS_COLORS[c.status] ?? STATUS_COLORS.open}`}
                >
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0 transition" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
