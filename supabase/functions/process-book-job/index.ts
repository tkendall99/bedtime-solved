import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

// Constants - each image gets its own step to avoid CPU timeout
const JOB_STEP = {
  CHARACTER_SHEET: "character_sheet",
  PAGE1_TEXT: "page1_text",
  COVER_IMAGE: "cover_image",
  PAGE1_IMAGE: "page1_image",
  COMPLETE: "complete",
} as const;

const BOOK_STATUS = {
  DRAFT: "draft",
  GENERATING: "generating",
  PREVIEW_READY: "preview_ready",
  FAILED: "failed",
} as const;

// Create Supabase admin client
function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// OpenRouter API helper - uses chat/completions for both text and images
async function callOpenRouter(body: Record<string, unknown>) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bedtimesolved.com",
      "X-Title": "Bedtime Solved",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to extract JSON from LLM response (handles markdown code blocks)
function extractJson(content: string): string {
  // Remove markdown code blocks if present
  let cleaned = content.trim();

  // Handle ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  return cleaned;
}

// Generate story text using LLM
async function generateStoryText(
  childName: string,
  ageBand: string,
  interests: string[],
  tone: string,
  moralLesson: string | null
): Promise<{ title: string; page1Text: string }> {
  console.log("[Story] Generating story text...");

  const ageDescriptions: Record<string, string> = {
    "3-4": "3-4 years old (very simple sentences, basic vocabulary, 2-3 sentences per page)",
    "5-6": "5-6 years old (simple sentences, some descriptive words, 3-4 sentences per page)",
    "7-9": "7-9 years old (more complex sentences, richer vocabulary, 4-5 sentences per page)",
  };

  const toneDescriptions: Record<string, string> = {
    gentle: "warm, soothing, and reassuring - perfect for bedtime",
    funny: "Pixar-style humor - clever, charming, witty wordplay. Absolutely NO bathroom humor, crude jokes, or anything inappropriate. Think Finding Nemo, Toy Story - smart and family-friendly",
    brave: "adventurous and empowering, with the child overcoming challenges",
  };

  const prompt = `You are a children's book author. Write the FIRST PAGE ONLY of a personalized bedtime story.

CHILD: ${childName}
AGE: ${ageDescriptions[ageBand] || ageBand}
INTERESTS: ${interests.join(", ")}
TONE: ${toneDescriptions[tone] || tone}
${moralLesson ? `LESSON TO WEAVE IN: ${moralLesson}` : ""}

IMPORTANT RULES:
1. The story stars ${childName} as the main character
2. Incorporate their interests naturally into the adventure
3. This is PAGE 1 - set up the story, introduce ${childName}, hint at the adventure to come
4. Match vocabulary and sentence complexity to the age band
5. Make it magical and engaging for bedtime reading

CONTENT SAFETY - NEVER include:
- Bathroom humor or bodily functions
- Scary monsters, villains, or threats
- Violence or conflict
- Anything crude, gross, or inappropriate
- Mean characters or bullying

RESPONSE FORMAT (JSON):
{
  "title": "A creative, engaging book title (e.g., 'Emma's Magical Garden Adventure')",
  "page1Text": "The story text for page 1 only"
}

Return ONLY valid JSON, no other text.`;

  const result = await callOpenRouter({
    model: "xiaomi/mimo-v2-flash:free",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 1024,
  });

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response from story generation");
  }

  // Extract JSON from potential markdown code blocks
  const jsonString = extractJson(content);
  console.log("[Story] Raw response:", content.substring(0, 200));
  console.log("[Story] Extracted JSON:", jsonString.substring(0, 200));

  const parsed = JSON.parse(jsonString);
  console.log("[Story] Generated title:", parsed.title);
  return { title: parsed.title, page1Text: parsed.page1Text };
}

