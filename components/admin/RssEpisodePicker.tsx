"use client";

import { useEffect, useState } from "react";

interface RssEpisode {
  title: string;
  description: string | null;
  pubDate: string | null;
  audioUrl: string | null;
  duration: string | null;
}

interface Props {
  feedUrl: string;
  onSelect: (audioUrl: string) => void;
  onBack: () => void;
}

export default function RssEpisodePicker({ feedUrl, onSelect, onBack }: Props) {
  const [episodes, setEpisodes] = useState<RssEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/rss-feed?url=${encodeURIComponent(feedUrl)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to parse feed");
        setEpisodes(data.episodes ?? []);
        if ((data.episodes ?? []).length === 0) {
          setError("No episodes found in this feed");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [feedUrl]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Select an episode to transcribe:
      </p>

      {loading && (
        <div className="text-center py-8 text-zinc-400 text-sm">Loading feed…</div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && episodes.length > 0 && (
        <div className="max-h-80 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
          {episodes.map((ep, i) => (
            <label
              key={i}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                selected === ep.audioUrl ? "bg-indigo-50 dark:bg-indigo-950/30" : ""
              }`}
            >
              <input
                type="radio"
                name="episode"
                value={ep.audioUrl ?? ""}
                checked={selected === ep.audioUrl}
                onChange={() => ep.audioUrl && setSelected(ep.audioUrl)}
                disabled={!ep.audioUrl}
                className="mt-1 accent-indigo-600 shrink-0"
              />
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    ep.audioUrl
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {ep.title}
                  {!ep.audioUrl && (
                    <span className="ml-1.5 text-xs font-normal text-zinc-400">
                      (no audio)
                    </span>
                  )}
                </p>
                <div className="flex gap-3 mt-0.5">
                  {ep.pubDate && (
                    <span className="text-xs text-zinc-400">
                      {new Date(ep.pubDate).toLocaleDateString()}
                    </span>
                  )}
                  {ep.duration && (
                    <span className="text-xs text-zinc-400">{ep.duration}</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Back
        </button>
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
