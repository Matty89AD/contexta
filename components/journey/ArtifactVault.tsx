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

export function ArtifactVault({ artifacts }: { artifacts: SavedArtifact[] }) {
  if (artifacts.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-10 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          No artifacts saved yet. Open any artifact and tap &ldquo;Add to Artifact Vault&rdquo;.
        </p>
        <Link
          href="/flow"
          className="inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Find artifacts &rarr;
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
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
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
          <p className="text-[10px] text-zinc-400">Saved {formatDate(artifact.saved_at)}</p>
        </Link>
      ))}
    </div>
  );
}
