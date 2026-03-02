"use client";

import { useState } from "react";
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

export function ContextStep({
  onComplete,
}: {
  onComplete: (data: ContextData) => void;
}) {
  const [role, setRole] = useState<string>("");
  const [companyStage, setCompanyStage] = useState<string>("");
  const [teamSize, setTeamSize] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");

  const canContinue =
    role && companyStage && teamSize && experienceLevel;

  const handleContinue = () => {
    if (!canContinue) return;
    onComplete({
      role,
      company_stage: companyStage,
      team_size: teamSize,
      experience_level: experienceLevel,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-zinc-600">
        Get personalized content recommendations in ~3 minutes. We’ll use this to
        tailor results.
      </p>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Role
        </label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                role === r
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Company stage
        </label>
        <div className="flex flex-wrap gap-2">
          {COMPANY_STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setCompanyStage(s)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                companyStage === s
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {COMPANY_STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Team size
        </label>
        <div className="flex flex-wrap gap-2">
          {TEAM_SIZES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTeamSize(t)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                teamSize === t
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {TEAM_SIZE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Experience level
        </label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setExperienceLevel(e)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                experienceLevel === e
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {EXPERIENCE_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full rounded-lg bg-zinc-900 text-white py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition"
      >
        Continue
      </button>
    </div>
  );
}
