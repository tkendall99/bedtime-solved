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
  PAGE1_TEXT: "page1_text",
  COVER_IMAGE: "cover_image",
  PAGE1_IMAGE: "page1_image",
  COMPLETE: "complete",
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
  page1_text: "Writing story...",
  cover_image: "Creating cover...",
  page1_image: "Illustrating page...",
  complete: "Finishing up...",
};

/** Ordered list of job steps for stepper display */
export const JOB_STEPS_ORDER: JobStep[] = [
  "character_sheet",
  "page1_text",
  "cover_image",
  "page1_image",
  "complete",
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
