"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Pencil, Check, X } from "lucide-react";
import type { Challenge } from "@/lib/db/types";
import type { ArtifactRecommendation } from "@/lib/db/types";
import { DOMAIN_LABELS, ROLE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

function RecommendationCard({
  rec,
  onOpen,
}: {
  rec: ArtifactRecommendation;
  onOpen: (slug: string, title: string) => void;
}) {
  return (
    <div
      className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
      onClick={() => onOpen(rec.slug, rec.title)}
    >
      {rec.isMostRelevant && (
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
      )}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          {rec.isMostRelevant && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
              Most Relevant
            </span>
          )}
          {rec.domains.map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              {DOMAIN_LABELS[d] ?? d}
            </span>
          ))}
        </div>
      </div>
      <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {rec.title}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium">{rec.use_case}</p>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{rec.explanation}</p>
    </div>
  );
}

function InlineTitle({
  initial,
  challengeId,
}: {
  initial: string;
  challengeId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initial) {
      setValue(initial);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancel = () => {
    setValue(initial);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-indigo-500 outline-none flex-1"
          maxLength={120}
          disabled={saving}
        />
        <button
          type="button"
          onClick={commit}
          disabled={saving}
          className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          aria-label="Save title"
        >
          <Check size={18} />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="text-zinc-400 hover:text-zinc-600"
          aria-label="Cancel"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-2 group/title">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</h2>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover/title:opacity-100 text-zinc-400 hover:text-zinc-600 transition"
        aria-label="Rename"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}

function ChallengePageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace(`/login?next=/challenges/${id}`);
        return;
      }
      const res = await fetch(`/api/challenges/${id}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json() as Challenge;
      setChallenge(data);
      setLoading(false);
    });
  }, [id, router]);

  const handleOpen = (slug: string, title: string) => {
    logEvent("artifact_opened", { slug, title, challengeId: id, source: "saved_challenge" });
    router.push(`/artifacts/${slug}?cid=${id}`);
  };

  const handleRerun = () => {
    logEvent("challenge_rerun", { challengeId: id });
    router.push(`/flow?rerun=${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-1 h-48 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !challenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Challenge not found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          This challenge may have been deleted or doesn&apos;t belong to your account.
        </p>
        <a href="/journey" className="text-indigo-600 hover:underline font-medium">
          Back to Your Journey
        </a>
      </div>
    );
  }

  const recommendations = challenge.recommendations ?? [];
  const domains = challenge.domains ?? [];
  const title = challenge.title ?? challenge.raw_description.slice(0, 72);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <a href="/journey" className="text-sm text-zinc-400 hover:text-indigo-600 transition mb-6 inline-block">
        ← Your Journey
      </a>

      {/* Title + rerun */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex-1 min-w-0">
          <InlineTitle initial={title} challengeId={id} />
          <p className="text-xs text-zinc-400">
            Saved {challenge.saved_at
              ? new Date(challenge.saved_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRerun}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 transition shrink-0"
        >
          <RefreshCw size={14} />
          Rerun
        </button>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Challenge Summary
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-4 italic">
              &quot;{challenge.summary ?? challenge.raw_description}&quot;
            </p>
            {domains.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <span
                    key={d}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase"
                  >
                    {DOMAIN_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {recommendations.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">No recommendations stored for this challenge.</p>
          ) : (
            recommendations.map((rec) => (
              <RecommendationCard key={rec.slug} rec={rec} onOpen={handleOpen} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <ChallengePageContent />
    </Suspense>
  );
}
