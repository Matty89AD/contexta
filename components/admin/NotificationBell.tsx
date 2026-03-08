"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { TranscriptJob, TranscriptJobStatus } from "@/lib/db/types";

const STATUS_LABELS: Record<TranscriptJobStatus, string> = {
  pending: "Queued",
  processing: "Processing…",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_COLORS: Record<TranscriptJobStatus, string> = {
  pending: "text-zinc-400",
  processing: "text-yellow-500",
  completed: "text-green-500",
  failed: "text-red-500",
};

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
  href?: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<TranscriptJob[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback(
    (message: string, type: "success" | "error", href?: string) => {
      const id = ++toastCounter.current;
      setToasts((prev) => [...prev, { id, message, type, href }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    []
  );

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/transcript-jobs");
      if (!res.ok) return;
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("transcript_jobs_" + userId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transcript_jobs",
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as TranscriptJob;
          setJobs((prev) =>
            prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
          );

          if (updated.status === "completed" && updated.content_id) {
            addToast(
              `Transcript ready`,
              "success",
              `/admin/content/${updated.content_id}`
            );
          } else if (updated.status === "failed") {
            const short = updated.url.replace(/^https?:\/\//, "").slice(0, 40);
            addToast(`Transcript failed for ${short}`, "error");
          }

          // Refresh full list
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, addToast, fetchJobs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const activeCount = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing"
  ).length;

  return (
    <>
      {/* Bell button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Transcript job notifications"
        >
          <BellIcon />
          {activeCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full px-0.5">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Transcript Jobs
              </p>
            </div>
            {jobs.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-zinc-400">
                No recent jobs
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
                {jobs.map((job) => (
                  <li key={job.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 break-all line-clamp-1">
                          {job.url.replace(/^https?:\/\//, "")}
                        </p>
                        <p
                          className={`text-xs font-medium mt-0.5 ${STATUS_COLORS[job.status]}`}
                        >
                          {STATUS_LABELS[job.status]}
                          {job.status === "failed" && job.error_message && (
                            <span className="text-zinc-400 font-normal">
                              {" "}
                              — {job.error_message.slice(0, 60)}
                            </span>
                          )}
                        </p>
                      </div>
                      {job.status === "completed" && job.content_id && (
                        <Link
                          href={`/admin/content/${job.content_id}`}
                          className="shrink-0 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span>{toast.message}</span>
            {toast.href && (
              <Link
                href={toast.href}
                className="underline opacity-90 hover:opacity-100"
              >
                View
              </Link>
            )}
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="opacity-70 hover:opacity-100 ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
