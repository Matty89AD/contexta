"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ContentWithChunkCount } from "@/repositories/admin";
import { CONTENT_STATUSES, CHALLENGE_DOMAINS } from "@/lib/db/types";
import type { ContentStatus, ChallengeDomain } from "@/lib/db/types";

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  active: "Active",
  archived: "Archived",
};

function parseTagInput(val: string): string[] {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function tagsToInput(arr: string[]): string {
  return arr.join(", ");
}

export default function AdminContentEdit() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [content, setContent] = useState<ContentWithChunkCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [domains, setDomains] = useState<ChallengeDomain[]>([]);
  const [topics, setTopics] = useState("");
  const [keywords, setKeywords] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setContent(data);
      setTitle(data.title ?? "");
      setUrl(data.url ?? "");
      setAuthor(data.author ?? "");
      setDomains(data.domains ?? []);
      setTopics(tagsToInput(data.topics ?? []));
      setKeywords(tagsToInput(data.keywords ?? []));
      setPublicationDate(data.publication_date ?? "");
      setStatus(data.status ?? "draft");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim() || null,
          author: author.trim() || null,
          domains,
          topics: parseTagInput(topics),
          keywords: parseTagInput(keywords),
          publication_date: publicationDate.trim() || null,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/content");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async () => {
    if (processing) return;
    const hasTranscript = content?.transcript_raw?.trim();
    if (!hasTranscript) {
      setProcessMsg("No transcript available. Add transcript text first.");
      return;
    }
    if (content?.status !== "draft") {
      const ok = window.confirm(
        `Content status is "${status}". Re-processing will replace all existing chunks. Continue?`
      );
      if (!ok) return;
    }
    setProcessing(true);
    setProcessMsg(null);
    try {
      const res = await fetch(`/api/admin/content/${id}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Processing failed");
      setProcessMsg(`Done — ${data.chunk_count} chunks created. Status advanced to pending_review.`);
      await load();
    } catch (e) {
      setProcessMsg(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      window.location.href = "/admin/content";
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleDomain = (d: ChallengeDomain) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!content) return null;

  const canDelete = content.status === "draft" || content.status === "archived";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/content"
          className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← Content
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {content.title}
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <InfoTile label="Source type" value={content.source_type} />
        <InfoTile label="Chunks" value={String(content.chunk_count)} />
        <InfoTile
          label="Confidence"
          value={
            content.extraction_confidence != null
              ? `${Math.round(content.extraction_confidence * 100)}%`
              : "—"
          }
        />
        <InfoTile
          label="Created"
          value={new Date(content.created_at).toLocaleDateString()}
        />
      </div>

      {/* Process now */}
      <div className="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Process now</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chunk transcript → generate embeddings → extract intelligence
            </p>
          </div>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {processing ? "Processing…" : "Process now"}
          </button>
        </div>
        {processMsg && (
          <p
            className={`text-xs mt-3 ${
              processMsg.startsWith("Done")
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {processMsg}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Domains
          </label>
          <div className="flex flex-wrap gap-2">
            {CHALLENGE_DOMAINS.map((d) => (
              <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={domains.includes(d)}
                  onChange={() => toggleDomain(d)}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{d}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Topics{" "}
            <span className="font-normal text-zinc-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="roadmapping, prioritization, discovery"
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Keywords{" "}
            <span className="font-normal text-zinc-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Publication date
          </label>
          <input
            type="text"
            value={publicationDate}
            onChange={(e) => setPublicationDate(e.target.value)}
            placeholder="e.g. 2024-03-15"
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentStatus)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          >
            {CONTENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {saveError && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
            {saveError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? "Saving…" : "Save metadata"}
          </button>

          {canDelete && (
            <>
              {deleteConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="text-sm text-zinc-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Delete
                </button>
              )}
            </>
          )}
          {!canDelete && (
            <p className="text-xs text-zinc-400">
              Cannot delete — change status to draft or archived first.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{value}</p>
    </div>
  );
}
