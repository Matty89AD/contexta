/**
 * Epic 9 — Challenge Test Dataset
 *
 * 15 synthetic challenges with enum values and manually annotated ground truth
 * (3 expected content titles per challenge). Source of truth for the eval harness.
 *
 * Ground truth titles match the content ingested from data/content_test/ — the
 * `.txt` extension is stripped during ingestion, so "Brian Chesky.txt" → "Brian Chesky".
 */

export interface EvalChallenge {
  id: string;
  raw_description: string;
  /** Primary domain (first in domains array) */
  domain: string;
  /** All applicable domains passed to the matching engine */
  domains: string[];
  role: string;
  company_stage: string;
  team_size: string;
  experience_level: string;
  /** Expected content titles (verbatim from ingest; normalisation applied at eval time) */
  ground_truth: string[];
}

export const EVAL_CHALLENGES: EvalChallenge[] = [
  {
    id: "CH-001",
    raw_description:
      "I need to align Sales, Engineering, and the CEO on our 6‑month strategy and stop weekly priority churn.",
    domain: "strategy",
    domains: ["strategy"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "6-15",
    experience_level: "mid",
    ground_truth: ["Brian Chesky", "Petra Wille", "John Cutler"],
  },
  {
    id: "CH-002",
    raw_description:
      "We have 40+ requests from enterprise prospects and existing customers. I need a roadmap process that feels fair and defensible.",
    domain: "discovery",
    domains: ["discovery"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "6-15",
    experience_level: "senior",
    ground_truth: ["Ryan Singer", "Teresa Torres", "John Cutler"],
  },
  {
    id: "CH-003",
    raw_description:
      "Activation dropped 12% after a redesign. I need to diagnose the onboarding funnel and ship experiments without slowing delivery.",
    domain: "growth",
    domains: ["growth"],
    role: "sr_pm",
    company_stage: "preseed_seed",
    team_size: "6-15",
    experience_level: "mid",
    ground_truth: ["Adam Fishman", "Brian Balfour", "Elena Verna 2.0"],
  },
  {
    id: "CH-004",
    raw_description:
      "We keep missing sprint goals and stakeholders are losing trust. I need a delivery system that improves predictability.",
    domain: "delivery",
    domains: ["delivery"],
    role: "head_of_product",
    company_stage: "growth_series_c_plus",
    team_size: "16-50",
    experience_level: "lead",
    ground_truth: ["Ryan Singer", "Petra Wille", "John Cutler"],
  },
  {
    id: "CH-005",
    raw_description:
      "We want to expand from SMB to mid-market. I need to define ICP, positioning, and which product gaps matter most.",
    domain: "strategy",
    domains: ["strategy"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "6-15",
    experience_level: "senior",
    ground_truth: ["Brian Balfour", "Adam Grenier", "Elena Verna 3.0"],
  },
  {
    id: "CH-006",
    raw_description:
      "We rarely talk to users because Sales gatekeeps access. I need a repeatable discovery pipeline and buy-in for user research.",
    domain: "discovery",
    domains: ["discovery"],
    role: "associate_pm",
    company_stage: "enterprise",
    team_size: "6-15",
    experience_level: "junior",
    ground_truth: ["Teresa Torres", "Petra Wille", "Ada Chen Rekhi"],
  },
  {
    id: "CH-007",
    raw_description:
      "We had two outages in a month. I need to coordinate incident learnings into a reliability roadmap and communicate credibly.",
    domain: "delivery",
    domains: ["delivery"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "16-50",
    experience_level: "senior",
    ground_truth: ["Alex Komoroske", "Albert Cheng", "John Cutler"],
  },
  {
    id: "CH-008",
    raw_description:
      "Our OKRs are vague and don't change decisions. I need a system that ties metrics to roadmap and weekly execution.",
    domain: "leadership",
    domains: ["leadership"],
    role: "head_of_product",
    company_stage: "series_a_b",
    team_size: "16-50",
    experience_level: "lead",
    ground_truth: ["John Cutler", "Petra Wille", "Brian Chesky"],
  },
  {
    id: "CH-009",
    raw_description:
      "We need to increase prices for new customers and migrate existing ones. I need a plan that minimizes churn and support load.",
    domain: "growth",
    domains: ["growth"],
    role: "sr_pm",
    company_stage: "growth_series_c_plus",
    team_size: "16-50",
    experience_level: "senior",
    ground_truth: ["Elena Verna 4.0", "Casey Winters", "Brian Balfour"],
  },
  {
    id: "CH-010",
    raw_description:
      "We have an idea but no clarity on MVP scope. I need a crisp problem statement, success metrics, and a 6–8 week plan.",
    domain: "discovery",
    domains: ["discovery"],
    role: "founder",
    company_stage: "preseed_seed",
    team_size: "1-5",
    experience_level: "mid",
    ground_truth: ["Brian Chesky", "Ryan Singer", "Alex Hardimen"],
  },
  {
    id: "CH-011",
    raw_description:
      "My tech lead overrides product decisions in meetings. I need a healthier decision process and working relationship.",
    domain: "leadership",
    domains: ["leadership"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "6-15",
    experience_level: "mid",
    ground_truth: ["Petra Wille", "Ada Chen Rekhi", "John Cutler"],
  },
  {
    id: "CH-012",
    raw_description:
      "Different dashboards show different numbers. I need a single source of truth and metric definitions to drive decisions.",
    domain: "delivery",
    domains: ["delivery"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "6-15",
    experience_level: "senior",
    ground_truth: [
      "Albert Cheng",
      "Aishwarya Naresh Reganti + Kiriti Badam",
      "John Cutler",
    ],
  },
  {
    id: "CH-013",
    raw_description:
      "Customers sign up but don't build habits. I need to identify retention levers and design a retention experiment plan.",
    domain: "growth",
    domains: ["growth"],
    role: "sr_pm",
    company_stage: "series_a_b",
    team_size: "6-15",
    experience_level: "mid",
    ground_truth: ["Casey Winters", "Elena Verna 4.0", "Brian Balfour"],
  },
  {
    id: "CH-014",
    raw_description:
      "We're entering a regulated market and Legal blocks many features late. I need a compliance-by-design workflow.",
    domain: "delivery",
    domains: ["delivery"],
    role: "sr_pm",
    company_stage: "enterprise",
    team_size: "6-15",
    experience_level: "senior",
    ground_truth: ["Alex Komoroske", "Adriel Frederick", "John Cutler"],
  },
  {
    id: "CH-015",
    raw_description:
      "We operate like an internal agency taking tickets. I need to shift the org toward outcomes, discovery, and empowered teams.",
    domain: "leadership",
    domains: ["leadership"],
    role: "cpo_director",
    company_stage: "growth_series_c_plus",
    team_size: "51+",
    experience_level: "lead",
    ground_truth: ["Petra Wille", "Brian Chesky", "John Cutler"],
  },
];
