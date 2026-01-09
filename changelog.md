# Changelog

## [0.6.2] - 2026-01-09

### Fixed - Improved Error Handling for AI Generation

**Issue:** When OpenRouter returned a 502 error with Cloudflare HTML error page, the raw HTML was passed to the user as an error message (ugly and unhelpful).

**Fixes:**

1. **Retry Logic** - Added automatic retry with exponential backoff for transient errors:
   - 3 retries with delays: 1s, 2s, 4s
   - Retries on 429 (rate limit) and 5xx errors

2. **HTML Response Detection** - Detects Cloudflare/proxy error pages that return HTML instead of JSON

3. **Clean Error Messages** - User-friendly messages instead of raw HTML:
   - "AI service temporarily unavailable (502). Please try again in a moment."
   - "AI service error (500). Please try again."

**Changes:**
- `supabase/functions/process-book-job/index.ts`:
  - Added `isHtmlResponse()` helper to detect HTML error pages
  - Added `cleanErrorMessage()` to format user-friendly errors
  - Added retry logic to `callOpenRouter()` function

---

## [0.6.1] - 2026-01-09

### Feature - Anonymous Authentication for Preview Flow

**Goal:** Allow users to create book previews without signing in, while maintaining security.

**Implementation:**
- Added `AuthProvider` component with automatic anonymous sign-in
- Users get an invisible anonymous session when visiting the app
- Anonymous users can create previews without manual login
- When ready to pay, users can convert to permanent account

**New Files:**
- `lib/auth/AuthProvider.tsx` - Context provider with anonymous auth logic

**Changes:**
- `app/layout.tsx` - Wrapped app with AuthProvider
- `components/create/CreateBookForm.tsx` - Added auth-ready state handling

**Required Setup:**
1. Enable "Anonymous Sign-ins" in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable "Allow anonymous sign-ins"

---

## [0.6.0] - 2026-01-09

### Security - Critical API Authentication Fixes

**Issue:** Multiple API endpoints lacked proper authentication, allowing unauthorized access.

**Fixes:**

1. **Admin endpoint authentication** (`/api/admin/jobs/process-next`)
   - Added API key authentication via `ADMIN_API_KEY` environment variable
   - Requires `Authorization: Bearer <key>` header
   - Returns 401/403 for invalid/missing credentials

2. **Path traversal vulnerability** (`/api/uploads/signed-url`)
   - Added validation for `fileExtension` parameter
   - Only alphanumeric extensions allowed (prevents `../` attacks)

3. **User authentication on book creation** (`/api/books`)
   - Added Supabase auth session validation
   - Books now linked to authenticated user via `user_id` column
   - Returns 401 for unauthenticated requests

4. **User authentication on signed URL generation** (`/api/uploads/signed-url`)
   - Added Supabase auth session validation
   - Prevents unauthorized file uploads

**New Files:**
- `lib/auth/apiAuth.ts` - Authentication utilities for API routes
- `.env.example` - Template for required environment variables

**Database Migration:**
- Added `user_id` column to `books` table (references `auth.users`)
- Added RLS policies for user-based access control
- Created index on `user_id` for performance

**Required Actions:**
1. Set `ADMIN_API_KEY` in Vercel environment variables (generate with `openssl rand -hex 32`)
2. Ensure Supabase Auth is configured for your app
3. Migration is auto-applied; existing books will have NULL user_id

---

## [0.5.6] - 2026-01-09

### Security - Fix Exposed Service Role Key (GitGuardian Alert)

**Issue:** #9 - The Supabase service role JWT was accidentally committed to the repository in migration `20260108_trigger_edge_function.sql`, triggering a GitGuardian alert.

**Root Cause:** The database trigger function for calling the Edge Function had the service role key hardcoded directly in the SQL instead of using secure secret storage.

