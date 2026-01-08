# Changelog

## [0.4.5] - 2026-01-08

### Fixed - Toast Notifications Not Displaying

**Issue:** Form errors were being caught and toast.error() was called, but no toast appeared on screen. User saw form spinning then stopping with no feedback.

#### Root Cause
- `<Toaster />` component from sonner was never added to the app layout
- Toast calls worked but had nowhere to render

#### Fix
- Added `<Toaster richColors position="top-center" />` to `app/layout.tsx`
- Error messages now properly display to users

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
