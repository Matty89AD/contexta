"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NewsPostFields } from "@/components/admin/NewsPostFields";
import type { NewsPost, NewsPostType, NewsPostStatus } from "@/lib/db/types";

export default function AdminNewsEdit() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [type, setType] = useState<NewsPostType>("podcast");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [postStatus, setPostStatus] = useState<NewsPostStatus>("draft");
  const [sortOrder, setSortOrder] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/news/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setPost(data);
      setType(data.type);
      setTitle(data.title);
      setDescription(data.description);
      setPublishedDate(data.published_date);
      setPostStatus(data.status);
      setSortOrder(String(data.sort_order ?? 0));
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
    if (!title.trim() || !description.trim() || !publishedDate.trim()) {
      setSaveError("Title, description, and display date are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
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
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/news");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      window.location.href = "/admin/news";
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!post) return null;

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
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {post.title}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <NewsPostFields
          type={type} setType={setType}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          publishedDate={publishedDate} setPublishedDate={setPublishedDate}
          postStatus={postStatus} setPostStatus={setPostStatus}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
        />

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
            {saving ? "Saving…" : "Save"}
          </button>

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
              className="px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
