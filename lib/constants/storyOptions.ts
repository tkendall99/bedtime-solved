// Centralized constants for story creation options
// Single source of truth for form options used across the app

export const AGE_BANDS = [
  { value: "3-4", label: "3-4 years" },
  { value: "5-6", label: "5-6 years" },
  { value: "7-9", label: "7-9 years" },
] as const;

export const TONES = [
  {
    value: "gentle",
    label: "Gentle",
    description: "Soft, calming, and soothing",
  },
  {
    value: "funny",
    label: "Funny",
    description: "Silly, playful, and giggly",
  },
  {
    value: "brave",
    label: "Brave",
    description: "Adventurous and courageous",
  },
] as const;

export const PRESET_INTERESTS = [
  "Dinosaurs",
  "Space",
  "Unicorns",
  "Pirates",
  "Jungle",
  "Underwater",
  "Princess",
  "Dragons",
  "Cars",
  "Animals",
  "Soccer",
  "Ballet",
] as const;

export const PHOTO_CONFIG = {
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  acceptString: ".jpg,.jpeg,.png,.webp",
  maxSizeBytes: 8 * 1024 * 1024, // 8MB
  maxSizeMB: 8,
} as const;

// Type exports for use elsewhere
export type AgeBand = (typeof AGE_BANDS)[number]["value"];
export type Tone = (typeof TONES)[number]["value"];
