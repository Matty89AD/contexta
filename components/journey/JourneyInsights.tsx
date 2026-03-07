"use client";

import {
  ListTodo,
  Clock,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { JourneyStats } from "@/services/journey";

export function JourneyInsights({ stats }: { stats: JourneyStats }) {
  const statCards = [
    {
      label: "Total Challenges",
      value: String(stats.total),
      variant: "neutral" as const,
      icon: <ListTodo className="w-5 h-5" />,
    },
    {
      label: "Active",
      value: String(stats.active),
      variant: "active" as const,
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: "Completed",
      value: String(stats.completed),
      variant: "completed" as const,
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      label: "Saved Artifacts",
      value: String(stats.savedArtifacts),
      variant: "artifacts" as const,
      icon: <Bookmark className="w-5 h-5" />,
    },
  ];

  const allZero =
    stats.total === 0 &&
    stats.active === 0 &&
    stats.completed === 0 &&
    stats.savedArtifacts === 0;

  return (
    <section className="mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            value={card.value}
            label={card.label}
            icon={card.icon}
            variant={card.variant}
          />
        ))}
      </div>
      {allZero && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center -mt-2">
          Start your first challenge to see insights here.
        </p>
      )}
    </section>
  );
}
