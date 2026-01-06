import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CreatePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-warm -z-10" />

      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-float">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-semibold mb-4">
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          We&apos;re putting the finishing touches on our storybook creator.
          Check back soon to create your child&apos;s personalized adventure!
        </p>

        {/* Back button */}
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </main>
  );
}
