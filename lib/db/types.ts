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
  /** Epic 16 — Admin flag. */
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  role?: ProfileRole | null;
  company_stage?: CompanyStage | null;
  team_size?: TeamSize | null;
  experience_level?: ExperienceLevel | null;
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
  /** Multi-domain support (Epic 6). */
  domains: ChallengeDomain[];
  /** Epic 8 — Content Intelligence Service fields. */
  topics: string[];
  keywords: string[];
  author: string | null;
  publication_date: string | null;
  language: string;
  extraction_confidence: number | null;
  /** Epic 16 — Admin UI: content lifecycle status. */
  status: ContentStatus;
  /** Epic 16 — Admin UI: raw transcript/text for processing. */
  transcript_raw: string | null;
  /** Epic 18 — generated summary (2–4 sentences). */
  summary: string | null;
  created_at: string;
}

export interface ContentInsert {
  source_type: ContentSourceType;
  title: string;
  url?: string | null;
  /** Multi-domain support (Epic 6). */
  domains?: ChallengeDomain[];
  /** Epic 8 — Content Intelligence Service fields (optional at insert; populated after extraction). */
  topics?: string[];
  keywords?: string[];
  author?: string | null;
  publication_date?: string | null;
  language?: string;
  extraction_confidence?: number | null;
  /** Epic 16 — Admin UI fields (optional at insert). */
  status?: ContentStatus;
  transcript_raw?: string | null;
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

/** Epic 16 — Admin UI */
export const CONTENT_STATUSES = [
  "draft",
  "pending_review",
  "active",
  "archived",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const NEWS_POST_TYPES = ["podcast", "artifact", "article"] as const;
export type NewsPostType = (typeof NEWS_POST_TYPES)[number];

export const NEWS_POST_STATUSES = ["draft", "published"] as const;
export type NewsPostStatus = (typeof NEWS_POST_STATUSES)[number];

export interface NewsPost {
  id: string;
  type: NewsPostType;
  title: string;
  description: string;
  published_date: string;
  status: NewsPostStatus;
  sort_order: number;
  /** Epic 19 — true if created by news proposal LLM. */
  is_ai_generated: boolean;
  /** Epic 19 — 'content' | 'artifact' | null. */
  source_type: 'content' | 'artifact' | null;
  /** Epic 19 — source item id. */
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Epic 19 — Artifact status workflow. */
export const ARTIFACT_STATUSES = ['draft', 'pending_review', 'active', 'archived'] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

/** Epic 10 — Artifact-Optimized Recommendations */
export interface Artifact {
  id: string;
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  /** Pre-generated LLM detail (Epic 11). Null if not yet generated. */
  detail?: unknown;
  /** Epic 19 — Status workflow. Default 'active' for seeded artifacts. */
  status: ArtifactStatus;
  /** Epic 19 — true if created by artifact detection LLM. */
  is_ai_generated: boolean;
  /** Epic 19 — content item that triggered detection. */
  source_content_id: string | null;
  /** Epic 19 — slug of possibly-duplicate existing artifact. */
  possible_duplicate_of: string | null;
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

/** Epic 17 — Auto-Generate Transcript from URL */
export const TRANSCRIPT_JOB_URL_TYPES = [
  "youtube",
  "podcast_rss",
  "podcast_episode",
  "webpage",
] as const;
export type TranscriptJobUrlType = (typeof TRANSCRIPT_JOB_URL_TYPES)[number];

export const TRANSCRIPT_JOB_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;
export type TranscriptJobStatus = (typeof TRANSCRIPT_JOB_STATUSES)[number];

export interface TranscriptJob {
  id: string;
  created_by: string;
  url: string;
  url_type: TranscriptJobUrlType;
  status: TranscriptJobStatus;
  error_message: string | null;
  content_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptJobInsert {
  created_by: string;
  url: string;
  url_type: TranscriptJobUrlType;
}

/** Epic 18 — Content view tracking. */
export interface ContentView {
  id: string;
  user_id: string;
  content_id: string;
  first_viewed_at: string;
  last_viewed_at: string;
  view_count: number;
}

/** Epic 15 — Artifact Vault */
export interface SavedArtifact {
  slug: string;
  title: string;
  domains: string[];
  use_case: string;
  saved_at: string;
}

/** Epic 19 — Admin notification types. */
export const ADMIN_NOTIFICATION_TYPES = ['artifact_detected', 'news_proposal_generated'] as const;
export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}