**Fix:**
1. Created new migration `20260109_fix_secret_use_vault.sql` that updates the trigger function to read the service role key from Supabase Vault instead of having it hardcoded
2. Updated the original migration file to remove the exposed secret from the codebase

**Required Actions (Manual):**
1. **CRITICAL**: Rotate the service role key in Supabase Dashboard:
   - Go to Settings > API > Service Role Key > Regenerate
2. Store the new key in Vault by running this SQL in the Supabase SQL Editor:
   ```sql
   SELECT vault.create_secret('your-new-service-role-key', 'service_role_key');
   ```

**Security Best Practice:** Secrets should always be stored in Supabase Vault and accessed via `vault.decrypted_secrets`, never hardcoded in SQL functions or migrations.

---

## [0.5.5] - 2026-01-08

### Fixed - Preview API Column Names (Regression Fix)

**Issue:** Preview page showed "couldn't load preview images" error for ALL books.

**Root Cause:** Version 0.5.2 incorrectly "fixed" column names, swapping them the wrong way:
- API was using `text_content`, `image_path` (wrong)
- Schema has `story_text`, `illustration_path` (correct)

**Fix:** Corrected column names in two places:

1. `app/api/books/[id]/route.ts` (API route)
2. `supabase/functions/process-book-job/index.ts` (Edge Function)

Changes:
- `text_content` → `story_text`
- `image_path` → `illustration_path`

The Edge Function bug caused pages to not be inserted (wrong column names, errors not checked).

---

## [0.5.4] - 2026-01-08

### Fixed - Page Data Insert/Update Logic

**Issue:** The upsert for book_pages didn't handle existing rows correctly, potentially causing missing data.

**Fix:** Changed from `upsert` to explicit check-then-insert/update pattern:
- Check if page exists by (book_id, page_number)
- Update if exists, insert if not
- More reliable for retry scenarios

---

## [0.5.3] - 2026-01-08

### Fixed - JSON Parse Error in Story Generation

**Issue:** Edge Function failed with "Unexpected token '\`'" error when generating story text.

**Root Cause:** The LLM (xiaomi/mimo-v2-flash:free) sometimes returns JSON wrapped in markdown code blocks:
```
```json
{"title": "...", "page1Text": "..."}
```
```

**Fix:** Added `extractJson()` helper function that strips markdown code blocks before parsing the JSON response.

---

## [0.5.2] - 2026-01-08

### Fixed - Preview Images Not Loading

**Issue:** Preview page showed "couldn't load preview images" error even though generation succeeded.

**Root Cause:** The API route `app/api/books/[id]/route.ts` was querying the wrong column names from the `book_pages` table.

**Fix:** Updated column names to match the actual schema:
- `story_text` → `text_content`
- `illustration_path` → `image_path`

---

## [0.5.1] - 2026-01-08

### Fixed - Edge Function CPU Timeout

**Issue:** Supabase Edge Functions have CPU time limits. Generating multiple images in one invocation exceeded the limit, causing "CPU Time exceeded" errors.

#### Solution: Step-Based Processing
Each image generation now runs in a separate Edge Function invocation:
- Step 1: `character_sheet` - Generate character reference from photo
- Step 2: `page1_text` - Generate story text and title
- Step 3: `cover_image` - Generate book cover illustration
- Step 4: `page1_image` - Generate page 1 illustration
- Step 5: `complete` - Mark job as complete

After each step completes, the function calls itself to continue processing the next step.

**Database Changes:**
- Updated `book_jobs.step` constraint to allow new step values
- Migrated existing jobs from old step names to new ones

---

## [0.5.0] - 2026-01-08

### Added - Supabase Edge Function for Job Processing

**Issue:** Vercel Hobby plan has a 10-second timeout, but AI image generation takes 20-60 seconds per image. Jobs were getting stuck on the "illustrations" step.

#### Solution: Supabase Edge Function
Edge Functions run on Deno with a 150-second timeout, bypassing Vercel's limitations entirely.

