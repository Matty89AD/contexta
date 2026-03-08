"use client";

import { useState } from "react";
import { detectUrlType } from "@/lib/url-utils";
import type { TranscriptJobUrlType } from "@/lib/db/types";
import RssEpisodePicker from "./RssEpisodePicker";

interface Props {
  onClose: () => void;
  onJobStarted: (jobId: string) => void;
}

const URL_TYPE_LABELS: Record<TranscriptJobUrlType, string> = {
  youtube: "YouTube video",
  podcast_rss: "Podcast RSS feed",
  podcast_episode: "Podcast episode (audio)",
  webpage: "Web page / article",
};

const PROCESSING_TIME: Record<TranscriptJobUrlType, string> = {
  youtube: "~30 seconds",
  podcast_rss: "~2–5 minutes",
  podcast_episode: "~2–5 minutes",
  webpage: "~10 seconds",
};

type Step = "url" | "rss_picker" | "confirm";

export default function AddFromUrlModal({ onClose, onJobStarted }: Props) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("url");
  const [detectedType, setDetectedType] = useState<TranscriptJobUrlType>("webpage");
  // resolvedUrl: after RSS picker, this is the episode audio URL
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [resolvedType, setResolvedType] = useState<TranscriptJobUrlType>("webpage");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError("Please enter a valid URL");
      return;
    }
    const detected = detectUrlType(trimmed);
    setDetectedType(detected);
    if (detected === "podcast_rss") {
      setStep("rss_picker");
    } else {
      setResolvedUrl(trimmed);
      setResolvedType(detected);
      setStep("confirm");
    }
  };

  const handleEpisodeSelected = (audioUrl: string) => {
    setResolvedUrl(audioUrl);
    setResolvedType("podcast_episode");
    setStep("confirm");
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/transcript-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: resolvedUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start job");
      onJobStarted(data.jobId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Add from URL
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {step === "url" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                placeholder="https://www.youtube.com/watch?v=... or podcast RSS feed..."
                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "rss_picker" && (
          <RssEpisodePicker
            feedUrl={url.trim()}
            onSelect={handleEpisodeSelected}
            onBack={() => setStep("url")}
          />
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Detected type
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  {URL_TYPE_LABELS[resolvedType] ??
                    URL_TYPE_LABELS[detectedType]}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 break-all">
                {resolvedUrl}
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">⏱</span>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Transcript generation may take several minutes for long audio.
                Estimated time:{" "}
                <strong>
                  {PROCESSING_TIME[resolvedType] ?? PROCESSING_TIME[detectedType]}
                </strong>
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setStep(detectedType === "podcast_rss" ? "rss_picker" : "url")
                }
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {submitting ? "Starting…" : "Generate Transcript"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
