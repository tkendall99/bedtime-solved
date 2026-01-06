import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 gradient-sunset" />

      {/* Floating stars decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-primary/30 animate-twinkle" />
        <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-primary/40 animate-twinkle delay-300" />
        <div className="absolute top-[10%] right-[30%] w-1 h-1 rounded-full bg-primary/25 animate-twinkle delay-500" />
        <div className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 rounded-full bg-accent/30 animate-twinkle delay-200" />
        <div className="absolute bottom-[40%] right-[25%] w-2 h-2 rounded-full bg-accent/20 animate-twinkle delay-400" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Small badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary/10 border border-primary/20 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Personalized storybooks in minutes</span>
        </div>

        {/* Main headline */}
        <h1 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6 animate-fade-in-up delay-100">
          <span className="block">Bedtime.</span>
          <span className="block text-primary">Solved.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
          Personalized storybooks starring your child — made from their photo in minutes.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
          <Button
            asChild
            size="lg"
            className="text-base px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Link href="/create">
              <Sparkles className="w-5 h-5 mr-2" />
              Create a Storybook
            </Link>
          </Button>

          <a
            href="#preview"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="font-medium">See an example</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-muted-foreground/50" />
      </div>

      {/* Decorative book illustration hint */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] max-w-4xl h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </section>
  );
}
