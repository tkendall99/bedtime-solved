# Changelog

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