// Generate character sheet from photo (img2img)
async function generateCharacterSheet(
  supabase: ReturnType<typeof createAdminClient>,
  bookId: string,
  sourcePhotoPath: string
): Promise<string> {
  console.log("[CharSheet] Generating character sheet...");

  // Download source photo and convert to base64
  const { data: photoData, error: photoError } = await supabase.storage
    .from("uploads")
    .download(sourcePhotoPath);

  if (photoError || !photoData) {
    throw new Error(`Failed to download source photo: ${photoError?.message}`);
  }

  const photoBuffer = await photoData.arrayBuffer();
  const photoBase64 = arrayBufferToBase64(photoBuffer);
  console.log("[CharSheet] Source photo loaded, size:", photoBuffer.byteLength);

  const prompt = `Create a children's storybook character reference sheet based on this child's photo.
Style: Warm, friendly Pixar/Disney-style illustration. Soft features, expressive eyes, gentle smile.
Show: Front view portrait only, simple background, consistent lighting.
Important: Capture the child's likeness (hair color, skin tone, features) in illustration form.
Keep it: Wholesome, age-appropriate, warm color palette suitable for a bedtime story.`;

  // Use chat/completions with image modality
  const result = await callOpenRouter({
    model: "bytedance-seed/seedream-4.5",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${photoBase64}` },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    modalities: ["image", "text"],
  });

  // Extract the image from the response
  const images = result.choices?.[0]?.message?.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.error("[CharSheet] Response structure:", JSON.stringify(result, null, 2).substring(0, 500));
    throw new Error("No image in character sheet response");
  }

  const imageDataUrl = images[0]?.image_url?.url;
  if (!imageDataUrl) {
    throw new Error("No image URL in response");
  }

  // Extract base64 from data URI
  const base64Data = imageDataUrl.startsWith("data:")
    ? imageDataUrl.split(",")[1]
    : imageDataUrl;

  // Convert base64 to Uint8Array for upload
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const characterSheetPath = `${bookId}/character_sheet.png`;
  console.log("[CharSheet] Uploading to storage...");

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(characterSheetPath, bytes, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload character sheet: ${uploadError.message}`);
  }

  console.log("[CharSheet] Complete:", characterSheetPath);
  return characterSheetPath;
}

// Generate illustration using character reference
async function generateIllustration(
  supabase: ReturnType<typeof createAdminClient>,
  bookId: string,
  characterSheetPath: string,
  prompt: string,
  outputFilename: string
): Promise<string> {
  console.log(`[Image] Generating ${outputFilename}...`);

  // Download character sheet and convert to base64
  const { data: charData, error: charError } = await supabase.storage
    .from("uploads")
    .download(characterSheetPath);

  if (charError || !charData) {
    throw new Error(`Failed to download character sheet: ${charError?.message}`);
  }

  const charBuffer = await charData.arrayBuffer();
  const charBase64 = arrayBufferToBase64(charBuffer);

  // Use chat/completions with image modality
  const result = await callOpenRouter({
    model: "bytedance-seed/seedream-4.5",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${charBase64}` },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    modalities: ["image", "text"],
  });

  // Extract the image from the response
  const images = result.choices?.[0]?.message?.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.error(`[Image] Response structure for ${outputFilename}:`, JSON.stringify(result, null, 2).substring(0, 500));
    throw new Error(`No image in response for ${outputFilename}`);
  }

  const imageDataUrl = images[0]?.image_url?.url;
  if (!imageDataUrl) {
    throw new Error(`No image URL in response for ${outputFilename}`);
  }

  // Extract base64 from data URI
  const base64Data = imageDataUrl.startsWith("data:")
    ? imageDataUrl.split(",")[1]
    : imageDataUrl;

  // Convert base64 to Uint8Array for upload
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const outputPath = `${bookId}/${outputFilename}`;
  console.log(`[Image] Uploading ${outputFilename} to storage...`);

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(outputPath, bytes, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload ${outputFilename}: ${uploadError.message}`);
  }

  console.log(`[Image] Complete: ${outputPath}`);
  return outputPath;
}

