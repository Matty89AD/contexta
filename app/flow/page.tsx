"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ContextStep } from "@/components/flow/ContextStep";
import { ChallengeStep } from "@/components/flow/ChallengeStep";
import { LoadingStep } from "@/components/flow/LoadingStep";
import { ResultsStep } from "@/components/flow/ResultsStep";
import type { ContextData } from "@/components/flow/ContextStep";
import type { ChallengePhase1Result } from "@/services/challenge";
import type { ArtifactRecommendation } from "@/lib/db/types";
import { FLOW_CONTEXT_STORAGE_KEY } from "@/lib/constants";

type Step = "context" | "challenge" | "loading" | "results";

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "context" as const, label: "Context" },
    { key: "challenge" as const, label: "Challenge" },
    { key: "results" as const, label: "Recommendations" },
  ];
  // During loading we're transitioning to results — show results as current
  const indicatorStep = step === "loading" ? "results" : step;
  const currentIndex = steps.findIndex((s) => s.key === indicatorStep);

  return (
    <div className="max-w-xl mx-auto mb-12">
      <div className="relative flex items-start justify-between">
        {/* Connecting line background */}
        <div className="absolute top-5 left-0 right-0 h-px bg-zinc-100 dark:bg-zinc-700" />
        {/* Connecting line fill */}
        <div
          className="absolute top-5 left-0 h-px bg-indigo-600 transition-all duration-500"
          style={{ width: currentIndex === 0 ? "0%" : currentIndex === 1 ? "50%" : "100%" }}
        />
        {steps.map((s, i) => {
          const completed = i < currentIndex;
          const current = i === currentIndex;
          return (
            <div key={s.key} className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
                  completed
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : current
                    ? "bg-white dark:bg-zinc-900 border-indigo-600 text-indigo-600"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {completed ? <CheckCircle2 size={20} /> : <span className="text-sm font-semibold">{i + 1}</span>}
              </div>
              <span className="text-xs mt-2 font-medium text-zinc-500 dark:text-zinc-400 text-center whitespace-nowrap">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlowContent() {
  const searchParams = useSearchParams();
  const prefillDescription = searchParams?.get("description") ?? "";
  const prefillDomains =
    searchParams
      ?.get("domains")
      ?.split(",")
      .filter(Boolean) ?? [];

  const [step, setStep] = useState<Step>("context");
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [initialContextFromStorage, setInitialContextFromStorage] =
    useState<ContextData | null>(null);
  const [phase1, setPhase1] = useState<ChallengePhase1Result | null>(null);
  const [recommendations, setRecommendations] = useState<ArtifactRecommendation[] | null>(null);
  const [submittedDomains, setSubmittedDomains] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLOW_CONTEXT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (
          parsed &&
          typeof parsed === "object" &&
          "role" in parsed &&
          "company_stage" in parsed &&
          "team_size" in parsed &&
          "experience_level" in parsed
        ) {
          const ctx = parsed as ContextData;
          setInitialContextFromStorage(ctx);
          if (prefillDescription) {
            setContextData(ctx);
            setStep("challenge");
          }
        }
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === "context") logEvent("context_step_started");
  }, [step]);

  const onContextComplete = useCallback((data: ContextData) => {
    try {
      localStorage.setItem(FLOW_CONTEXT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    logEvent("context_completed", {
      role: data.role,
      company_stage: data.company_stage,
      team_size: data.team_size,
      experience_level: data.experience_level,
    });
    logEvent("challenge_input_transition");
    setContextData(data);
    setStep("challenge");
  }, []);

  const onSubmitChallenge = useCallback(
    async (body: { raw_description: string; domains: string[] }) => {
      setError(null);
      setSubmittedDomains(body.domains);
      setPhase1(null);
      setRecommendations(null);
      setStep("loading");

      // Phase 1 — summary
      let p1: ChallengePhase1Result;
      try {
        const res = await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, context: contextData ?? undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          setStep("challenge");
          return;
        }
        p1 = data as ChallengePhase1Result;
      } catch {
        setError("Network error. Please try again.");
        setStep("challenge");
        return;
      }

      // Show results page immediately with summary; recommendations load next
      setPhase1(p1);
      setRecommendations(null); // skeleton state
      setStep("results");

      // Phase 2 — recommendations (fire and update)
      try {
        const res = await fetch(`/api/challenges/${p1.challengeId}/recommendations`, {
          method: "POST",
        });
        const data = await res.json();
        setRecommendations(data.recommendations ?? []);
      } catch {
        setRecommendations([]); // empty on error — don't crash the page
      }
    },
    [contextData]
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator step={step} />

        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-3xl p-4 md:p-8 min-h-[600px]">
          {step === "context" && (
            <ContextStep
              key={initialContextFromStorage ? "restored" : "new"}
              initialData={initialContextFromStorage}
              onComplete={onContextComplete}
            />
          )}

          {step === "challenge" && (
            <ChallengeStep
              contextData={contextData}
              onSubmit={onSubmitChallenge}
              loading={false}
              error={error}
              onBack={() => setStep("context")}
              initialDescription={prefillDescription || undefined}
              initialDomains={prefillDomains.length > 0 ? prefillDomains : undefined}
            />
          )}

          {step === "loading" && <LoadingStep />}

          {step === "results" && phase1 && (
            <ResultsStep
              result={phase1}
              recommendations={recommendations}
              contextData={contextData}
              domains={submittedDomains}
              onBack={() => setStep("challenge")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function FlowPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <FlowContent />
    </Suspense>
  );
}
