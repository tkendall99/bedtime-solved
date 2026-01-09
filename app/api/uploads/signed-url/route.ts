import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { validateUserSession, isValidFileExtension } from "@/lib/auth/apiAuth";

/**
 * POST /api/uploads/signed-url
 *
 * Creates a signed URL for direct client-side upload to Supabase Storage.
 * This bypasses the 4.5MB Vercel body size limit.
 *
 * Authentication: Requires valid Supabase user session.
 *
 * Request: { fileType: string, fileExtension: string }
 * Response: { signedUrl: string, path: string, bookId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate user is authenticated
    const authResult = await validateUserSession(request);
    if ("error" in authResult) {
      return authResult.response;
    }

    const body = await request.json();
    const { fileType, fileExtension } = body;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file extension to prevent path traversal attacks
    if (!isValidFileExtension(fileExtension)) {
      return NextResponse.json(
        { error: "Invalid file extension. Only alphanumeric extensions are allowed." },
        { status: 400 }
      );
    }

    // Generate a unique book ID for this upload
    const bookId = uuidv4();
    const ext = fileExtension.toLowerCase();
    const path = `${bookId}/source.${ext}`;

    const supabase = createAdminClient();

    // Create signed URL for upload (valid for 5 minutes)
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUploadUrl(path);

    if (error) {
      console.error("Failed to create signed URL:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      bookId,
      token: data.token,
    });
  } catch (error) {
    console.error("Error in signed-url endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
