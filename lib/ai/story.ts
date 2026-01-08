/**
 * Story text generation module.
 * Uses LLM to generate age-appropriate story text for children's books.
 *
 * Server-only - never import in client components.
 */

import { chatCompletion, MODELS } from "./openrouter";
import type { AgeBand, Tone } from "@/lib/types/database";

// ============================================================================
// Types
// ============================================================================

export interface StoryGenerationInput {
  childName: string;
  ageBand: AgeBand;
  interests: string[];
  tone: Tone;
  moralLesson: string | null;
}

export interface StoryGenerationOutput {
  bookTitle: string;
  storyText: string;
  illustrationPrompt: string;
}

// ============================================================================
// Prompt Building
// ============================================================================

const AGE_GUIDELINES: Record<AgeBand, string> = {
  "3-4":
    "Use very simple words (2-3 syllables max), short sentences (5-8 words), familiar everyday concepts. Repetition is good. Focus on colors, animals, and simple actions.",
  "5-6":
    "Use simple vocabulary with occasional new words, sentences up to 10 words, introduce mild challenges and small adventures. Include emotions and friendships.",
  "7-9":
    "Use richer vocabulary, longer descriptive sentences, more plot complexity. Include problem-solving, courage, and character growth.",
};

const TONE_DESCRIPTIONS: Record<Tone, string> = {
  gentle:
    "Warm, soft, and comforting. Use soothing language that creates a safe, cozy atmosphere. Perfect for bedtime.",
  funny:
    "Playful, silly, and fun. Include light humor, funny situations, and amusing descriptions that make children giggle.",
  brave:
    "Adventurous and empowering. The child faces challenges with courage. Use exciting action words and triumphant moments.",
};

function buildSystemPrompt(ageBand: AgeBand): string {
  return `You are a beloved children's book author who writes engaging, age-appropriate stories that children love.

For ages ${ageBand}:
${AGE_GUIDELINES[ageBand]}

Your writing style:
- Make the child the HERO of their own story
- Use their name naturally throughout the narrative
- Create vivid, imaginable scenes
- End each page with a hook that makes them want more
- Write in present tense for immediacy

IMPORTANT: You must respond ONLY with valid JSON. No markdown, no explanation, just the JSON object.`;
}

function buildUserPrompt(input: StoryGenerationInput): string {
  const { childName, ageBand, interests, tone, moralLesson } = input;
  const primaryInterest = interests[0];

  return `Write the FIRST PAGE of a personalized children's storybook.

CHILD DETAILS:
- Name: ${childName}
- Age: ${ageBand} years old
- Interests: ${interests.join(", ")}
- Preferred tone: ${tone} (${TONE_DESCRIPTIONS[tone]})
${moralLesson ? `- Lesson to weave in: ${moralLesson}` : ""}

REQUIREMENTS:
1. Create a catchy, memorable BOOK TITLE that:
   - Includes ${childName}'s name
   - Sounds like a real children's book (e.g., "${childName} and the Magic Castle", "${childName}'s Big Adventure")
   - Relates to their interests (${primaryInterest})
   - Is short (2-6 words max)
2. Write 1-3 sentences ONLY (this is just page 1 of a longer book)
3. Introduce ${childName} as the main character doing something exciting
4. Feature their primary interest (${primaryInterest}) prominently
5. Match the ${tone} tone throughout
6. End with something that makes the reader want to turn the page
7. Also create a detailed illustration prompt describing the scene

RESPOND WITH THIS EXACT JSON FORMAT:
{
  "bookTitle": "A catchy book title including the child's name...",
  "storyText": "The story text for page 1...",
  "illustrationPrompt": "A detailed visual description of the scene for an illustrator..."
}`;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate page 1 story text and illustration prompt.
 *
 * @param input - Child details and story preferences
 * @returns Story text and illustration prompt
 */
export async function generatePage1Story(
  input: StoryGenerationInput
): Promise<StoryGenerationOutput> {
  console.log(
    `[Story] Generating page 1 for ${input.childName} (${input.ageBand})`
  );

  const systemPrompt = buildSystemPrompt(input.ageBand);
  const userPrompt = buildUserPrompt(input);

  const response = await chatCompletion(
    MODELS.TEXT,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      temperature: 0.8, // Slightly creative
      max_tokens: 512,
    }
  );

  // Parse the JSON response
  const result = parseStoryResponse(response, input.childName);

  console.log(
    `[Story] Generated "${result.bookTitle}" - story (${result.storyText.length} chars): "${result.storyText.substring(0, 50)}..."`
  );

  return result;
}

/**
 * Parse and validate the LLM response.
 */
function parseStoryResponse(response: string, childName: string): StoryGenerationOutput {
  // Try to extract JSON from the response (handle markdown code blocks)
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof parsed.bookTitle !== "string" ||
      parsed.bookTitle.length < 3
    ) {
      // Fallback: generate a simple title if missing
      parsed.bookTitle = `${childName}'s Adventure`;
    }
    if (
      typeof parsed.storyText !== "string" ||
      parsed.storyText.length < 10
    ) {
      throw new Error("Invalid or missing storyText");
    }
    if (
      typeof parsed.illustrationPrompt !== "string" ||
      parsed.illustrationPrompt.length < 10
    ) {
      throw new Error("Invalid or missing illustrationPrompt");
    }

    return {
      bookTitle: parsed.bookTitle.trim(),
      storyText: parsed.storyText.trim(),
      illustrationPrompt: parsed.illustrationPrompt.trim(),
    };
  } catch (error) {
    console.error("[Story] Failed to parse response:", response);
    throw new Error(
      `Failed to parse story response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
