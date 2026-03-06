"use client";

import type { JourneyStats } from "@/services/journey";

const CONTENT_TYPE_DATA = [
  { label: "Podcast", pct: 60 },
  { label: "Book", pct: 20 },
  { label: "Article", pct: 15 },
  { label: "Video", pct: 5 },
];

const THOUGHT_LEADERS = ["Marty Cagan", "Lenny Rachitsky", "Teresa Torres"];

export function JourneyInsights({ stats }: { stats: JourneyStats }) {
  const statCards = [
    { label: "Total Challenges", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Completed", value: stats.completed },
    { label: "Saved Artifacts", value: 0 },
  ];

  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Journey Insights</h2>
        <span className="text-xs text-zinc-400">Real data coming soon</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Content Type Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Content Type Distribution
          </p>
          <div className="space-y-3">
            {CONTENT_TYPE_DATA.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>{item.label}</span>
                  <span>{item.pct}%</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-3 italic">
            Illustrative data — real aggregation coming soon.
          </p>
        </div>

        {/* Top Thought Leaders */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Top Thought Leaders
          </p>
          <div className="flex flex-col gap-3">
            {THOUGHT_LEADERS.map((name, i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-3 italic">
            Illustrative data — real aggregation coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}
