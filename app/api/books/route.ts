import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCreateBookFormData } from "@/lib/validators/createBookApi";
import { BOOK_STATUS, JOB_STEP } from "@/lib/constants/bookStatus";
import type { CreateBookResponse, ApiError } from "@/lib/types/database";

/**
 * Trigger job processing in background.
 * Makes a POST request to the job processor endpoint.
 * Uses Next.js `after()` to run after the response is sent.
 */
async function triggerJobProcessing(baseUrl: string): Promise<void> {
  const url = new URL("/api/admin/jobs/process-next", baseUrl);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("[Background] Job processing triggered successfully");
    } else {
      console.error("[Background] Job processing trigger failed:", response.status);
    }
  } catch (error) {
    console.error("[Background] Failed to trigger job processing:", error);
  }
}

/**
 * POST /api/books
 *
 * Creates a new book record, uploads the source photo to storage,
 * and queues a generation job.
 *
 * Request: multipart/form-data
 * - child_name: string
 * - age_band: "3-4" | "5-6" | "7-9"
 * - interests: JSON string array
 * - tone: "gentle" | "funny" | "brave"
 * - moral_lesson: string (optional)
 * - photo: File
 *
 * Response: { bookId: string }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateBookResponse | ApiError>> {
  const supabase = createAdminClient();
  let bookId: string | null = null;

  try {
    // 1. Parse multipart form data
    const formData = await request.formData();
    const parseResult = parseCreateBookFormData(formData);

    if (!parseResult.success || !parseResult.data) {
      console.error("Validation failed:", parseResult.error, parseResult.fieldErrors);
      return NextResponse.json(
        {
          error: parseResult.error || "Validation failed",
          details: parseResult.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fields, photo } = parseResult.data;

    // 2. Insert book row (status: draft)
    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        child_name: fields.child_name,
        age_band: fields.age_band,
        interests: fields.interests,
        tone: fields.tone,
        moral_lesson: fields.moral_lesson || null,
        status: BOOK_STATUS.DRAFT,
      })
      .select("id")
      .single();

    if (bookError || !book) {
      console.error("Failed to insert book:", bookError);
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }

    bookId = book.id;
    console.log(`Created book: ${bookId}`);

    // 3. Upload photo to storage
    const fileExt = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${bookId}/source.${fileExt}`;
    const photoBuffer = await photo.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(storagePath, photoBuffer, {
        contentType: photo.type,
        upsert: true, // Idempotent - safe to retry
      });

    if (uploadError) {
      console.error("Failed to upload photo:", uploadError);
      // Mark book as failed
      await supabase
        .from("books")
        .update({
          status: BOOK_STATUS.FAILED,
          error_message: "Photo upload failed",
        })
        .eq("id", bookId);
      return NextResponse.json(
        { error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    console.log(`Uploaded photo: ${storagePath}`);

    // 4. Update book with photo path
    const { error: updateError } = await supabase
      .from("books")
      .update({ source_photo_path: storagePath })
      .eq("id", bookId);

    if (updateError) {
      console.error("Failed to update book with photo path:", updateError);
      // Non-fatal - continue with job creation
    }

    // 5. Insert job row (queued, step: character_sheet)
    const { error: jobError } = await supabase.from("book_jobs").insert({
      book_id: bookId,
      status: "queued",
      step: JOB_STEP.CHARACTER_SHEET,
    });

    if (jobError) {
      console.error("Failed to create job:", jobError);
      // Mark book as failed
      await supabase
        .from("books")
        .update({
          status: BOOK_STATUS.FAILED,
          error_message: "Failed to queue generation",
        })
        .eq("id", bookId);
      return NextResponse.json(
        { error: "Failed to queue generation" },
        { status: 500 }
      );
    }

    console.log(`Created job for book: ${bookId}`);

    // 6. Schedule job processing to run after response is sent
    // Uses Next.js after() to keep the function alive for background work
    const baseUrl = request.url;
    after(async () => {
      await triggerJobProcessing(baseUrl);
    });

    // 7. Return success with bookId immediately
    // bookId is guaranteed to be non-null at this point since we set it after insert
    return NextResponse.json({ bookId: bookId! }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/books:", error);

    // If we created a book, mark it as failed
    if (bookId) {
      try {
        await supabase
          .from("books")
          .update({
            status: BOOK_STATUS.FAILED,
            error_message: "Unexpected error during creation",
          })
          .eq("id", bookId);
      } catch (cleanupError) {
        console.error("Failed to mark book as failed:", cleanupError);
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