// Main job processor
async function processJob(jobId: string) {
  const supabase = createAdminClient();
  console.log(`[Job ${jobId}] Starting processing...`);

  // Fetch job with book data
  const { data: job, error: fetchError } = await supabase
    .from("book_jobs")
    .select("*, books(*)")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    throw new Error(`Failed to fetch job: ${fetchError?.message}`);
  }

  const book = job.books;
  if (!book) {
    throw new Error("Job has no associated book");
  }

  console.log(`[Job ${jobId}] Processing book: ${book.child_name}`);

  try {
    // Update book status to generating
    await supabase
      .from("books")
      .update({ status: BOOK_STATUS.GENERATING })
      .eq("id", book.id);

    // Step 1: Character Sheet
    if (job.step === JOB_STEP.CHARACTER_SHEET) {
      console.log(`[Job ${jobId}] Step 1: Character Sheet`);

      const characterSheetPath = await generateCharacterSheet(
        supabase,
        book.id,
        book.source_photo_path
      );

      // Update book with character sheet path
      await supabase
        .from("books")
        .update({ character_sheet_path: characterSheetPath })
        .eq("id", book.id);

      // Move to next step and return - next invocation will continue
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.PAGE1_TEXT, status: "queued" })
        .eq("id", jobId);

      return { success: true, step: "character_sheet", bookId: book.id };
    }

    // Step 2: Page 1 Text
    if (job.step === JOB_STEP.PAGE1_TEXT) {
      console.log(`[Job ${jobId}] Step 2: Story Text`);

      const { title, page1Text } = await generateStoryText(
        book.child_name,
        book.age_band,
        book.interests,
        book.tone,
        book.moral_lesson
      );

      // Update book with title
      await supabase
        .from("books")
        .update({ title })
        .eq("id", book.id);

      // Insert or update page 1 text
      // First try to get existing row
      const { data: existingPage } = await supabase
        .from("book_pages")
        .select("id")
        .eq("book_id", book.id)
        .eq("page_number", 1)
        .single();

      if (existingPage) {
        // Update existing row
        await supabase
          .from("book_pages")
          .update({ text_content: page1Text })
          .eq("id", existingPage.id);
        console.log(`[Job ${jobId}] Updated existing page 1`);
      } else {
        // Insert new row
        await supabase.from("book_pages").insert({
          book_id: book.id,
          page_number: 1,
          text_content: page1Text,
          page_type: "content",
        });
        console.log(`[Job ${jobId}] Inserted new page 1`);
      }

      // Move to next step and return - next invocation will continue
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.COVER_IMAGE, status: "queued" })
        .eq("id", jobId);

      return { success: true, step: "page1_text", bookId: book.id };
    }

    // Step 3: Cover Image (separate step to avoid CPU timeout)
    if (job.step === JOB_STEP.COVER_IMAGE) {
      console.log(`[Job ${jobId}] Step 3: Cover Image`);

      const characterSheetPath = book.character_sheet_path;
      if (!characterSheetPath) {
        throw new Error("Character sheet path missing");
      }

      const coverPrompt = `Children's storybook cover illustration featuring a ${book.age_band} year old child.
Style: Warm, magical Pixar/Disney quality. Golden hour lighting, soft colors.
Scene: The child as the hero, with ${book.interests.join(", ")} themed elements.
Mood: ${book.tone === "gentle" ? "Peaceful and dreamy" : book.tone === "brave" ? "Adventurous and exciting" : "Fun and playful"}
IMPORTANT: NO TEXT, NO LETTERS, NO WORDS, NO TITLE - pure illustration only.
Use the reference to maintain the child's likeness.`;

      const coverPath = await generateIllustration(
        supabase,
        book.id,
        characterSheetPath,
        coverPrompt,
        "cover.png"
      );

      // Update book with cover path
      await supabase
        .from("books")
        .update({ cover_image_path: coverPath })
        .eq("id", book.id);

      // Move to next step and return - next invocation will continue
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.PAGE1_IMAGE, status: "queued" })
        .eq("id", jobId);

      return { success: true, step: "cover_image", bookId: book.id };
    }

    // Step 4: Page 1 Image (separate step to avoid CPU timeout)
    if (job.step === JOB_STEP.PAGE1_IMAGE) {
      console.log(`[Job ${jobId}] Step 4: Page 1 Image`);

      const characterSheetPath = book.character_sheet_path;
      if (!characterSheetPath) {
        throw new Error("Character sheet path missing");
      }

      // Fetch page 1 text for context
      const { data: page1 } = await supabase
        .from("book_pages")
        .select("text_content")
        .eq("book_id", book.id)
        .eq("page_number", 1)
        .single();

      const page1Text = page1?.text_content || "";

      const page1Prompt = `Children's storybook interior illustration.
Story context: "${page1Text}"
Style: Warm, friendly Pixar/Disney style matching a ${book.tone} bedtime story.
The child should match the reference image.
Scene should illustrate the story text naturally.
Soft, warm lighting suitable for bedtime reading.`;

      const page1ImagePath = await generateIllustration(
        supabase,
        book.id,
        characterSheetPath,
        page1Prompt,
        "page_01.png"
      );

      // Update page 1 with image path
      await supabase
        .from("book_pages")
        .update({ image_path: page1ImagePath })
        .eq("book_id", book.id)
        .eq("page_number", 1);

      // Move to complete step and return - next invocation will finalize
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.COMPLETE, status: "queued" })
        .eq("id", jobId);

      return { success: true, step: "page1_image", bookId: book.id };
    }

    // Step 5: Complete
    if (job.step === JOB_STEP.COMPLETE) {
      console.log(`[Job ${jobId}] Marking complete`);

      await supabase
        .from("book_jobs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", jobId);

      await supabase
        .from("books")
        .update({ status: BOOK_STATUS.PREVIEW_READY })
        .eq("id", book.id);

      console.log(`[Job ${jobId}] SUCCESS! Preview ready for ${book.child_name}`);
    }

    return { success: true, bookId: book.id };
  } catch (error) {
    console.error(`[Job ${jobId}] ERROR:`, error);

    // Update job with error - mark as failed
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("book_jobs")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", jobId);

    await supabase
      .from("books")
      .update({
        status: BOOK_STATUS.FAILED,
        error_message: errorMessage,
      })
      .eq("id", book.id);

    throw error;
  }
}

