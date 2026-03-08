"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CONTENT_SOURCE_TYPES } from "@/lib/db/types";
import type { ContentSourceType } from "@/lib/db/types";

export default function AdminContentNew() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<ContentSourceType>("podcast");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresTranscript = sourceType === "podcast" || sourceType === "video";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    if (requiresTranscript && !transcript.trim()) {
      setError("Transcript is required for podcast and video content");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          url: url.trim(),
          title: title.trim() || undefined,
          transcript_raw: transcript.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create content");
      router.push(`/admin/content/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create content");
      setSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add content</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Source type <span className="text-red-500">*</span>
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as ContentSourceType)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          >
            {CONTENT_SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
          />
          <p className="text-xs text-zinc-400 mt-1">
            Saved as provenance only — URL is not fetched automatically.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave blank to use URL as title"
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Transcript / full text
            {requiresTranscript && <span className="text-red-500"> *</span>}
            {!requiresTranscript && (
              <span className="text-zinc-400 font-normal"> (optional)</span>
            )}
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            placeholder="Paste the full transcript or text here…"
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 resize-y font-mono"
          />
          <p className="text-xs text-zinc-400 mt-1">
            Required for podcast and video. Content will be saved as a draft and can be processed later.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {submitting ? "Creating…" : "Create draft"}
          </button>
          <Link
            href="/admin/content"
            className="px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
