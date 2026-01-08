import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

// Constants
const JOB_STEP = {
  CHARACTER_SHEET: "character_sheet",
  PAGE1_TEXT: "page1_text",
  ILLUSTRATIONS: "illustrations",
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

// OpenRouter API helper
async function callOpenRouter(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`https://openrouter.ai/api/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bedtime-solved.vercel.app",
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

  const result = await callOpenRouter("chat/completions", {
    model: "xiaomi/mimo-vl-7b-flash:free",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response from story generation");
  }

  const parsed = JSON.parse(content);
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

  // Get signed URL for source photo
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("uploads")
    .createSignedUrl(sourcePhotoPath, 3600);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(`Failed to get signed URL for source photo: ${signedUrlError?.message}`);
  }

  const sourcePhotoUrl = signedUrlData.signedUrl;
  console.log("[CharSheet] Got source photo URL");

  const prompt = `Create a children's storybook character reference sheet based on this child's photo.
Style: Warm, friendly Pixar/Disney-style illustration. Soft features, expressive eyes, gentle smile.
Show: Front view portrait only, simple background, consistent lighting.
Important: Capture the child's likeness (hair color, skin tone, features) in illustration form.
Keep it: Wholesome, age-appropriate, warm color palette suitable for a bedtime story.`;

  const result = await callOpenRouter("images/generations", {
    model: "bytedance-seed/seedream-4.5",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    image: sourcePhotoUrl,
    strength: 0.65,
  });

  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No image URL in character sheet generation response");
  }

  // Download and upload to storage
  console.log("[CharSheet] Downloading generated image...");
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();

  const characterSheetPath = `${bookId}/character_sheet.png`;
  console.log("[CharSheet] Uploading to storage...");

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(characterSheetPath, imageBuffer, {
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

  // Get signed URL for character sheet
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("uploads")
    .createSignedUrl(characterSheetPath, 3600);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error(`Failed to get signed URL for character sheet: ${signedUrlError?.message}`);
  }

  const result = await callOpenRouter("images/generations", {
    model: "bytedance-seed/seedream-4.5",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    image: signedUrlData.signedUrl,
    strength: 0.5,
  });

  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error(`No image URL in response for ${outputFilename}`);
  }

  // Download and upload
  console.log(`[Image] Downloading ${outputFilename}...`);
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  const imageBuffer = await imageBlob.arrayBuffer();

  const outputPath = `${bookId}/${outputFilename}`;
  console.log(`[Image] Uploading ${outputFilename} to storage...`);

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(outputPath, imageBuffer, {
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

      // Move to next step
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.PAGE1_TEXT })
        .eq("id", jobId);

      job.step = JOB_STEP.PAGE1_TEXT;
      book.character_sheet_path = characterSheetPath;
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

      // Insert page 1 text
      await supabase.from("book_pages").upsert({
        book_id: book.id,
        page_number: 1,
        text_content: page1Text,
        page_type: "content",
      });

      // Move to next step
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.ILLUSTRATIONS })
        .eq("id", jobId);

      job.step = JOB_STEP.ILLUSTRATIONS;
    }

    // Step 3: Illustrations
    if (job.step === JOB_STEP.ILLUSTRATIONS) {
      console.log(`[Job ${jobId}] Step 3: Illustrations`);

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

      // Generate cover image
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

      // Generate page 1 illustration
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

      // Move to complete
      await supabase
        .from("book_jobs")
        .update({ step: JOB_STEP.COMPLETE })
        .eq("id", jobId);

      job.step = JOB_STEP.COMPLETE;
    }

    // Step 4: Complete
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

    // Update job with error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const attempts = (job.attempt_count || 0) + 1;

    if (attempts < 3) {
      // Retry
      await supabase
        .from("book_jobs")
        .update({
          status: "queued",
          attempt_count: attempts,
          error_message: errorMessage,
        })
        .eq("id", jobId);
    } else {
      // Mark as failed
      await supabase
        .from("book_jobs")
        .update({
          status: "failed",
          attempt_count: attempts,
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
    }

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

    // Process the job
    const result = await processJob(jobId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
