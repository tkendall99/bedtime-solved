"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/lib/types/database";

// Generation steps displayed in the UI
const GENERATION_STEPS = [
  { key: "analyzing", label: "Analyzing photo" },
  { key: "writing", label: "Writing story" },
  { key: "creating", label: "Creating pages" },
  { key: "generating", label: "Generating artwork" },
] as const;

interface GeneratingStepperProps {
  /** Current book status */
  status: BookStatus;
  /** Optional class name */
  className?: string;
}

/**
 * Visual stepper component showing book generation progress.
 * Animates through steps while status is "draft" or "generating".
 */
export function GeneratingStepper({
  status,
  className,
}: GeneratingStepperProps) {
  // Simulate step progress for visual feedback (since we don't have real step updates yet)
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  const isGenerating = status === "draft" || status === "generating";

  // Animate through steps while generating
  React.useEffect(() => {
    if (!isGenerating) {
      // If not generating, show all steps as complete or none
      if (status === "preview_ready" || status === "completed") {
        setCurrentStepIndex(GENERATION_STEPS.length);
        setProgress(100);
      }
      return;
    }

    // Progress animation within each step
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 100);

    // Step advancement (slower - each step takes ~15 seconds)
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= GENERATION_STEPS.length - 1) return prev;
        return prev + 1;
      });
      setProgress(0);
    }, 15000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isGenerating, status]);

  // Calculate overall progress percentage
  const overallProgress =
    ((currentStepIndex + progress / 100) / GENERATION_STEPS.length) * 100;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Creating your storybook...</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="space-y-4">
        {GENERATION_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex && isGenerating;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.key} className="flex items-center gap-4">
              {/* Step indicator */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isActive && "border-primary text-primary animate-pulse",
                  isPending && "border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium transition-colors",
                    isCompleted && "text-primary",
                    isActive && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                  {isActive && "..."}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful message */}
      <p className="text-center text-sm text-muted-foreground">
        This usually takes a minute or two. Feel free to keep this tab open.
      </p>
    </div>
  );
}
