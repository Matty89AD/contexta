"use client";

import type { JourneyStats } from "@/services/journey";

export function JourneyInsights({ stats }: { stats: JourneyStats }) {
  const statCards = [
    { label: "Total Challenges", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Completed", value: stats.completed },
    { label: "Saved Artifacts", value: stats.savedArtifacts },
  ];

  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Key Insights</h3>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4"
          >
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

    </section>
  );
}
