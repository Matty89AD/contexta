"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminStats } from "@/repositories/admin";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Failed to load stats"));
  }, []);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Knowledge base overview
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Content stats */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
          Content
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            label="Total"
            value={stats?.content.total}
            className="col-span-1"
          />
          {(["draft", "pending_review", "active", "archived"] as const).map((s) => (
            <StatCard
              key={s}
              label={STATUS_LABELS[s]}
              value={stats?.content.by_status[s]}
            />
          ))}
        </div>
      </section>

      {/* Artifacts stats */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
          Artifacts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats?.artifacts.total} className="col-span-1" />
          {(["draft", "pending_review", "active", "archived"] as const).map((s) => (
            <StatCard
              key={s}
              label={STATUS_LABELS[s]}
              value={stats?.artifacts.by_status[s]}
            />
          ))}
        </div>
      </section>

      {/* News stats */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
          News Posts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total" value={stats?.news.total} />
          {(["draft", "published"] as const).map((s) => (
            <StatCard
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              value={stats?.news.by_status[s]}
            />
          ))}
        </div>
      </section>

      {/* Notifications */}
      {stats?.unread_notifications != null && stats.unread_notifications > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <span className="text-indigo-500 text-lg">🔔</span>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              {stats.unread_notifications} unread notification{stats.unread_notifications !== 1 ? "s" : ""} — check the bell icon above.
            </p>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
          Quick Actions
        </h2>
        <div className="flex gap-3">
          <Link
            href="/admin/content/new"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            + Add content
          </Link>
          <Link
            href="/admin/artifacts/new"
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors"
          >
            + New artifact
          </Link>
          <Link
            href="/admin/news/new"
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            + New news post
          </Link>
        </div>
      </section>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending",
  active: "Active",
  archived: "Archived",
};

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 ${className}`}
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {value ?? <span className="text-zinc-300 dark:text-zinc-700">—</span>}
      </p>
    </div>
  );
}
