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
  "article",
  "framework",
  "playbook",
  "case_study",
] as const;
export type ContentSourceType = (typeof CONTENT_SOURCE_TYPES)[number];

export interface Profile {
  id: string;
  role: ProfileRole;
  company_stage: CompanyStage;
  team_size: TeamSize;
  experience_level: ExperienceLevel;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  role: ProfileRole;
  company_stage: CompanyStage;
  team_size: TeamSize;
  experience_level: ExperienceLevel;
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
  summary: string | null;
  key_takeaways: string | null;
  metadata: Record<string, unknown>;
  primary_domain: ChallengeDomain | null;
  /** Multi-domain support (Epic 6). */
  domains: ChallengeDomain[];
  created_at: string;
}

export interface ContentInsert {
  source_type: ContentSourceType;
  title: string;
  url?: string | null;
  summary?: string | null;
  key_takeaways?: string | null;
  metadata?: Record<string, unknown>;
  primary_domain?: ChallengeDomain | null;
  /** Multi-domain support (Epic 6). */
  domains?: ChallengeDomain[];
}

export interface ContentChunk {
  id: string;
  content_id: string;
  body: string;
  embedding: number[] | null;
  chunk_index: number;
  created_at: string;
}

export interface ContentChunkInsert {
  content_id: string;
  body: string;
  embedding: number[];
  chunk_index: number;
}

export interface ChunkWithContent {
  chunk: ContentChunk;
  content: Content;
  similarity?: number;
  /** Full-text keyword relevance score (0–1) from hybrid RAG retrieval (Epic 7). */
  keywordScore?: number;
}
