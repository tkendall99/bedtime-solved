# Changelog

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
