"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function JourneyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cid = searchParams?.get("cid") ?? null;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login?next=/journey");
        return;
      }
      // Auto-claim challenge arriving from Google OAuth redirect.
      if (cid) {
        try {
          await fetch(`/api/challenges/${cid}/claim`, { method: "PATCH" });
        } catch {
          // Non-fatal.
        }
      }
    });
  }, [cid, router]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Your Journey
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400">
        Your saved challenges and recommendations will appear here.
      </p>
    </main>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <JourneyContent />
    </Suspense>
  );
}
