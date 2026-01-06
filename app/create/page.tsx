import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateBookForm } from "@/components/create/CreateBookForm";
import { Toaster } from "@/components/ui/sonner";

export default function CreatePage() {
  return (
    <>
      <Toaster position="top-center" />
      <main className="min-h-screen">
        {/* Background gradient */}
        <div className="fixed inset-0 gradient-warm -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link href="/" aria-label="Back to home">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                Create Your Storybook
              </h1>
              <p className="text-sm text-muted-foreground">
                Tell us about your child
              </p>
            </div>
          </div>
        </header>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
          <CreateBookForm />
        </div>
      </main>
    </>
  );
}
