/** Profile and context enums (match DB and q-and-a) */
export const PROFILE_ROLES = [
  "founder",
  "cpo_director",
  "head_of_product",
  "sr_pm",
  "associate_pm",
] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const COMPANY_STAGES = [
  "preseed_seed",
  "series_a_b",
  "growth_series_c_plus",
  "enterprise",
  "corporate",
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number];

export const TEAM_SIZES = ["1-5", "6-15", "16-50", "51+"] as const;
export type TeamSize = (typeof TEAM_SIZES)[number];

export const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "lead"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const CHALLENGE_DOMAINS = [
  "strategy",
  "discovery",
  "delivery",
  "growth",
  "leadership",
] as const;
export type ChallengeDomain = (typeof CHALLENGE_DOMAINS)[number];

export const CONTENT_SOURCE_TYPES = [
  "podcast",
  "video",
  "website",
  "book",
] as const;
export type ContentSourceType = (typeof CONTENT_SOURCE_TYPES)[number];

/** Epic 13 — Challenge status enum. */
export const CHALLENGE_STATUSES = [
  "open",
  "in_progress",
  "completed",
  "archived",
  "abandoned",
] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

/** Chunk type enum (Epic 8 — Content Intelligence Service). */
export const CHUNK_TYPES = [
  "framework",
  "example",
  "principle",
  "case_study",
  "tool",
  "warning",
  "summary",
  "introduction",
  "discussion",
] as const;
export type ChunkType = (typeof CHUNK_TYPES)[number];

export interface Profile {
  id: string;
  /** Null for bare profiles created at signup (before context is collected). */
  role: ProfileRole | null;
  company_stage: CompanyStage | null;
  team_size: TeamSize | null;
  experience_level: ExperienceLevel | null;
  use_premium_model: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  role?: ProfileRole | null;
  company_stage?: CompanyStage | null;
  team_size?: TeamSize | null;
  experience_level?: ExperienceLevel | null;
  use_premium_model?: boolean;
}

export interface Challenge {
  id: string;
  user_id: string | null;
  raw_description: string;
  domain: ChallengeDomain;
  /** Multi-domain support (Epic 6). At least one domain required. */
  domains: ChallengeDomain[];
  subdomain: string | null;
  impact_reach: string | null;
  summary: string | null;
  /** Epic 11 — stored after phase-1 LLM call for use in phase-2 recommendations. */
  problem_statement: string | null;
  desired_outcome_statement: string | null;
  /** Epic 13 — challenge lifecycle status (default: open). */
  status: ChallengeStatus;
  /** Epic 14 — explicit save state. */
  is_saved: boolean;
  saved_at: string | null;
  title: string | null;
  recommendations: ArtifactRecommendation[] | null;
  created_at: string;
}

export interface ChallengeInsert {
  user_id: string | null;
  raw_description: string;
  domain: ChallengeDomain;
  /** Multi-domain support (Epic 6). At least one domain required. */
  domains: ChallengeDomain[];
  subdomain?: string | null;
  impact_reach?: string | null;
  summary?: string | null;
}

export interface Content {
  id: string;
  source_type: ContentSourceType;
  title: string;
  url: string | null;
  primary_domain: ChallengeDomain | null;
  /** Multi-domain support (Epic 6). */
  domains: ChallengeDomain[];
  /** Epic 8 — Content Intelligence Service fields. */
  topics: string[];
  keywords: string[];
  author: string | null;
  publication_date: string | null;
  language: string;
  extraction_confidence: number | null;
  created_at: string;
}

export interface ContentInsert {
  source_type: ContentSourceType;
  title: string;
  url?: string | null;
  primary_domain?: ChallengeDomain | null;
  /** Multi-domain support (Epic 6). */
  domains?: ChallengeDomain[];
  /** Epic 8 — Content Intelligence Service fields (optional at insert; populated after extraction). */
  topics?: string[];
  keywords?: string[];
  author?: string | null;
  publication_date?: string | null;
  language?: string;
  extraction_confidence?: number | null;
}

export interface ContentChunk {
  id: string;
  content_id: string;
  body: string;
  embedding: number[] | null;
  chunk_index: number;
  /** Epic 8 — Content Intelligence Service fields. */
  chunk_type: ChunkType | null;
  key_concepts: string[];
  created_at: string;
}

export interface ContentChunkInsert {
  content_id: string;
  body: string;
  embedding: number[];
  chunk_index: number;
  /** Epic 8 — optional; populated after intelligence extraction. */
  chunk_type?: ChunkType | null;
  key_concepts?: string[];
}

export interface ChunkWithContent {
  chunk: ContentChunk;
  content: Content;
  similarity?: number;
  /** Full-text keyword relevance score (0–1) from hybrid RAG retrieval (Epic 7). */
  keywordScore?: number;
}

/** Epic 10 — Artifact-Optimized Recommendations */
export interface Artifact {
  id: string;
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  /** Pre-generated LLM detail (Epic 11). Null if not yet generated. */
  detail?: unknown;
  created_at: string;
}

export interface ArtifactRecommendation {
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  explanation: string;
  isMostRelevant: boolean;
}
