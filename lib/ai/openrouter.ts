/**
 * OpenRouter API client for AI generation.
 * Handles both text and image generation via OpenRouter's unified API.
 *
 * Server-only - never import in client components.
 */

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string; // Can be a URL or base64 data URI
  };
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageGenerationResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content?: string;
      images?: Array<{
        type: "image_url";
        image_url: { url: string }; // base64 data URL
      }>;
    };
  }>;
}

export class OpenRouterError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean = false) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
    this.retryable = retryable;
  }
}

// ============================================================================
// Configuration
// ============================================================================

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT = 120000; // 2 minutes for image generation
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY environment variable is not set",
      500,
      false
    );
  }
  return apiKey;
}

// ============================================================================
// Core Request Function
// ============================================================================

async function makeRequest<T>(
  endpoint: string,
  body: Record<string, unknown>,
  attempt: number = 0
): Promise<T> {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bedtimesolved.com",
        "X-Title": "Bedtime Solved",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      const isRetryable = response.status === 429 || response.status >= 500;

      // Retry if appropriate
      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 4000;
        console.log(
          `OpenRouter request failed (${response.status}), retrying in ${delay}ms...`
        );
        await sleep(delay);
        return makeRequest<T>(endpoint, body, attempt + 1);
      }

      throw new OpenRouterError(
        `OpenRouter API error: ${response.status} - ${errorText}`,
        response.status,
        isRetryable
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof OpenRouterError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterError("Request timed out", 408, true);
    }

    throw new OpenRouterError(
      `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
      500,
      true
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate a chat completion (text generation).
 *
 * @param model - OpenRouter model ID (e.g., "xiaomi/mimo-v2-flash:free")
 * @param messages - Array of chat messages
 * @param options - Optional parameters (temperature, max_tokens)
 * @returns The generated text content
 */
export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  console.log(`[OpenRouter] Chat completion with model: ${model}`);

  const response = await makeRequest<ChatCompletionResponse>(
    "/chat/completions",
    {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1024,
    }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new OpenRouterError("No content in response", 500, false);
  }

  console.log(`[OpenRouter] Chat completion successful, tokens: ${response.usage?.total_tokens ?? "unknown"}`);
  return content;
}

/**
 * Generate an image using a text-to-image or img2img model.
 *
 * @param model - OpenRouter model ID (e.g., "bytedance-seed/seedream-4.5")
 * @param prompt - Text prompt describing the image to generate
 * @param referenceImageBase64 - Optional base64-encoded reference image for img2img
 * @returns Base64-encoded generated image data (without data URI prefix)
 */
export async function generateImage(
  model: string,
  prompt: string,
  referenceImageBase64?: string
): Promise<string> {
  console.log(`[OpenRouter] Image generation with model: ${model}`);

  // Build the content array
  const content: ContentPart[] = [];

  // Add reference image if provided (for img2img)
  if (referenceImageBase64) {
    content.push({
      type: "image_url",
      image_url: {
        url: referenceImageBase64.startsWith("data:")
          ? referenceImageBase64
          : `data:image/png;base64,${referenceImageBase64}`,
      },
    });
  }

  // Add the text prompt
  content.push({
    type: "text",
    text: prompt,
  });

  const response = await makeRequest<ImageGenerationResponse>(
    "/chat/completions",
    {
      model,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      modalities: ["image", "text"],
    }
  );

  // Extract the image from the response (images are in message.images, not message.content)
  const images = response.choices[0]?.message?.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.error("[OpenRouter] Response structure:", JSON.stringify(response, null, 2));
    throw new OpenRouterError("No image in response", 500, false);
  }

  const imageUrl = images[0]?.image_url?.url;
  if (!imageUrl) {
    throw new OpenRouterError("No image URL in response", 500, false);
  }

  // Extract base64 data from data URI if present
  const base64Data = imageUrl.startsWith("data:")
    ? imageUrl.split(",")[1]
    : imageUrl;

  console.log(`[OpenRouter] Image generation successful`);
  return base64Data;
}

// ============================================================================
// Model Constants
// ============================================================================

export const MODELS = {
  TEXT: "xiaomi/mimo-v2-flash:free",
  IMAGE: "bytedance-seed/seedream-4.5",
} as const;
