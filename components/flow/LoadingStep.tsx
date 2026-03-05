"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing your challenge…",
  "Searching the knowledge base…",
  "Matching PM frameworks…",
  "Preparing your results…",
];

export function LoadingStep() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      {/* Spinner */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-100 dark:border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
      </div>

      {/* Message */}
      <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium transition-all duration-500">
        {MESSAGES[msgIdx]}
      </p>

      {/* Dot progress */}
      <div className="flex items-center gap-2">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === msgIdx
                ? "w-5 bg-indigo-600"
                : i < msgIdx
                ? "w-1.5 bg-indigo-300 dark:bg-indigo-700"
                : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
