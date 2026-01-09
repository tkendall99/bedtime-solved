/**
 * API Authentication Utilities
 *
 * Provides authentication helpers for API routes:
 * - Admin API key validation
 * - Supabase user session validation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ApiError = {
  error: string;
};

/**
 * Validates the admin API key from the Authorization header.
 * Returns null if valid, or an error response if invalid.
 *
 * Usage:
 * ```ts
 * const authError = validateAdminApiKey(request);
 * if (authError) return authError;
 * ```
 */
export function validateAdminApiKey(
  request: NextRequest
): NextResponse<ApiError> | null {
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    console.error("[Auth] ADMIN_API_KEY not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const providedKey = authHeader.slice(7); // Remove "Bearer " prefix
  if (providedKey !== adminApiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
  }

  return null; // Auth successful
}

/**
 * Validates that the request has a valid Supabase user session.
 * Returns the user if valid, or an error response if invalid.
 *
 * Usage:
 * ```ts
 * const authResult = await validateUserSession(request);
 * if ('error' in authResult) return authResult.response;
 * const user = authResult.user;
 * ```
 */
export async function validateUserSession(request: NextRequest): Promise<
  | { user: { id: string; email?: string } }
  | { error: string; response: NextResponse<ApiError> }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        error: "Unauthorized",
        response: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    return { user: { id: user.id, email: user.email } };
  } catch (err) {
    console.error("[Auth] Error validating user session:", err);
    return {
      error: "Auth error",
      response: NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Validates that fileExtension only contains safe characters.
 * Prevents path traversal attacks.
 *
 * @param extension - The file extension to validate
 * @returns true if valid, false if potentially malicious
 */
export function isValidFileExtension(extension: string | undefined): boolean {
  if (!extension) return false;
  // Only allow alphanumeric characters (no dots, slashes, etc.)
  return /^[a-zA-Z0-9]+$/.test(extension);
}
