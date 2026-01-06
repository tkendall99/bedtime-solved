import { z } from "zod";
import { PHOTO_CONFIG } from "@/lib/constants/storyOptions";

// Custom file validation for client-side (File object)
const photoSchema = z
  .instanceof(File, { message: "Please upload a photo" })
  .refine(
    (file) =>
      (PHOTO_CONFIG.acceptedTypes as readonly string[]).includes(file.type),
    {
      message: "Please upload a JPG, PNG, or WebP image",
    }
  )
  .refine((file) => file.size <= PHOTO_CONFIG.maxSizeBytes, {
    message: `Photo must be smaller than ${PHOTO_CONFIG.maxSizeMB}MB`,
  });

export const createBookSchema = z.object({
  // Child Details
  childName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(32, "Name must be 32 characters or less")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  ageBand: z.enum(["3-4", "5-6", "7-9"], {
    message: "Please select an age range",
  }),

  interests: z
    .array(z.string().min(1).max(30))
    .min(1, "Please select at least 1 interest")
    .max(3, "Please select up to 3 interests"),

  // Story Preferences
  tone: z.enum(["gentle", "funny", "brave"], {
    message: "Please select a story tone",
  }),

  lesson: z
    .string()
    .max(140, "Lesson must be 140 characters or less")
    .optional()
    .or(z.literal("")),

  // Photo
  photo: photoSchema,
});

// Infer TypeScript type from schema
export type CreateBookFormData = z.infer<typeof createBookSchema>;

// Type for sessionStorage (photo stored as dataURL)
export type CreateBookFormStorage = Omit<CreateBookFormData, "photo"> & {
  photoDataUrl: string;
  photoName: string;
  photoType: string;
};
