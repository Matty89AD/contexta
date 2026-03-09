"use client";

import { useEffect, useCallback } from "react";
import { X, ExternalLink } from "lucide-react";
import type { KnowledgeCard } from "@/services/artifact-detail";
import type { ContentView } from "@/lib/db/types";
import { SOURCE_TYPE_LABELS, DOMAIN_LABELS } from "@/lib/constants";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function estimateReadTime(wordCount: number | null, sourceType: string): string | null {
  if (!wordCount) return null;
  const wpm = sourceType === "video" || sourceType === "podcast" ? 130 : 200;
  const minutes = Math.ceil(wordCount / wpm);
  const label = sourceType === "video" || sourceType === "podcast" ? "listen" : "read";
  return `~${minutes} min ${label}`;
}

interface ContentOverlayProps {
  card: KnowledgeCard;
  view: ContentView | null;
  onClose: () => void;
}

export function ContentOverlay({ card, view, onClose }: ContentOverlayProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const readTime = estimateReadTime(card.word_count, card.source_type);
  const pubDate = formatDate(card.publication_date);
  const firstSeen = view ? formatDate(view.first_viewed_at) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      data-testid="content-overlay"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 inline-block mb-2">
                {SOURCE_TYPE_LABELS[card.source_type] ?? card.source_type}
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {card.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {card.author && <span>{card.author}</span>}
                {card.author && pubDate && <span>·</span>}
                {pubDate && <span>{pubDate}</span>}
                {readTime && (
                  <>
                    <span>·</span>
                    <span>{readTime}</span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Close"
              data-testid="overlay-close-button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Summary
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {card.summary ?? "No summary available."}
            </p>
          </div>

          {/* Topics */}
          {card.topics.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Topics
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {card.topics.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {card.keywords.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {card.keywords.map((k) => (
                  <span
                    key={k}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Domains */}
          {card.domains.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Domains
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {card.domains.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                  >
                    {DOMAIN_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          {firstSeen && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500" data-testid="view-status-line">
              First seen {firstSeen}
              {view && view.view_count > 1 && (
                <span>
                  {" "}
                  · Viewed {view.view_count} {view.view_count === 1 ? "time" : "times"}
                </span>
              )}
            </p>
          )}
          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
              data-testid="overlay-open-link"
            >
              <ExternalLink size={14} />
              Open {SOURCE_TYPE_LABELS[card.source_type] ?? card.source_type}
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="No link available"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-sm font-medium cursor-not-allowed"
            >
              <ExternalLink size={14} />
              Open {SOURCE_TYPE_LABELS[card.source_type] ?? card.source_type}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
