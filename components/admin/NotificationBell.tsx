"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { TranscriptJob, TranscriptJobStatus, AdminNotification } from "@/lib/db/types";

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
  type: "success" | "error" | "info";
  href?: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<TranscriptJob[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback(
    (message: string, type: "success" | "error" | "info", href?: string) => {
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchNotifications();
  }, [fetchJobs, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silently ignore
    }
  };

  // Supabase Realtime — transcript jobs
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

          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, addToast, fetchJobs]);

  // Supabase Realtime — admin_notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin_notifications_" + userId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        (payload) => {
          const newNotif = payload.new as AdminNotification;
          setNotifications((prev) => [newNotif, ...prev]);

          if (newNotif.type === "artifact_detected") {
            addToast(newNotif.title, "info", newNotif.link_url ?? undefined);
          } else if (newNotif.type === "news_proposal_generated") {
            addToast(newNotif.title, "info", newNotif.link_url ?? undefined);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, addToast]);

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

  const activeJobCount = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing"
  ).length;
  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;
  const totalBadge = activeJobCount + unreadNotifCount;

  const hasItems = jobs.length > 0 || notifications.length > 0;

  return (
    <>
      {/* Bell button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon />
          {totalBadge > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full px-0.5">
              {totalBadge}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Notifications
              </p>
              {unreadNotifCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {!hasItems ? (
              <div className="px-4 py-6 text-center text-xs text-zinc-400">
                No recent notifications
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
                {/* Admin notifications (newest first) */}
                {notifications.slice(0, 20).map((notif) => (
                  <li
                    key={notif.id}
                    className={`px-4 py-3 ${!notif.is_read ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {notif.link_url && (
                        <Link
                          href={notif.link_url}
                          className="shrink-0 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}

                {/* Transcript jobs */}
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
                : toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-indigo-600 text-white"
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
