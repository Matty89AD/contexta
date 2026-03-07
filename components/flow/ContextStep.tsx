"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Pencil } from "lucide-react";
import {
  ROLES,
  COMPANY_STAGES,
  TEAM_SIZES,
  EXPERIENCE_LEVELS,
  ROLE_LABELS,
  COMPANY_STAGE_LABELS,
  TEAM_SIZE_LABELS,
  EXPERIENCE_LABELS,
} from "@/lib/constants";

export interface ContextData {
  role: string;
  company_stage: string;
  team_size: string;
  experience_level: string;
}

function isComplete(data: ContextData | null | undefined): data is ContextData {
  return !!(
    data?.role &&
    data?.company_stage &&
    data?.team_size &&
    data?.experience_level
  );
}

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

export function ContextStep({
  initialData,
  onComplete,
  onSkip,
}: {
  initialData?: ContextData | null;
  onComplete: (data: ContextData) => void;
  /**
   * If provided and initialData is fully populated, shows a confirmation view
   * first ("Is your context still up to date?") instead of the full form.
   * Calling onSkip() advances to the next step without re-saving context.
   */
  onSkip?: () => void;
}) {
  // When the user already has complete context, start in confirm mode.
  const [mode, setMode] = useState<"confirm" | "edit">(
    onSkip && isComplete(initialData) ? "confirm" : "edit"
  );

  const [role, setRole] = useState<string>(initialData?.role ?? "");
  const [companyStage, setCompanyStage] = useState<string>(
    initialData?.company_stage ?? ""
  );
  const [teamSize, setTeamSize] = useState<string>(
    initialData?.team_size ?? ""
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    initialData?.experience_level ?? ""
  );

  const setRoleAndLog = useCallback((r: string) => {
    setRole(r);
    if (r) logEvent("role_selected", { role: r });
  }, []);
  const setCompanyStageAndLog = useCallback((s: string) => {
    setCompanyStage(s);
    if (s) logEvent("stage_selected", { company_stage: s });
  }, []);

  const canContinue = role && companyStage && teamSize && experienceLevel;

  const handleContinue = () => {
    if (!canContinue) return;
    onComplete({
      role,
      company_stage: companyStage,
      team_size: teamSize,
      experience_level: experienceLevel,
    });
  };

  // — Confirm view —
  if (mode === "confirm" && onSkip && isComplete(initialData)) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Is your context still up to date?
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            We&apos;ll use this to tailor your recommendations.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 divide-y divide-zinc-200 dark:divide-zinc-700 overflow-hidden">
          {[
            { label: "Role", value: ROLE_LABELS[initialData.role] },
            { label: "Experience", value: EXPERIENCE_LABELS[initialData.experience_level] },
            { label: "Company stage", value: COMPANY_STAGE_LABELS[initialData.company_stage] },
            { label: "Team size", value: TEAM_SIZE_LABELS[initialData.team_size] },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3.5">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            Yes, looks good
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 py-3 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-sm flex items-center justify-center gap-2"
          >
            <Pencil size={14} />
            Update my context
          </button>
        </div>
      </div>
    );
  }

  // — Edit view —
  const cameFromConfirm = onSkip && isComplete(initialData);

  return (
    <div className="space-y-8">
      {cameFromConfirm && (
        <button
          type="button"
          onClick={() => setMode("confirm")}
          className="flex items-center text-sm text-zinc-500 hover:text-indigo-600 -mb-2"
        >
          <ChevronLeft size={16} /> Back
        </button>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Tell us about yourself</h1>
        <p className="text-zinc-500 dark:text-zinc-400">We&apos;ll tailor PM Artifacts based on your specific operational environment.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          Role
        </label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleAndLog(r)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                role === r
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          Level of experience in your current role
        </label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setExperienceLevel(e)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                experienceLevel === e
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500"
              }`}
            >
              {EXPERIENCE_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Company Stage
          </label>
          <select
            value={companyStage}
            onChange={(e) => setCompanyStageAndLog(e.target.value)}
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select stage...</option>
            {COMPANY_STAGES.map((s) => (
              <option key={s} value={s}>{COMPANY_STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Team Size
          </label>
          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTeamSize(t)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  teamSize === t
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500"
                }`}
              >
                {TEAM_SIZE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full rounded-xl bg-indigo-600 text-white py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
