"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NewsPostFields } from "@/components/admin/NewsPostFields";
import type { NewsPostType, NewsPostStatus } from "@/lib/db/types";

export default function AdminNewsNew() {
  const router = useRouter();
  const [type, setType] = useState<NewsPostType>("podcast");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [postStatus, setPostStatus] = useState<NewsPostStatus>("draft");
  const [sortOrder, setSortOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !publishedDate.trim()) {
      setError("Title, description, and display date are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          published_date: publishedDate.trim(),
          status: postStatus,
          sort_order: Number(sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create post");
      router.push(`/admin/news/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/news"
          className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← News Posts
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">New post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <NewsPostFields
          type={type} setType={setType}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          publishedDate={publishedDate} setPublishedDate={setPublishedDate}
          postStatus={postStatus} setPostStatus={setPostStatus}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
        />

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
            {submitting ? "Creating…" : "Create post"}
          </button>
          <Link
            href="/admin/news"
            className="px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

