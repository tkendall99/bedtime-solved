import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function PreviewPage() {
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
          Preview Coming Soon
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Your storybook details have been saved! The preview generation
          feature is coming in the next update.
        </p>

        {/* Back button */}
        <Button asChild variant="outline" size="lg" className="rounded-full">
          <Link href="/create">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Create
          </Link>
        </Button>
      </div>
    </main>
  );
}
