"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Content, ContentStatus, ContentSourceType, ChallengeDomain } from "@/lib/db/types";
import { CONTENT_STATUSES, CONTENT_SOURCE_TYPES, CHALLENGE_DOMAINS } from "@/lib/db/types";

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  pending_review: "Pending",
  active: "Active",
  archived: "Archived",
};

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pending_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminContentList() {
  const [items, setItems] = useState<Content[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<ContentSourceType | "">("");
  const [domainFilter, setDomainFilter] = useState<ChallengeDomain | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source_type", sourceFilter);
    if (domainFilter) params.set("domain", domainFilter);
    try {
      const res = await fetch(`/api/admin/content?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, domainFilter, page]);

  const handleStatusChange = async (id: string, newStatus: ContentStatus) => {
    try {
      await fetch(`/api/admin/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchContent();
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setDeleteConfirm(null);
      await fetchContent();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  // Client-side title search
  const displayed = q
    ? items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Content</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {total} items total
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          + Add content
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          {(["", ...CONTENT_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s as ContentStatus | ""); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {s ? STATUS_LABELS[s as ContentStatus] : "All"}
            </button>
          ))}
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value as ContentSourceType | ""); setPage(1); }}
          className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        >
          <option value="">All source types</option>
          {CONTENT_SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={domainFilter}
          onChange={(e) => { setDomainFilter(e.target.value as ChallengeDomain | ""); setPage(1); }}
          className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        >
          <option value="">All domains</option>
          {CHALLENGE_DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Search titles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 w-48"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">No content found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Source</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Domain</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {displayed.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                      {item.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-zinc-500 dark:text-zinc-400">
                    {item.source_type}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-500 dark:text-zinc-400">
                    {item.domains[0] ?? item.primary_domain ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value as ContentStatus)
                      }
                      className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer ${STATUS_COLORS[item.status]}`}
                    >
                      {CONTENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-400 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/content/${item.id}`}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Edit
                      </Link>
                      {(item.status === "draft" || item.status === "archived") && (
                        <>
                          {deleteConfirm === item.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(item.id)}
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
                              onClick={() => setDeleteConfirm(item.id)}
                              className="text-xs text-zinc-400 hover:text-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-zinc-400">
            Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 50 >= total}
              className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
