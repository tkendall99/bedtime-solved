/**
 * Database types for Supabase tables.
 * These types match the schema defined in migrations.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export const BOOK_STATUSES = [
  "draft",
  "generating",
  "preview_ready",
  "paid",
  "completed",
  "failed",
] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

export const JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STEPS = [
  "character_sheet",
  "story_outline",
  "page_content",
  "illustrations",
  "pdf_generation",
] as const;

export type JobStep = (typeof JOB_STEPS)[number];

export const PAGE_TYPES = ["cover", "content", "back"] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export const AGE_BANDS = ["3-4", "5-6", "7-9"] as const;

export type AgeBand = (typeof AGE_BANDS)[number];

export const TONES = ["gentle", "funny", "brave"] as const;

export type Tone = (typeof TONES)[number];

// ============================================================================
// Database Row Types
// ============================================================================

export interface Book {
  id: string;
  child_name: string;
  age_band: AgeBand;
  interests: string[];
  tone: Tone;
  moral_lesson: string | null;
  source_photo_path: string | null;
  character_sheet_path: string | null;
  cover_image_path: string | null;
  status: BookStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookPage {
  id: string;
  book_id: string;
  page_number: number;
  page_type: PageType;
  story_text: string | null;
  illustration_prompt: string | null;
  illustration_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookJob {
  id: string;
  book_id: string;
  status: JobStatus;
  step: JobStep;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// ============================================================================
// API Types
// ============================================================================

export interface CreateBookInput {
  child_name: string;
  age_band: AgeBand;
  interests: string[];
  tone: Tone;
  moral_lesson?: string;
}

export interface BookPreview {
  coverUrl: string;
  page1ImageUrl: string;
  page1Text: string;
}

export interface BookStatusResponse {
  bookId: string;
  status: BookStatus;
  errorMessage: string | null;
  createdAt: string;
  preview?: BookPreview;
}

export interface CreateBookResponse {
  bookId: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
