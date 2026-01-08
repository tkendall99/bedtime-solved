import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOK_STATUS, JOB_STEP } from "@/lib/constants/bookStatus";
import type { CreateBookResponse, ApiError, AgeBand, Tone } from "@/lib/types/database";
import { z } from "zod";

// Extend timeout to 60 seconds (requires Vercel Pro plan, otherwise defaults to 10s)
export const maxDuration = 60;

/**
 * Request body schema for creating a book.
 * Photo is already uploaded directly to Supabase Storage by the client.
 */
const createBookSchema = z.object({
  bookId: z.string().uuid(),
  child_name: z.string().min(2).max(32),
  age_band: z.enum(["3-4", "5-6", "7-9"]),
  interests: z.array(z.string()).min(1).max(3),
  tone: z.enum(["gentle", "funny", "brave"]),
  moral_lesson: z.string().max(140).nullable().optional(),
  source_photo_path: z.string().min(1),
});

/**
 * POST /api/books
 *
 * Creates a new book record and queues a generation job.
 * Photo must already be uploaded to Supabase Storage (client-side direct upload).
 *
 * Request: JSON
 * - bookId: string (UUID, matches the upload path)
 * - child_name: string
 * - age_band: "3-4" | "5-6" | "7-9"
 * - interests: string[]
 * - tone: "gentle" | "funny" | "brave"
 * - moral_lesson: string (optional)
 * - source_photo_path: string (path in uploads bucket)
 *
 * Response: { bookId: string }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateBookResponse | ApiError>> {
  const startTime = Date.now();
  const log = (msg: string) => console.log(`[API /books] ${msg} (+${Date.now() - startTime}ms)`);

  log("Request received");
  const supabase = createAdminClient();

  try {
    // 1. Parse JSON body
    log("Parsing request body...");
    const body = await request.json();

    const parseResult = createBookSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation failed:", parseResult.error.flatten());
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { bookId, child_name, age_band, interests, tone, moral_lesson, source_photo_path } = parseResult.data;
    log(`Validated data for bookId: ${bookId}`);

    // 2. Verify the photo exists in storage
    log("Verifying photo exists in storage...");
    const { data: photoCheck, error: photoCheckError } = await supabase.storage
      .from("uploads")
      .list(bookId, { limit: 1 });

    if (photoCheckError || !photoCheck || photoCheck.length === 0) {
      console.error("Photo not found in storage:", photoCheckError);
      return NextResponse.json(
        { error: "Photo not found. Please upload again." },
        { status: 400 }
      );
    }
    log("Photo verified in storage");

    // 3. Insert book row with the provided bookId
    log("Inserting book row...");
    const { error: bookError } = await supabase
      .from("books")
      .insert({
        id: bookId,
        child_name,
        age_band: age_band as AgeBand,
        interests,
        tone: tone as Tone,
        moral_lesson: moral_lesson || null,
        source_photo_path,
        status: BOOK_STATUS.DRAFT,
      });

    if (bookError) {
      console.error("Failed to insert book:", bookError);
      // Check if it's a duplicate key error (book already exists)
      if (bookError.code === "23505") {
        return NextResponse.json(
          { error: "Book already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }

    log(`Book created: ${bookId}`);

    // 4. Insert job row (queued, step: character_sheet)
    log("Creating job...");
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

    log(`Job created for book: ${bookId}`);

    // 5. Job processing is handled by Supabase Edge Function
    // A database webhook triggers the Edge Function on INSERT to book_jobs
    // This avoids Vercel's 10-second timeout limitation

    // 6. Return success
    log(`SUCCESS! Returning bookId: ${bookId}`);
    return NextResponse.json({ bookId }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/books:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
