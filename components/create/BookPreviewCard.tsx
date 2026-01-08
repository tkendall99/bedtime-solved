"use client";

import * as React from "react";
import { useState } from "react";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BookPreview } from "@/lib/types/database";

interface BookPreviewCardProps {
  preview: BookPreview;
  onContinue: () => void;
}

export function BookPreviewCard({ preview, onContinue }: BookPreviewCardProps) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Preview Ready</span>
        </div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl font-semibold mb-2">
          Your Story Awaits
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a sneak peek of your personalized storybook
        </p>
      </div>

      {/* Book Cover Section */}
      <div className="mb-12 animate-scale-in delay-200" style={{ animationFillMode: 'backwards' }}>
        <div className="text-center mb-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Cover
          </span>
        </div>

        {/* Book Cover with 3D Effect */}
        <div className="relative mx-auto w-fit group">
          {/* Book shadow */}
          <div className="absolute -inset-4 bg-gradient-to-b from-foreground/5 to-foreground/20 rounded-2xl blur-2xl transform translate-y-4 group-hover:translate-y-6 transition-transform duration-500" />

          {/* Book spine edge effect */}
          <div className="absolute left-0 top-2 bottom-2 w-3 bg-gradient-to-r from-foreground/20 to-transparent rounded-l-sm" />

          {/* Page edges (right side) */}
          <div className="absolute right-0 top-1 bottom-1 w-1 bg-gradient-to-l from-foreground/10 to-transparent">
            <div className="absolute inset-0 flex flex-col justify-evenly">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-px bg-foreground/5" />
              ))}
            </div>
          </div>

          {/* Cover Image Container */}
          <div className="relative rounded-lg overflow-hidden shadow-2xl ring-1 ring-foreground/10 transform group-hover:scale-[1.02] transition-transform duration-500">
            {/* Loading skeleton */}
            {!coverLoaded && (
              <Skeleton className="w-[280px] sm:w-[320px] md:w-[380px] aspect-[3/4]" />
            )}

            {/* Cover image */}
            <img
              src={preview.coverUrl}
              alt="Book Cover"
              onLoad={() => setCoverLoaded(true)}
              className={cn(
                "w-[280px] sm:w-[320px] md:w-[380px] aspect-[3/4] object-cover",
                !coverLoaded && "hidden"
              )}
            />

            {/* Subtle gloss overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Floating sparkle decorations */}
          <div className="absolute -top-3 -right-3 text-primary/60 animate-twinkle">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-2 -left-2 text-primary/40 animate-twinkle delay-500">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Divider with page turn hint */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium">Page 1</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Open Book Spread */}
      <div className="animate-fade-in-up delay-400" style={{ animationFillMode: 'backwards' }}>
        {/* Book binding shadow effect */}
        <div className="relative">
          <div className="absolute inset-0 -m-6 bg-foreground/5 rounded-3xl blur-xl" />

          {/* Open book container */}
          <div className="relative bg-card rounded-2xl shadow-xl ring-1 ring-border overflow-hidden paper-texture">
            {/* Center spine shadow */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-foreground/5 to-transparent pointer-events-none hidden md:block" />

            {/* Two-page spread */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left page - Illustration */}
              <div className="relative p-4 sm:p-6 md:p-8 md:border-r border-border/50">
                {/* Page number */}
                <div className="absolute top-3 left-4 text-xs text-muted-foreground/50 font-medium">
                  1
                </div>

                {/* Illustration container */}
                <div className="relative mt-4 rounded-lg overflow-hidden shadow-lg ring-1 ring-foreground/5">
                  {/* Loading skeleton */}
                  {!pageLoaded && (
                    <Skeleton className="w-full aspect-[4/3]" />
                  )}

                  {/* Page illustration */}
                  <img
                    src={preview.page1ImageUrl}
                    alt="Page 1 Illustration"
                    onLoad={() => setPageLoaded(true)}
                    className={cn(
                      "w-full aspect-[4/3] object-cover",
                      !pageLoaded && "hidden"
                    )}
                  />

                  {/* Vignette effect */}
                  <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.1)] pointer-events-none" />
                </div>
              </div>

              {/* Right page - Story text */}
              <div className="relative p-4 sm:p-6 md:p-8 flex flex-col justify-center min-h-[300px] md:min-h-[400px]">
                {/* Decorative corner flourish */}
                <div className="absolute top-4 right-4 w-12 h-12 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                    <path
                      d="M100 0 C100 55.23 55.23 100 0 100 L0 80 C44.18 80 80 44.18 80 0 Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {/* Story text */}
                <div className="relative">
                  {/* Decorative initial letter effect (first letter large) */}
                  <p className="font-[family-name:var(--font-fraunces)] text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 first-letter:text-4xl first-letter:sm:text-5xl first-letter:md:text-6xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2 first-letter:mt-1">
                    {preview.page1Text}
                  </p>
                </div>

                {/* Page footer decoration */}
                <div className="mt-auto pt-6 flex justify-center">
                  <div className="flex items-center gap-1 text-primary/30">
                    <span className="text-lg">✦</span>
                    <span className="text-sm">✦</span>
                    <span className="text-lg">✦</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-12 text-center animate-fade-in-up delay-500" style={{ animationFillMode: 'backwards' }}>
        <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-b from-primary/5 to-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground max-w-md">
            Love what you see? Complete your order to receive the full illustrated
            storybook with 8-10 pages of personalized adventure.
          </p>

          <Button
            onClick={onContinue}
            size="lg"
            className="rounded-full px-8 group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            Continue to Checkout
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-xs text-muted-foreground/70">
            Secure payment • Instant PDF delivery
          </p>
        </div>
      </div>
    </div>
  );
}
