"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Artifact, ArtifactStatus, ChallengeDomain } from "@/lib/db/types";
import { ARTIFACT_STATUSES, CHALLENGE_DOMAINS } from "@/lib/db/types";

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  active: "Active",
  archived: "Archived",
};

interface HowToStep {
  step_title: string;
  step_detail: string;
}

interface ArtifactEditorProps {
  artifactId?: string; // undefined = new artifact
}

export default function ArtifactEditor({ artifactId }: ArtifactEditorProps) {
  const router = useRouter();
  const isNew = !artifactId;

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [sourceContentTitle, setSourceContentTitle] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [domains, setDomains] = useState<ChallengeDomain[]>([]);
  const [useCase, setUseCase] = useState("");
  const [description, setDescription] = useState("");
  const [howToIntro, setHowToIntro] = useState("");
  const [howToSteps, setHowToSteps] = useState<HowToStep[]>([{ step_title: "", step_detail: "" }]);
  const [status, setStatus] = useState<ArtifactStatus>("active");

  const load = useCallback(async () => {
    if (!artifactId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/artifacts/${artifactId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setArtifact(data);
      setTitle(data.title ?? "");
      setSlug(data.slug ?? "");
      setDomains(data.domains ?? []);
      setUseCase(data.use_case ?? "");
      setStatus(data.status ?? "active");

      const detail = (data.detail as Record<string, unknown> | null) ?? {};
      setDescription((detail.description as string) ?? "");
      setHowToIntro((detail.how_to_intro as string) ?? "");
      const steps = (detail.how_to_steps as HowToStep[]) ?? [];
      setHowToSteps(steps.length > 0 ? steps : [{ step_title: "", step_detail: "" }]);

      // Fetch source content title if available
      if (data.source_content_id) {
        try {
          const cr = await fetch(`/api/admin/content/${data.source_content_id}`);
          if (cr.ok) {
            const cd = await cr.json();
            setSourceContentTitle(cd.title ?? null);
          }
        } catch {
          // non-fatal
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [artifactId]);

  useEffect(() => { load(); }, [load]);

  // Auto-derive slug from title for new artifacts
  useEffect(() => {
    if (isNew && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      );
    }
  }, [isNew, title]);

  const toggleDomain = (d: ChallengeDomain) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const addStep = () =>
    setHowToSteps((prev) => [...prev, { step_title: "", step_detail: "" }]);

  const removeStep = (i: number) =>
    setHowToSteps((prev) => prev.filter((_, idx) => idx !== i));

  const updateStep = (i: number, field: keyof HowToStep, value: string) =>
    setHowToSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const detail = {
      description: description.trim(),
      how_to_intro: howToIntro.trim(),
      how_to_steps: howToSteps.filter((s) => s.step_title.trim()),
    };

    try {
      const url = isNew ? "/api/admin/artifacts" : `/api/admin/artifacts/${artifactId}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          domains,
          use_case: useCase.trim(),
          detail,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/artifacts");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!artifactId) return;
    try {
      const res = await fetch(`/api/admin/artifacts/${artifactId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.push("/admin/artifacts");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const canDelete = !isNew && artifact?.status !== "active";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/artifacts"
          className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← Artifacts
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {isNew ? "New artifact" : (artifact?.title ?? "Edit artifact")}
        </h1>
      </div>

      {/* Read-only info panel */}
      {!isNew && artifact && (
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Source:</span>
            {artifact.is_ai_generated ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                AI detected
              </span>
            ) : (
              <span className="text-xs text-zinc-500">Manual</span>
            )}
          </div>

          {artifact.source_content_id && sourceContentTitle && (
            <p className="text-xs text-zinc-500">
              Detected from:{" "}
              <Link
                href={`/admin/content/${artifact.source_content_id}`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {sourceContentTitle}
              </Link>
            </p>
          )}

          {artifact.possible_duplicate_of && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <span className="text-yellow-500">⚠</span>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Possible duplicate of{" "}
                <Link
                  href={`/admin/artifacts?q=${artifact.possible_duplicate_of}`}
                  className="underline font-medium"
                >
                  {artifact.possible_duplicate_of}
                </Link>{" "}
                — review before activating.
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono"
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
            Use case{" "}
            <span className="font-normal text-zinc-400">(1–2 sentences)</span>
          </label>
          <textarea
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            rows={2}
            required
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Description{" "}
            <span className="font-normal text-zinc-400">(3–5 sentences)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            How-to intro{" "}
            <span className="font-normal text-zinc-400">(1–2 sentences)</span>
          </label>
          <textarea
            value={howToIntro}
            onChange={(e) => setHowToIntro(e.target.value)}
            rows={2}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            How-to steps
          </label>
          <div className="space-y-3">
            {howToSteps.map((step, i) => (
              <div key={i} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Step {i + 1}</span>
                  {howToSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-xs text-zinc-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={step.step_title}
                  onChange={(e) => updateStep(i, "step_title", e.target.value)}
                  placeholder="Step title"
                  className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
                />
                <textarea
                  value={step.step_detail}
                  onChange={(e) => updateStep(i, "step_detail", e.target.value)}
                  rows={2}
                  placeholder="Step detail (1–2 sentences)"
                  className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add step
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArtifactStatus)}
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          >
            {ARTIFACT_STATUSES.map((s) => (
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
            {saving ? "Saving…" : "Save artifact"}
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
          {!isNew && !canDelete && (
            <p className="text-xs text-zinc-400">
              Cannot delete — archive it first.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
