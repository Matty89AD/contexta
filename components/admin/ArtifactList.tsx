"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Artifact, ArtifactStatus, ChallengeDomain } from "@/lib/db/types";
import { ARTIFACT_STATUSES, CHALLENGE_DOMAINS } from "@/lib/db/types";

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  active: "Active",
  archived: "Archived",
};

const STATUS_COLORS: Record<ArtifactStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pending_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
};

export default function ArtifactList() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArtifactStatus | "all">("all");
  const [domainFilter, setDomainFilter] = useState<ChallengeDomain | "all">("all");
  const [aiOnly, setAiOnly] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (domainFilter !== "all") params.set("domain", domainFilter);
      if (aiOnly) params.set("is_ai_generated", "true");

      const res = await fetch(`/api/admin/artifacts?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setArtifacts(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, domainFilter, aiOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (id: string, newStatus: ArtifactStatus) => {
    try {
      const res = await fetch(`/api/admin/artifacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/artifacts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setDeleteConfirm(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const filtered = search.trim()
    ? artifacts.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      )
    : artifacts;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Artifacts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {total} total PM frameworks and methodologies
          </p>
        </div>
        <Link
          href="/admin/artifacts/new"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          + New artifact
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Status tabs */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {(["all", ...ARTIFACT_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Domain filter */}
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value as ChallengeDomain | "all")}
          className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">All domains</option>
          {CHALLENGE_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* AI only toggle */}
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={aiOnly}
            onChange={(e) => setAiOnly(e.target.checked)}
            className="accent-indigo-600"
          />
          AI detected only
        </label>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title…"
          className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 w-40"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">No artifacts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Domains</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Source</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {filtered.map((artifact) => (
                <tr key={artifact.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                        {artifact.title}
                      </span>
                      {artifact.possible_duplicate_of && (
                        <span
                          title={`Possible duplicate of: ${artifact.possible_duplicate_of}`}
                          className="text-yellow-500 cursor-help"
                        >
                          ⚠
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{artifact.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {artifact.domains.slice(0, 3).map((d) => (
                        <span
                          key={d}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={artifact.status}
                      onChange={(e) =>
                        handleStatusChange(artifact.id, e.target.value as ArtifactStatus)
                      }
                      className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer ${STATUS_COLORS[artifact.status]}`}
                    >
                      {ARTIFACT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {artifact.is_ai_generated ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                        AI detected
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-zinc-400">
                    {new Date(artifact.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/artifacts/${artifact.id}`}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Edit
                      </Link>
                      {artifact.status !== "active" && (
                        deleteConfirm === artifact.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(artifact.id)}
                              className="text-xs text-red-600 dark:text-red-400 font-semibold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-zinc-400"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(artifact.id)}
                            className="text-xs text-zinc-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