**New Files:**
- `supabase/functions/process-book-job/index.ts` - Complete job processor that runs in Supabase Edge Functions

**Changes:**
- Removed `after()` callback from `POST /api/books` - no longer needed
- Job processing now triggered by Supabase database webhook on INSERT to `book_jobs`
- Added `supabase/` directory with project configuration

**Edge Function Features:**
- Claims and processes queued jobs
- Generates character sheet from uploaded photo
- Generates story text via OpenRouter LLM
- Generates cover and page 1 illustrations
- Uploads all assets to Supabase Storage
- Automatic retry on failure (up to 3 attempts)
- Full error handling and status updates

**Setup Required:**
1. Edge Function deployed via Supabase CLI
2. `OPENROUTER_API_KEY` secret set in Supabase
3. Database webhook needed: trigger `process-book-job` on INSERT to `book_jobs`

---

## [0.4.5] - 2026-01-08

### Fixed - Photo Upload (413 Payload Too Large)

**Issue:** Photo uploads were failing with HTTP 413 error due to Vercel's 4.5MB body size limit.

#### Solution: Client-side Direct Upload
Instead of sending the photo through the API, we now upload directly to Supabase Storage:

1. **New endpoint: `POST /api/uploads/signed-url`**
   - Generates a pre-signed upload URL for Supabase Storage
   - Creates a unique bookId for the upload path
   - Returns: `{ signedUrl, path, bookId, token }`

2. **Updated form submission flow:**
   - Step 1: Get signed URL from API
   - Step 2: Upload photo directly to Supabase Storage (bypasses Vercel)
   - Step 3: Create book record via API with storage path (no file, just JSON)

3. **Updated `POST /api/books`:**
   - Now accepts JSON body instead of multipart FormData
   - Expects `bookId` and `source_photo_path` (photo already uploaded)
   - Verifies photo exists in storage before creating book
   - Much faster since no file transfer through API

#### Also Fixed
- Toast notifications now working (added `<Toaster />` to layout)
- Better error messages for various failure scenarios

---

## [0.4.4] - 2026-01-08

### Fixed - Content Safety and Title Styling

#### Content Guardrails
- Added strict content safety rules to story generation
- Blocked bathroom humor, crude language, scary content, inappropriate themes
- "Funny" tone now generates Pixar-style humor (clever/charming, never crude)
- Explicit list of banned content types in system prompt

