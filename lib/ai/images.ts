/**
 * Image generation module.
 * Uses Seedream 4.5 for character sheets and illustrations.
 *
 * Server-only - never import in client components.
 */

import { generateImage, MODELS } from "./openrouter";
import type { Tone } from "@/lib/types/database";

// ============================================================================
// Types
// ============================================================================

export interface CharacterSheetInput {
  sourcePhotoBase64: string;
  childName: string;
}

export interface CoverImageInput {
  characterSheetBase64: string;
  childName: string;
  tone: Tone;
  interests: string[];
}

export interface PageIllustrationInput {
  characterSheetBase64: string;
  illustrationPrompt: string;
  pageNumber: number;
}

// ============================================================================
// Style Constants
// ============================================================================

const BASE_STYLE = `
Style: Warm, friendly children's book illustration
Art direction: Soft watercolor meets digital art
Color palette: Bright, cheerful colors with warm undertones
Lighting: Soft, golden hour glow
Character rendering: Friendly, approachable features with expressive eyes
Background: Dreamy, slightly blurred, storybook atmosphere
Quality: Professional children's book illustration quality, high detail
`.trim();

const TONE_MOODS: Record<Tone, string> = {
  gentle: "Serene, cozy, bedtime warmth. Soft pastels, calm expressions, peaceful atmosphere.",
  funny: "Playful, energetic, silly expressions. Bright saturated colors, dynamic poses, whimsical details.",
  brave: "Bold, adventurous, heroic poses. Strong colors, dramatic lighting, empowering composition.",
};

// ============================================================================
// Character Sheet Generation
// ============================================================================

/**
 * Generate a character sheet from the source photo.
 * Creates a consistent character reference for use in all illustrations.
 *
 * @param input - Source photo and child name
 * @returns Base64-encoded character sheet image
 */
export async function generateCharacterSheet(
  input: CharacterSheetInput
): Promise<string> {
  console.log(`[Images] Generating character sheet for ${input.childName}`);

  const prompt = `
Create a children's book character reference sheet based on this child's photo.

CHARACTER: ${input.childName}

REQUIREMENTS:
- Transform the child into an illustrated storybook character
- Keep recognizable features: face shape, hair color/style, eye color
- Style: Friendly, warm, Pixar/Disney-inspired 2D illustration
- Show: Front-facing portrait, 3/4 view, and a happy expression
- Background: Clean white or very light background
- Expression: Warm, friendly smile, bright expressive eyes
- Proportions: Slightly stylized but recognizable

${BASE_STYLE}

This character sheet will be used as a reference to maintain consistency across all book illustrations.
`.trim();

  const imageBase64 = await generateImage(
    MODELS.IMAGE,
    prompt,
    input.sourcePhotoBase64
  );

  console.log(`[Images] Character sheet generated successfully`);
  return imageBase64;
}

// ============================================================================
// Cover Image Generation
// ============================================================================

/**
 * Generate the book cover image.
 *
 * @param input - Character sheet and book details
 * @returns Base64-encoded cover image
 */
export async function generateCoverImage(
  input: CoverImageInput
): Promise<string> {
  console.log(`[Images] Generating cover for ${input.childName}`);

  const primaryInterest = input.interests[0];
  const secondaryInterests = input.interests.slice(1).join(" and ");

  const prompt = `
Create a children's book COVER illustration.

HERO CHARACTER: ${input.childName} (use the provided character reference for exact likeness)

SCENE:
- ${input.childName} as the central hero figure
- Theme: ${primaryInterest}${secondaryInterests ? `, with elements of ${secondaryInterests}` : ""}
- Mood: ${TONE_MOODS[input.tone]}
- The child looks confident, excited, ready for adventure

COMPOSITION:
- Character prominently centered
- Leave space at top for title text
- Magical, inviting atmosphere
- Eye-catching, makes you want to read the book

${BASE_STYLE}

CRITICAL: The character MUST match the provided reference sheet exactly - same face, hair, features.
`.trim();

  const imageBase64 = await generateImage(
    MODELS.IMAGE,
    prompt,
    input.characterSheetBase64
  );

  console.log(`[Images] Cover generated successfully`);
  return imageBase64;
}

// ============================================================================
// Page Illustration Generation
// ============================================================================

/**
 * Generate an illustration for a story page.
 *
 * @param input - Character sheet and scene description
 * @returns Base64-encoded page illustration
 */
export async function generatePageIllustration(
  input: PageIllustrationInput
): Promise<string> {
  console.log(`[Images] Generating illustration for page ${input.pageNumber}`);

  const prompt = `
Create a children's book page illustration.

PAGE: ${input.pageNumber}

SCENE DESCRIPTION:
${input.illustrationPrompt}

REQUIREMENTS:
- The main child character MUST match the provided reference sheet exactly
- Scene should be warm, inviting, and age-appropriate
- Leave some margin space for text overlay
- Professional children's book illustration quality

${BASE_STYLE}

CRITICAL: Maintain exact character likeness from the reference sheet - same face, hair, features, expressions style.
`.trim();

  const imageBase64 = await generateImage(
    MODELS.IMAGE,
    prompt,
    input.characterSheetBase64
  );

  console.log(`[Images] Page ${input.pageNumber} illustration generated`);
  return imageBase64;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a Buffer to base64 string.
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

/**
 * Convert base64 string to Buffer.
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}
