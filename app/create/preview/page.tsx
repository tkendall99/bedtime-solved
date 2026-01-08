"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GeneratingStepper } from "@/components/create/GeneratingStepper";
import type { BookStatus, BookStatusResponse, BookPreview } from "@/lib/types/database";
import { BookPreviewCard } from "@/components/create/BookPreviewCard";

const POLL_INTERVAL_MS = 2000; // 2 seconds

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");

  const [status, setStatus] = React.useState<BookStatus>("draft");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<BookPreview | null>(null);

  // Redirect to /create if no bookId
  React.useEffect(() => {
    if (!bookId) {
      router.replace("/create");
    }
  }, [bookId, router]);

  // Poll for book status
  React.useEffect(() => {
    if (!bookId) return;

    let isActive = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/books/${bookId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setFetchError("Book not found. It may have been deleted.");
            return false; // Stop polling
          }
          throw new Error("Failed to fetch book status");
        }

        const data: BookStatusResponse = await response.json();

        if (isActive) {
          setStatus(data.status);
          setErrorMessage(data.errorMessage);
          setIsLoading(false);
          setFetchError(null);
          if (data.preview) {
            setPreview(data.preview);
          }
        }

        // Stop polling if we've reached a terminal state
        if (
          data.status === "preview_ready" ||
          data.status === "completed" ||
          data.status === "failed"
        ) {
          return false;
        }

        return true; // Continue polling
      } catch (error) {
        console.error("Error fetching book status:", error);
        if (isActive) {
          setFetchError("Unable to check book status. Please try again.");
          setIsLoading(false);
        }
        return false; // Stop polling on error
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling
    const intervalId = setInterval(async () => {
      const shouldContinue = await fetchStatus();
      if (!shouldContinue) {
        clearInterval(intervalId);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [bookId]);

  // Don't render anything while redirecting
  if (!bookId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="absolute inset-0 gradient-warm -z-10" />
        <div className="animate-pulse text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-8 h-8 text-primary animate-float" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // Fetch error state
  if (fetchError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="absolute inset-0 gradient-warm -z-10" />
        <Card className="max-w-md w-full paper-texture">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold mb-3">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">{fetchError}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="rounded-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button asChild variant="default" className="rounded-full">
                <Link href="/create">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Start Over
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Failed status
  if (status === "failed") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="absolute inset-0 gradient-warm -z-10" />
        <Card className="max-w-md w-full paper-texture">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold mb-3">
              Generation Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage || "We couldn't create your storybook. Please try again."}
            </p>
            <Button asChild variant="default" size="lg" className="rounded-full">
              <Link href="/create">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Preview ready / completed status
  if (status === "preview_ready" || status === "completed" || status === "paid") {
    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-8 md:py-16">
        <div className="absolute inset-0 gradient-warm -z-10" />

        {preview ? (
          <BookPreviewCard
            preview={preview}
            onContinue={() => {
              // TODO: Navigate to checkout (future issue)
              console.log("Continue to checkout for book:", bookId);
            }}
          />
        ) : (
          // Fallback if preview data is missing
          <Card className="max-w-md w-full paper-texture">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-float">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold mb-3">
                Preview Ready!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your storybook is ready, but we couldn&apos;t load the preview images.
                Please try refreshing the page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="rounded-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button asChild variant="default" className="rounded-full">
                  <Link href="/create">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Create Another
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    );
  }

  // Generating status (draft or generating)
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 gradient-warm -z-10" />
      <Card className="max-w-md w-full paper-texture">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-float">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold mb-2">
              Creating Your Storybook
            </h1>
            <p className="text-muted-foreground">
              Please wait while we bring your story to life.
            </p>
          </div>

          <GeneratingStepper status={status} className="px-2" />

          <div className="mt-8 text-center">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/create">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel and start over
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// Loading fallback for Suspense
function PreviewLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute inset-0 gradient-warm -z-10" />
      <div className="animate-pulse text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}

// Page component with Suspense boundary for useSearchParams
export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewLoading />}>
      <PreviewContent />
    </Suspense>
  );
}
