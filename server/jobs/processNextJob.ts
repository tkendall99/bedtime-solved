/**
 * Job processor for book generation.
 * Processes queued jobs to generate preview assets (character sheet, cover, page 1).
 *
 * Server-only - called from admin API endpoint.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generatePage1Story } from "@/lib/ai/story";
import {
  generateCharacterSheet,
  generateCoverImage,
  generatePageIllustration,
  bufferToBase64,
  base64ToBuffer,
} from "@/lib/ai/images";
import { BOOK_STATUS, JOB_STATUS } from "@/lib/constants/bookStatus";
import type { Book, BookJob, AgeBand, Tone } from "@/lib/types/database";

// ============================================================================
// Types
// ============================================================================

export interface ProcessResult {
  processed: boolean;
  bookId?: string;
  error?: string;
}

interface JobWithBook extends BookJob {
  book: Book;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Process the next queued job.
 * Claims one job, runs all generation steps, and updates status.
 *
 * @returns Result indicating if a job was processed
 */
export async function processNextJob(): Promise<ProcessResult> {
  const supabase = createAdminClient();

  // Step 1: Claim the next queued job
  const job = await claimNextJob(supabase);
  if (!job) {
    console.log("[Job] No queued jobs found");
    return { processed: false };
  }

  console.log(`[Job] Processing job ${job.id} for book ${job.book_id}`);

  try {
    // Step 2: Load book data
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", job.book_id)
      .single();

    if (bookError || !book) {
      throw new Error(`Failed to load book: ${bookError?.message || "Not found"}`);
    }

    // Update book status to generating
    await supabase
      .from("books")
      .update({ status: BOOK_STATUS.GENERATING, updated_at: new Date().toISOString() })
      .eq("id", book.id);

    // Step 3: Load source photo
    const sourcePhotoBase64 = await downloadPhoto(supabase, book.source_photo_path);

    // Step 4: Generate character sheet
    console.log(`[Job] Step: Generating character sheet`);
    const characterSheetBase64 = await generateCharacterSheet({
      sourcePhotoBase64,
      childName: book.child_name,
    });

    // Upload character sheet
    const characterSheetPath = `${book.id}/character_sheet.png`;
    await uploadImage(supabase, "uploads", characterSheetPath, characterSheetBase64);

    // Update book with character sheet path
    await supabase
      .from("books")
      .update({
        character_sheet_path: characterSheetPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", book.id);

    // Update job step
    await updateJobStep(supabase, job.id, "page_content");

    // Step 5: Generate page 1 story (also generates book title)
    console.log(`[Job] Step: Generating page 1 story`);
    const storyResult = await generatePage1Story({
      childName: book.child_name,
      ageBand: book.age_band as AgeBand,
      interests: book.interests,
      tone: book.tone as Tone,
      moralLesson: book.moral_lesson,
    });

    // Update book with generated title
    await supabase
      .from("books")
      .update({
        title: storyResult.bookTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", book.id);

    console.log(`[Job] Generated book title: "${storyResult.bookTitle}"`);

    // Insert page 1 record
    await supabase.from("book_pages").insert({
      book_id: book.id,
      page_number: 1,
      page_type: "content",
      story_text: storyResult.storyText,
      illustration_prompt: storyResult.illustrationPrompt,
    });

    // Update job step
    await updateJobStep(supabase, job.id, "illustrations");

    // Step 6: Generate cover image
    console.log(`[Job] Step: Generating cover image`);
    const coverBase64 = await generateCoverImage({
      characterSheetBase64,
      childName: book.child_name,
      tone: book.tone as Tone,
      interests: book.interests,
    });

    // Upload cover image
    const coverPath = `${book.id}/cover.png`;
    await uploadImage(supabase, "images", coverPath, coverBase64);

    // Update book with cover path
    await supabase
      .from("books")
      .update({
        cover_image_path: coverPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", book.id);

    // Insert cover page record
    await supabase.from("book_pages").insert({
      book_id: book.id,
      page_number: 0,
      page_type: "cover",
      illustration_path: coverPath,
    });

    // Step 7: Generate page 1 illustration
    console.log(`[Job] Step: Generating page 1 illustration`);
    const page1ImageBase64 = await generatePageIllustration({
      characterSheetBase64,
      illustrationPrompt: storyResult.illustrationPrompt,
      pageNumber: 1,
    });

    // Upload page 1 image
    const page1Path = `${book.id}/page_01.png`;
    await uploadImage(supabase, "images", page1Path, page1ImageBase64);

    // Update page 1 with illustration path
    await supabase
      .from("book_pages")
      .update({
        illustration_path: page1Path,
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", book.id)
      .eq("page_number", 1);

    // Step 8: Mark complete
    console.log(`[Job] Marking job as complete`);
    await supabase
      .from("book_jobs")
      .update({
        status: JOB_STATUS.COMPLETED,
        step: "illustrations",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await supabase
      .from("books")
      .update({
        status: BOOK_STATUS.PREVIEW_READY,
        updated_at: new Date().toISOString(),
      })
      .eq("id", book.id);

    console.log(`[Job] Successfully processed job ${job.id} for book ${book.id}`);
    return { processed: true, bookId: book.id };
  } catch (error) {
    console.error(`[Job] Error processing job ${job.id}:`, error);
    await handleJobFailure(supabase, job, error);
    return {
      processed: true,
      bookId: job.book_id,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Claim the next queued job by updating its status to processing.
 */
async function claimNextJob(
  supabase: ReturnType<typeof createAdminClient>
): Promise<BookJob | null> {
  // Find and claim the oldest queued job
  // Using a transaction-safe approach: select then update with status check
  const { data: jobs, error: selectError } = await supabase
    .from("book_jobs")
    .select("*")
    .eq("status", JOB_STATUS.QUEUED)
    .order("created_at", { ascending: true })
    .limit(1);

  if (selectError || !jobs || jobs.length === 0) {
    return null;
  }

  const job = jobs[0];

  // Attempt to claim the job (only if still queued)
  const { data: updated, error: updateError } = await supabase
    .from("book_jobs")
    .update({
      status: JOB_STATUS.PROCESSING,
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("status", JOB_STATUS.QUEUED) // Only update if still queued (optimistic lock)
    .select()
    .single();

  if (updateError || !updated) {
    // Job was claimed by another process
    console.log(`[Job] Job ${job.id} was claimed by another process`);
    return null;
  }

  return updated as BookJob;
}

/**
 * Download a photo from storage and return as base64.
 */
async function downloadPhoto(
  supabase: ReturnType<typeof createAdminClient>,
  path: string | null
): Promise<string> {
  if (!path) {
    throw new Error("No source photo path");
  }

  const { data, error } = await supabase.storage.from("uploads").download(path);

  if (error || !data) {
    throw new Error(`Failed to download photo: ${error?.message || "Not found"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return bufferToBase64(buffer);
}

/**
 * Upload an image to storage.
 */
async function uploadImage(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string,
  base64Data: string
): Promise<void> {
  const buffer = base64ToBuffer(base64Data);

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "image/png",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload image to ${bucket}/${path}: ${error.message}`);
  }

  console.log(`[Job] Uploaded image to ${bucket}/${path}`);
}

/**
 * Update the current step of a job.
 */
async function updateJobStep(
  supabase: ReturnType<typeof createAdminClient>,
  jobId: string,
  step: string
): Promise<void> {
  await supabase
    .from("book_jobs")
    .update({
      step,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/**
 * Handle job failure - mark job and book as failed.
 */
async function handleJobFailure(
  supabase: ReturnType<typeof createAdminClient>,
  job: BookJob,
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const maxAttempts = job.max_attempts || 3;

  if (job.attempts < maxAttempts) {
    // Reset to queued for retry
    console.log(`[Job] Job ${job.id} failed, will retry (attempt ${job.attempts}/${maxAttempts})`);
    await supabase
      .from("book_jobs")
      .update({
        status: JOB_STATUS.QUEUED,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  } else {
    // Max attempts reached - mark as permanently failed
    console.log(`[Job] Job ${job.id} failed permanently after ${job.attempts} attempts`);
    await supabase
      .from("book_jobs")
      .update({
        status: JOB_STATUS.FAILED,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await supabase
      .from("books")
      .update({
        status: BOOK_STATUS.FAILED,
        error_message: `Generation failed: ${errorMessage}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.book_id);
  }
}
