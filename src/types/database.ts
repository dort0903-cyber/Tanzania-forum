export type UserRole = "admin" | "moderator" | "fact_checker" | "member";
export type UserStatus = "active" | "suspended" | "banned";
export type ContentStatus = "published" | "hidden" | "deleted" | "pending";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type VerdictType = "true" | "false" | "misleading" | "unverified" | "satire";
export type LanguageCode = "en" | "sw";
export type ReactionType = "like" | "insightful" | "disagree" | "funny";

export interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  reputation: number;
  language_pref: LanguageCode;
  is_verified: boolean;
  google_email?: string | null;
  notification_email: boolean;
  notification_whatsapp: boolean;
  notification_sms: boolean;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_sw: string;
  description_en: string | null;
  description_sw: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  rules_en: string | null;
  rules_sw: string | null;
  ai_sensitivity: number;
  thread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  slug: string;
  language: LanguageCode;
  status: ContentStatus;
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  view_count: number;
  reply_count: number;
  reaction_count: number;
  last_activity_at: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  has_verified_sources: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  category?: Category;
  author?: Profile;
}

export interface Post {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  language: LanguageCode;
  status: ContentStatus;
  is_ai_flagged: boolean;
  ai_flag_reason: string | null;
  ai_confidence: number | null;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  replies?: Post[];
}

export interface FactCheck {
  id: string;
  claim: string;
  verdict: VerdictType;
  explanation_en: string;
  explanation_sw: string | null;
  sources: { title: string; url: string }[];
  author_id: string;
  linked_thread_ids: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}
