import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookStatusResponse, ApiError } from "@/lib/types/database";

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/books/[id]
 *
 * Returns the status of a book for polling.
 * Does NOT return storage paths or other sensitive data.
 *
 * Response: {
 *   bookId: string,
 *   status: BookStatus,
 *   errorMessage: string | null,
 *   createdAt: string
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
    .select("id, status, error_message, created_at")
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

  // Return safe public fields only
  // DO NOT return source_photo_path or other sensitive fields
  return NextResponse.json({
    bookId: book.id,
    status: book.status,
    errorMessage: book.error_message,
    createdAt: book.created_at,
  });
}
