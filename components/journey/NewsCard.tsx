"use client";

import { useEffect, useState } from "react";
import type { NewsPost, NewsPostType } from "@/lib/db/types";

const TYPE_LABELS: Record<NewsPostType, string> = {
  podcast: "Podcast",
  artifact: "Artifact",
  article: "Article",
};

const TYPE_STYLES: Record<NewsPostType, string> = {
  podcast: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  artifact: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  article: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
};

export function NewsCard() {
  const [posts, setPosts] = useState<NewsPost[]>([]);

  useEffect(() => {
    fetch("/api/journey/news")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
      })
      .catch(() => {
        // Silently ignore — empty state shown
      });
  }, []);

  if (posts.length === 0) return null;

  return (
    <aside className="lg:sticky lg:top-20 self-start">
      <div className="bg-card rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            What&apos;s New
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
            Knowledge base updates
          </p>
        </div>

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {posts.map((item) => (
            <li key={item.id} className="px-5 py-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${TYPE_STYLES[item.type]}`}
                >
                  {TYPE_LABELS[item.type]}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                  {item.published_date}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                {item.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
