/** Display labels for context step (match q-and-a) */
export const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  cpo_director: "CPO / Director of Product",
  head_of_product: "Head of Product",
  sr_pm: "Sr. / Product Manager",
  associate_pm: "Associate / Aspiring PM",
};

export const COMPANY_STAGE_LABELS: Record<string, string> = {
  preseed_seed: "Pre-Seed / Seed",
  series_a_b: "Series A-B",
  growth_series_c_plus: "Growth (Series C+)",
  enterprise: "Enterprise",
  corporate: "Corporate",
};

export const TEAM_SIZE_LABELS: Record<string, string> = {
  "1-5": "1-5",
  "6-15": "6-15",
  "16-50": "16-50",
  "51+": "51+",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
};

export const DOMAIN_LABELS: Record<string, string> = {
  strategy: "Strategy",
  discovery: "Discovery",
  delivery: "Delivery",
  growth: "Growth",
  leadership: "Leadership",
};

export const ROLES = Object.keys(ROLE_LABELS) as string[];
export const COMPANY_STAGES = Object.keys(COMPANY_STAGE_LABELS) as string[];
export const TEAM_SIZES = Object.keys(TEAM_SIZE_LABELS) as string[];
export const EXPERIENCE_LEVELS = Object.keys(EXPERIENCE_LABELS) as string[];
export const DOMAINS = Object.keys(DOMAIN_LABELS) as string[];
