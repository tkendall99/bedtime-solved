/**
 * Server-side validation for the Create Book API.
 * Handles FormData parsing and validation.
 */

import { z } from "zod";
import { PHOTO_CONFIG } from "@/lib/constants/storyOptions";

// ============================================================================
// API Request Schema
// ============================================================================

/**
 * Zod schema for validating the text fields of the create book request.
 * Photo validation is handled separately since File objects need special handling in Node.
 */
export const createBookApiSchema = z.object({
  child_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(32, "Name must be 32 characters or less")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  age_band: z.enum(["3-4", "5-6", "7-9"], {
    message: "Please select a valid age range",
  }),

  interests: z
    .array(z.string().min(1).max(30))
    .min(1, "Please select at least 1 interest")
    .max(3, "Please select up to 3 interests"),

  tone: z.enum(["gentle", "funny", "brave"], {
    message: "Please select a valid story tone",
  }),

  moral_lesson: z
    .string()
    .max(140, "Lesson must be 140 characters or less")
    .optional()
    .or(z.literal("")),
});

export type CreateBookApiInput = z.infer<typeof createBookApiSchema>;

// ============================================================================
// Photo Validation
// ============================================================================

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a photo file for type and size constraints.
 * Separate from Zod since File validation works differently on the server.
 */
export function validatePhotoFile(file: File): PhotoValidationResult {
  // Check file type - cast to readonly string array for comparison
  const acceptedTypes = PHOTO_CONFIG.acceptedTypes as readonly string[];
  if (!acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload a JPG, PNG, or WebP image.`,
    };
  }

  // Check file size
  if (file.size > PHOTO_CONFIG.maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${PHOTO_CONFIG.maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

// ============================================================================
// FormData Parsing
// ============================================================================

export interface ParsedFormData {
  fields: CreateBookApiInput;
  photo: File;
}

export interface FormDataParseResult {
  success: boolean;
  data?: ParsedFormData;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldErrors?: any;
}

/**
 * Parses and validates multipart form data from the create book request.
 */
export function parseCreateBookFormData(formData: FormData): FormDataParseResult {
  // Extract text fields
  const rawData = {
    child_name: formData.get("child_name"),
    age_band: formData.get("age_band"),
    interests: formData.get("interests"),
    tone: formData.get("tone"),
    moral_lesson: formData.get("moral_lesson"),
  };

  // Parse interests from JSON string
  let interests: string[] = [];
  if (typeof rawData.interests === "string") {
    try {
      interests = JSON.parse(rawData.interests);
    } catch {
      return {
        success: false,
        error: "Invalid interests format",
      };
    }
  }

  // Build the data object for validation
  const dataToValidate = {
    child_name: rawData.child_name as string,
    age_band: rawData.age_band as string,
    interests,
    tone: rawData.tone as string,
    moral_lesson: (rawData.moral_lesson as string) || undefined,
  };

  // Validate with Zod
  const parseResult = createBookApiSchema.safeParse(dataToValidate);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parseResult.error.flatten(),
    };
  }

  // Extract and validate photo
  const photo = formData.get("photo");
  if (!photo || !(photo instanceof File)) {
    return {
      success: false,
      error: "Photo is required",
    };
  }

  const photoValidation = validatePhotoFile(photo);
  if (!photoValidation.valid) {
    return {
      success: false,
      error: photoValidation.error,
    };
  }

  return {
    success: true,
    data: {
      fields: parseResult.data,
      photo,
    },
  };
}