// HTTP handler
Deno.serve(async (req: Request) => {
  console.log("[Edge Function] Request received");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    const body = await req.json();
    console.log("[Edge Function] Request body:", JSON.stringify(body));

    // Support both direct job_id and webhook payload
    let jobId = body.job_id;

    // If this is a database webhook, extract from record
    if (body.type === "INSERT" && body.record) {
      jobId = body.record.id;
      console.log("[Edge Function] Webhook trigger for job:", jobId);
    }

    if (!jobId) {
      // No specific job - find next queued job
      const supabase = createAdminClient();
      const { data: nextJob, error } = await supabase
        .from("book_jobs")
        .select("id")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error || !nextJob) {
        return new Response(JSON.stringify({ message: "No queued jobs" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      jobId = nextJob.id;
    }

    // Claim the job
    const supabase = createAdminClient();
    const { data: claimed, error: claimError } = await supabase
      .from("book_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("status", "queued")
      .select()
      .single();

    if (claimError || !claimed) {
      return new Response(
        JSON.stringify({ message: "Job already claimed or not found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Edge Function] Claimed job:", jobId);

    // Process one step of the job
    const result = await processJob(jobId);
    console.log("[Edge Function] Step completed:", result);

    // Check if there's more work to do (job is queued for next step)
    const { data: updatedJob } = await supabase
      .from("book_jobs")
      .select("status")
      .eq("id", jobId)
      .single();

    // If job is queued (has more steps), trigger next step via self-call
    const continueProcessing = updatedJob?.status === "queued";

    if (continueProcessing) {
      console.log("[Edge Function] More steps to process, triggering next step...");

      // Make async call to self to continue processing
      const selfCallPromise = fetch(
        `${SUPABASE_URL}/functions/v1/process-book-job`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ job_id: jobId }),
        }
      ).catch((err) => console.error("[Edge Function] Self-call error:", err));

      // Use waitUntil to ensure the call completes
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(selfCallPromise);
      }
    }

    // Return success
    return new Response(
      JSON.stringify({
        message: continueProcessing ? "Step completed, continuing..." : "Job completed",
        step: result.step,
        jobId: jobId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Edge Function] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
