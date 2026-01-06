"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <nav
        className={cn(
          "mx-auto flex items-center justify-between transition-all duration-500 ease-out",
          // Base styles
          "px-4 sm:px-6",
          // Unscrolled state - full width, transparent, blends with hero
          !scrolled && [
            "max-w-5xl",
            "py-3",
            "bg-transparent",
            "border-transparent",
          ],
          // Scrolled state - contracted pill shape with warm background
          scrolled && [
            "max-w-2xl",
            "py-2.5",
            "bg-card/95 backdrop-blur-md",
            "border border-border/50",
            "rounded-full",
            "shadow-lg shadow-primary/10",
          ]
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 transition-all duration-500",
            scrolled ? "gap-2" : "gap-2.5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-xl transition-all duration-500",
              scrolled
                ? "w-8 h-8 bg-primary/10 border border-primary/20"
                : "w-9 h-9 bg-primary/10 border border-primary/20"
            )}
          >
            <BookOpen
              className={cn(
                "text-primary transition-all duration-500",
                scrolled ? "w-4 h-4" : "w-4.5 h-4.5"
              )}
            />
          </div>
          <span
            className={cn(
              "font-[family-name:var(--font-fraunces)] font-semibold tracking-tight transition-all duration-500",
              scrolled ? "text-sm sm:text-base" : "text-lg"
            )}
          >
            Bedtime. Solved.
          </span>
        </Link>

        {/* CTA Button */}
        <Button
          asChild
          size={scrolled ? "sm" : "default"}
          className={cn(
            "transition-all duration-500 rounded-full",
            scrolled
              ? "px-3 sm:px-4 shadow-md shadow-primary/20"
              : "px-5 shadow-lg shadow-primary/25"
          )}
        >
          <Link href="/create">
            <Sparkles
              className={cn(
                "transition-all duration-500",
                scrolled ? "w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" : "w-4 h-4 mr-2"
              )}
            />
            <span className={cn(scrolled ? "hidden sm:inline" : "inline")}>
              Create a Storybook
            </span>
          </Link>
        </Button>
      </nav>

      {/* Subtle glow effect behind navbar when scrolled */}
      <div
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full rounded-full transition-all duration-700 pointer-events-none -z-10",
          scrolled
            ? "opacity-100 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-2xl scale-110"
            : "opacity-0 scale-100"
        )}
      />
    </header>
  );
}
