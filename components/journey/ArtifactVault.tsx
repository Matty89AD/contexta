"use client";

import Link from "next/link";
import type { SavedArtifact } from "@/lib/db/types";
import { DOMAIN_LABELS } from "@/lib/constants";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return formatDate(iso);
}

export function ArtifactVault({ artifacts }: { artifacts: SavedArtifact[] }) {
  if (artifacts.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-10 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          No artifacts saved yet. Start a challenge to find artifacts, then add them to your vault.
        </p>
        <Link
          href="/flow"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
        >
          Start a challenge to find artifacts
        </Link>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      data-testid="artifact-vault-grid"
    >
      {artifacts.map((artifact) => (
        <Link
          key={artifact.slug}
          href={`/artifacts/${artifact.slug}`}
          className="block bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          data-testid={`vault-card-${artifact.slug}`}
        >
          <div className="flex flex-wrap gap-1.5 mb-2">
            {artifact.domains.map((d) => (
              <span
                key={d}
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              >
                {DOMAIN_LABELS[d] ?? d}
              </span>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {artifact.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
            {artifact.use_case}
          </p>
          <p
            className="text-[10px] text-zinc-400"
            title={formatDate(artifact.saved_at)}
          >
            Saved {relativeTime(artifact.saved_at)}
          </p>
        </Link>
      ))}
    </div>
  );
}
