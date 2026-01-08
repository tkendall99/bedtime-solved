import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookStatusResponse, ApiError, BookPreview } from "@/lib/types/database";

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Signed URL expiry time (1 hour)
const SIGNED_URL_EXPIRY = 3600;

// Statuses that should include preview data
const PREVIEW_STATUSES = ["preview_ready", "paid", "completed"];

/**
 * GET /api/books/[id]
 *
 * Returns the status of a book for polling.
 * When status is preview_ready or later, includes signed URLs for preview assets.
 *
 * Response: {
 *   bookId: string,
 *   status: BookStatus,
 *   errorMessage: string | null,
 *   createdAt: string,
 *   preview?: {
 *     coverUrl: string,
 *     page1ImageUrl: string,
 *     page1Text: string
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<BookStatusResponse | ApiError>> {
  const { id } = await params;

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid book ID format" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("id, status, error_message, created_at, cover_image_path, title, child_name")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching book:", error);
    if (error.code === "PGRST116") {
      // No rows returned
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Build base response (safe public fields only)
  const response: BookStatusResponse = {
    bookId: book.id,
    status: book.status,
    errorMessage: book.error_message,
    createdAt: book.created_at,
  };

  // Include preview data if status warrants it
  if (PREVIEW_STATUSES.includes(book.status)) {
    // Use generated title or fallback to child's name
    const bookTitle = book.title || `${book.child_name}'s Adventure`;
    const preview = await getPreviewData(supabase, id, book.cover_image_path, bookTitle);
    if (preview) {
      response.preview = preview;
    }
  }

  return NextResponse.json(response);
}

/**
 * Fetch preview data and generate signed URLs.
 */
async function getPreviewData(
  supabase: ReturnType<typeof createAdminClient>,
  bookId: string,
  coverImagePath: string | null,
  title: string
): Promise<BookPreview | null> {
  try {
    console.log("[Preview] getPreviewData called:", { bookId, coverImagePath, title });

    // Fetch page 1 data
    const { data: page1, error: page1Error } = await supabase
      .from("book_pages")
      .select("text_content, image_path")
      .eq("book_id", bookId)
      .eq("page_number", 1)
      .single();

    console.log("[Preview] Page 1 query result:", { page1, page1Error });

    if (page1Error || !page1) {
      console.error("[Preview] Error fetching page 1:", page1Error);
      return null;
    }

    // Generate signed URLs for images
    const [coverUrlResult, page1ImageResult] = await Promise.all([
      coverImagePath
        ? supabase.storage
            .from("images")
            .createSignedUrl(coverImagePath, SIGNED_URL_EXPIRY)
        : Promise.resolve({ data: null, error: null }),
      page1.image_path
        ? supabase.storage
            .from("images")
            .createSignedUrl(page1.image_path, SIGNED_URL_EXPIRY)
        : Promise.resolve({ data: null, error: null }),
    ]);

    console.log("[Preview] Signed URL results:", {
      coverUrlResult: { error: coverUrlResult.error, hasData: !!coverUrlResult.data?.signedUrl },
      page1ImageResult: { error: page1ImageResult.error, hasData: !!page1ImageResult.data?.signedUrl },
      coverImagePath,
      page1ImagePath: page1.image_path,
    });

    // Ensure we have all required data
    if (
      !coverUrlResult.data?.signedUrl ||
      !page1ImageResult.data?.signedUrl ||
      !page1.text_content
    ) {
      console.error("[Preview] Missing preview data:", {
        hasCoverUrl: !!coverUrlResult.data?.signedUrl,
        hasPage1ImageUrl: !!page1ImageResult.data?.signedUrl,
        hasTextContent: !!page1.text_content,
        coverError: coverUrlResult.error,
        page1Error: page1ImageResult.error,
      });
      return null;
    }

    return {
      title,
      coverUrl: coverUrlResult.data.signedUrl,
      page1ImageUrl: page1ImageResult.data.signedUrl,
      page1Text: page1.text_content,
    };
  } catch (error) {
    console.error("Error generating preview data:", error);
    return null;
  }
}