#### Improved Title Typography
- Storybook-style hand-painted typography effect
- Rich terracotta brown color (#8B4513)
- Multi-layered shadows for depth (cream highlight, tan mid-tone, dark shadow, ambient glow)
- Heavier font weight (font-black) for chunky storybook feel
- Subtle stroke effect for painted edge appearance

---

## [0.4.3] - 2026-01-08

### Fixed - Book Titles and Cover Text

**Issue:** AI image models generate garbled text (e.g., "The w of the sprfecalrter's and and title text.")

#### Solution
- LLM now generates proper book titles (e.g., "Emma's Pirate Adventure", "Tom and the Magic Submarine")
- Cover images are generated WITHOUT any text - prompt explicitly forbids text/letters/words
- Title is overlaid programmatically in the preview UI using CSS (always perfect rendering)
- Added `title` column to books table to store generated titles

#### Changes
- `lib/ai/story.ts` - Now returns `bookTitle` in addition to story text
- `lib/ai/images.ts` - Cover prompt explicitly says "NO TEXT, NO LETTERS, NO WORDS"
- `server/jobs/processNextJob.ts` - Saves generated title to database
- `app/api/books/[id]/route.ts` - Returns title in preview response
- `components/create/BookPreviewCard.tsx` - Overlays title on cover image
- Database migration: Added `title` column to books table

---

## [0.4.2] - 2026-01-08

### Added - Automatic Job Processing

**Feature:** Jobs now start automatically when a book is created

#### Changes
- `POST /api/books` now triggers job processing using Next.js `after()` API
- Background work runs after response is sent but function stays alive on Vercel
- No manual intervention needed - generation starts immediately after book creation
- Users see the generating stepper, then preview appears automatically when ready

#### Technical Note
- Initial fire-and-forget implementation didn't work on Vercel serverless (function terminated before fetch completed)
- Fixed by using `after()` from `next/server` which schedules work post-response while keeping the function alive

---

## [0.4.1] - 2026-01-08

### Added - Preview Page UI

**Feature:** Display generated book preview when status is `preview_ready`

#### New Component
- `components/create/BookPreviewCard.tsx` - Magical storybook preview display
  - Cover image with realistic book styling (spine shadow, page edges, 3D effect)
  - Open book spread with page 1 illustration and story text
  - Fraunces font for story text with decorative drop cap
  - Image loading states with skeleton placeholders
  - Responsive design (stacked mobile, side-by-side desktop)
  - Subtle animations for delight (fade-in, floating sparkles)
  - "Continue to Checkout" CTA button

#### Preview Page Updates
- Added preview state to capture API response data
- Renders BookPreviewCard when status is `preview_ready`
- Fallback UI if preview images fail to load

## [0.4.0] - 2026-01-07

### Added - Generation Worker v1 (Character Sheet + Preview Cover/Page1)

**Issue:** #7 - Create Book Flow - Generation Worker v1 (Character Sheet + Preview Cover/Page1)

#### AI Integration
- `lib/ai/openrouter.ts` - Shared OpenRouter HTTP client with retry logic and error handling
- `lib/ai/story.ts` - Story text generation using `xiaomi/mimo-v2-flash:free`
- `lib/ai/images.ts` - Image generation using `bytedance-seed/seedream-4.5` (supports img2img)
- Age-appropriate prompts for story generation (3-4, 5-6, 7-9 age bands)
- Character sheet generation from uploaded photo for likeness consistency
- Cover and page illustration generation with character reference

#### Job Processing
- `server/jobs/processNextJob.ts` - Core job processor logic
- Claims queued jobs with optimistic locking to prevent concurrent processing
- Step-by-step generation: character sheet -> page 1 story -> cover + page 1 images
- Automatic retry on failure (up to 3 attempts)
- Error tracking and status updates throughout pipeline

#### API Endpoints
- `POST /api/admin/jobs/process-next` - Admin endpoint to manually trigger job processing
- `GET /api/books/[id]` - Updated to include signed URLs for preview assets when ready

#### Database Updates
- Added `character_sheet_path` column to `books` table
- Added `cover_image_path` column to `books` table

#### Type Updates
- Added `BookPreview` interface for preview data
- Extended `BookStatusResponse` to include optional `preview` field
- Updated `Book` interface with new path columns

#### Storage
- Character sheets stored in `uploads/{book_id}/character_sheet.png`
- Cover images stored in `images/{book_id}/cover.png`
- Page illustrations stored in `images/{book_id}/page_01.png`
- Signed URLs with 1-hour expiry for secure access

#### Housekeeping
- Removed duplicate files (*.2.ts, *.2.tsx) that were cluttering the repo

## [0.3.0] - 2026-01-06

### Added - Create Book Flow (Backend) — API + Photo Upload + Job Queue

**Issue:** #5 - Create Book Flow - Backend "Create Book" API + Photo Upload + Job Queue (Supabase)

#### Database Schema
- `books` table: Main entity storing child details, story preferences, photo path, status
- `book_pages` table: Stores generated pages (cover, content, back) for each book
- `book_jobs` table: Tracks async generation jobs with step-by-step progress
- All tables have RLS enabled (no public access, server-only via service role)

#### Storage Buckets (Private)
- `uploads` - Source photos from users (`{book_id}/source.{ext}`)
- `images` - AI-generated illustrations
- `pdfs` - Final PDF files

#### API Endpoints
- `POST /api/books` - Creates book record, uploads photo to storage, queues generation job
- `GET /api/books/[id]` - Returns book status for polling (does not expose storage paths)

#### Server Infrastructure
- `lib/supabase/admin.ts` - Admin client with service role key (server-only)
- `lib/types/database.ts` - TypeScript types for DB tables and API responses
- `lib/constants/bookStatus.ts` - Status constants and helper functions
- `lib/validators/createBookApi.ts` - Server-side Zod validation + photo validation

#### Frontend Updates
- `CreateBookForm.tsx` - Now calls POST /api/books with multipart FormData
- `GeneratingStepper.tsx` - New component showing generation progress steps
- `/create/preview` - Polls book status, shows generating stepper, handles errors

#### Error Handling
- Photo upload failures mark book as failed with error message
- Job creation failures mark book as failed
- Preview page shows error state with retry option

## [0.2.0] - 2026-01-06

### Added - Create Book Flow (Step 1) — `/create` Page UI + Validation

**Issue:** #3 - Build /create Page UI + Validation (No Backend)

#### Features
- Complete book creation form with client-side validation
- Child details section (name, age band, interests multi-select)
- Story preferences section (tone radio cards, optional lesson textarea)
- Photo upload with drag & drop support, preview, and replace functionality
- Form persistence via sessionStorage (auto-save on change)
- Sticky submit button on mobile for better UX
- Form state preserved across page refreshes (except photo)

#### Validation Rules (Zod)
- Child name: 2-32 chars, letters/spaces/hyphens/apostrophes only
- Age band: required selection (3-4, 5-6, 7-9)
- Interests: 1-3 selections from presets or custom entries
- Tone: required selection (gentle, funny, brave)
- Lesson: optional, max 140 characters
- Photo: required, JPG/PNG/WebP only, max 8MB

#### Components Created
- `components/create/CreateBookForm.tsx` - Main form orchestrating all fields
- `components/create/InterestsInput.tsx` - Multi-select tag input with custom entry
- `components/create/PhotoDropzone.tsx` - Drag & drop photo upload with preview

#### Library Files Created
- `lib/constants/storyOptions.ts` - Centralized constants (age bands, tones, interests, photo config)
- `lib/validators/createBook.ts` - Zod schema + TypeScript types

#### Pages
- `app/create/page.tsx` - Fully functional create book form
- `app/create/preview/page.tsx` - Placeholder for next step

## [0.1.0] - 2026-01-06

### Added - Landing Page UI (v1)

**Issue:** #1 - Build Landing Page UI (v1) — "Bedtime. Solved."

#### Features
- Hero section with "Bedtime. Solved." headline and animated CTAs
- Benefits row with 4 icon-based trust indicators (photo-based likeness, ready in minutes, downloadable PDF, gift-ready)
- "What you get" preview section with skeleton-based book mockups
- "How it works" 3-step process visualization
- FAQ accordion with 5 common questions
- Footer with placeholder links

#### Design System
- Warm "Storybook at Golden Hour" color palette (amber/gold primary, cream backgrounds, terracotta accents)
- Fraunces display font for headlines (storybook character)
- Custom CSS animations (float, twinkle, fade-in-up, scale-in)
- Paper texture utility class for card depth
- Smooth scroll behavior for anchor links

#### Components Created
- `components/landing/Hero.tsx`
- `components/landing/Benefits.tsx`
- `components/landing/Preview.tsx`
- `components/landing/HowItWorks.tsx`
- `components/landing/Faq.tsx`
- `components/landing/Footer.tsx`
- `components/landing/index.ts` (barrel export)

#### Pages
- `app/page.tsx` - Landing page composition
- `app/create/page.tsx` - Placeholder for book creation flow

#### Updated
- `app/globals.css` - Warm bedtime color palette and animations
- `app/layout.tsx` - Fraunces font + updated metadata
