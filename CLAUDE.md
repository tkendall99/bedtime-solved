## What we’re building

BedtimeSolved is a web app that generates **personalized, photo-based children’s storybooks**.
Parents upload a child’s photo + enter name/age/interests → we generate a short illustrated story where the child is the hero → deliver a **downloadable PDF** (and later: print/audio).

## Core user flow (v1)

1. Landing page → CTA
2. Create book form (name, age band, interests, tone, optional lesson, photo upload)
3. Generate **preview** (cover + page 1)
4. Pay (Stripe)
5. Generate full book (8–10 pages) + PDF
6. Download via signed link (and email link)

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **UI:** shadcn/ui, Lucide Icons
- **Hosting/Deploy:** Vercel (production + previews)
- **Repo:** GitHub
- **DB + Storage:** Supabase (Postgres + Storage buckets)
- **Payments:** Stripe (Checkout + webhooks)
- **AI:** OpenRouter (LLMs for story + image models for illustrations)
- **PDF:** Server-side PDF generation (HTML → PDF or PDF library)

## Data & privacy rules (important)

- Children’s photos are **sensitive**.
- Supabase Storage buckets are **private**; files are served via **signed URLs** only.
- DB tables use **RLS**; no public client access to core tables (server-only via service role).
- Minimize retention and support deletion flows ASAP.

## Engineering principles (maintainable + scalable)

Enterprise-grade mindset:

- **Component-first UI:** Prefer small, reusable components over page-specific one-offs.
- **Clear boundaries:** Separate concerns:
  - `ui/` (presentational components)
  - `features/` (domain components: book creation, preview, checkout, download)
  - `lib/` (clients + helpers: supabase, stripe, openrouter, pdf)
  - `server/` (job runners, workers, orchestration)
- **Typed contracts:** Strong TypeScript types for:
  - request/response payloads (API routes)
  - DB row types (generated or hand-rolled)
  - job steps/status enums
- **Single source of truth:** Keep shared constants (statuses, age bands, styles) in one place.
- **Idempotent workflows:** Generation should be safe to retry without duplicating pages/assets.
- **Observability by default:** Log job steps + errors with enough context to debug quickly.
- **Config over hardcode:** Model choices, style blocks, and pricing rules should live in config.
- **No shortcuts that block growth:** Avoid embedding business logic in UI components; keep it in
  server modules/services.

## Git

- After each change, update changelog.md with a brief description of changes, then ommit and push so I can test on a preview branch in Vercel.
- After commit and push, provide a list of manual tests.

## Testing strategy (best practice)

We follow a simple “testing pyramid” so we catch breakages cheaply and protect the revenue path:

### Unit tests (fast, many)

Test small pure functions in isolation.

- Prompt builders (story + image prompts)
- Validators and business rules (age bands, pricing, status transitions)
- PDF helper/layout utilities

**Goal:** lots of small tests that run in seconds.

### Integration tests (medium, fewer)

Test key backend flows across multiple components without a real browser.

- `POST /api/books` creates a book row, uploads the photo, queues a job
- Stripe webhook marks a book as paid and triggers generation
- Signed URL generation works and buckets remain private

**Goal:** verify the plumbing (DB + storage + API logic) stays correct.

### End-to-end tests (slow, few, highest value)

Run a real browser against the deployed app.

- Happy path: create → preview → pay → download PDF
- Failure path: generation fails → user gets a clear error + retry
- (Later) admin tools like regenerate page / resend link

**Goal:** protect the “money path” so we don’t ship broken checkouts/downloads.

### Key principles

- **Mock AI in tests**: AI calls must be deterministic in CI; wrap OpenRouter calls behind `lib/ai/*` and swap in fakes in tests.
- **Keep fixtures**: use small synthetic images in `tests/fixtures/` (never real child photos).
- **CI defaults**: run unit + integration on every PR; run E2E on main merges or nightly.
