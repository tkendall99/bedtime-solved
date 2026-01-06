/**
 * Book and job status constants for use across the application.
 * Single source of truth for status values and UI labels.
 */

import type { BookStatus, JobStatus, JobStep } from "@/lib/types/database";

// ============================================================================
// Status Constants
// ============================================================================

export const BOOK_STATUS = {
  DRAFT: "draft",
  GENERATING: "generating",
  PREVIEW_READY: "preview_ready",
  PAID: "paid",
  COMPLETED: "completed",
  FAILED: "failed",
} as const satisfies Record<string, BookStatus>;

export const JOB_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const satisfies Record<string, JobStatus>;

export const JOB_STEP = {
  CHARACTER_SHEET: "character_sheet",
  STORY_OUTLINE: "story_outline",
  PAGE_CONTENT: "page_content",
  ILLUSTRATIONS: "illustrations",
  PDF_GENERATION: "pdf_generation",
} as const satisfies Record<string, JobStep>;

// ============================================================================
// UI Labels
// ============================================================================

/** Labels for book status displayed in UI */
export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  draft: "Draft",
  generating: "Generating...",
  preview_ready: "Preview Ready",
  paid: "Paid",
  completed: "Completed",
  failed: "Failed",
};

/** Labels for job steps displayed in stepper UI */
export const JOB_STEP_LABELS: Record<JobStep, string> = {
  character_sheet: "Analyzing photo...",
  story_outline: "Writing story...",
  page_content: "Creating pages...",
  illustrations: "Generating artwork...",
  pdf_generation: "Building your book...",
};

/** Ordered list of job steps for stepper display */
export const JOB_STEPS_ORDER: JobStep[] = [
  "character_sheet",
  "story_outline",
  "page_content",
  "illustrations",
  "pdf_generation",
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a book status indicates generation is in progress
 */
export function isGenerating(status: BookStatus): boolean {
  return status === "draft" || status === "generating";
}

/**
 * Check if a book status indicates completion (success or failure)
 */
export function isTerminal(status: BookStatus): boolean {
  return (
    status === "preview_ready" ||
    status === "completed" ||
    status === "failed"
  );
}

/**
 * Get the index of a job step in the pipeline (0-indexed)
 */
export function getStepIndex(step: JobStep): number {
  return JOB_STEPS_ORDER.indexOf(step);
}
