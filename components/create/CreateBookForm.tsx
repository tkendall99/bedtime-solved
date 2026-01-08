"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, User, BookOpen } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { PhotoDropzone } from "./PhotoDropzone";
import { InterestsInput } from "./InterestsInput";
import {
  createBookSchema,
  type CreateBookFormData,
} from "@/lib/validators/createBook";
import { AGE_BANDS, TONES } from "@/lib/constants/storyOptions";

const STORAGE_KEY = "createBookFormData";

export function CreateBookForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CreateBookFormData>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      childName: "",
      ageBand: undefined,
      interests: [],
      tone: undefined,
      lesson: "",
      photo: undefined,
    },
    mode: "onBlur",
  });

  // Load saved form data on mount (except photo)
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Reset form with saved data (photo excluded)
        form.reset({
          childName: data.childName || "",
          ageBand: data.ageBand,
          interests: data.interests || [],
          tone: data.tone,
          lesson: data.lesson || "",
          photo: undefined,
        });
      }
    } catch {
      // Ignore parse errors
    }
  }, [form]);

  // Save form data on change (debounced, excludes photo)
  React.useEffect(() => {
    const subscription = form.watch((data) => {
      try {
        const { photo, ...rest } = data;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      } catch {
        // Ignore storage errors
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: CreateBookFormData) => {
    setIsSubmitting(true);

    try {
      // Build FormData for multipart upload
      const formData = new FormData();
      formData.append("child_name", data.childName);
      formData.append("age_band", data.ageBand);
      formData.append("interests", JSON.stringify(data.interests));
      formData.append("tone", data.tone);
      if (data.lesson) {
        formData.append("moral_lesson", data.lesson);
      }
      formData.append("photo", data.photo);

      // Call API with timeout (60 seconds for large photo uploads)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let response: Response;
      try {
        response = await fetch("/api/books", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Handle abort (timeout) specifically
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Request timed out. Please try again.");
        }
        // Handle network errors
        throw new Error("Network error. Please check your connection and try again.");
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Failed to create book";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const { bookId } = await response.json();

      // Clear session storage
      sessionStorage.removeItem(STORAGE_KEY);

      // Navigate to preview with bookId
      router.push(`/create/preview?bookId=${bookId}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleSubmitError = () => {
    toast.error("Please fix the errors above before continuing.");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleSubmitError)}
        className="space-y-8"
      >
        {/* Section 1: Child Details */}
        <Card className="paper-texture">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-fraunces)]">
              <User className="w-5 h-5 text-primary" />
              Child Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Child Name */}
            <FormField
              control={form.control}
              name="childName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child&apos;s Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Emma"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is how your child will appear in the story.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Age Band */}
            <FormField
              control={form.control}
              name="ageBand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Range</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGE_BANDS.map((band) => (
                        <SelectItem key={band.value} value={band.value}>
                          {band.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    We&apos;ll adjust vocabulary and themes for this age group.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interests */}
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests (1-3)</FormLabel>
                  <FormControl>
                    <InterestsInput
                      value={field.value}
                      onChange={field.onChange}
                      maxSelections={3}
                      error={!!form.formState.errors.interests}
                    />
                  </FormControl>
                  <FormDescription>
                    These will be woven into your child&apos;s adventure.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Story Preferences */}
        <Card className="paper-texture">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-fraunces)]">
              <BookOpen className="w-5 h-5 text-primary" />
              Story Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tone */}
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Tone</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {TONES.map((tone) => (
                        <Label
                          key={tone.value}
                          htmlFor={`tone-${tone.value}`}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            "hover:border-primary/50 hover:bg-primary/5",
                            field.value === tone.value
                              ? "border-primary bg-primary/10"
                              : "border-input"
                          )}
                        >
                          <RadioGroupItem
                            id={`tone-${tone.value}`}
                            value={tone.value}
                            className="sr-only"
                          />
                          <span className="font-medium">{tone.label}</span>
                          <span className="text-xs text-muted-foreground text-center">
                            {tone.description}
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Lesson */}
            <FormField
              control={form.control}
              name="lesson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Special Message{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Learning to share with friends, Being brave at the doctor..."
                      className="resize-none"
                      maxLength={140}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>A lesson or theme to weave into the story.</span>
                    <span className="text-xs tabular-nums">
                      {field.value?.length || 0}/140
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3: Photo Upload */}
        <Card className="paper-texture">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-fraunces)]">
              <Sparkles className="w-5 h-5 text-primary" />
              Photo Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Photo</FormLabel>
                  <FormControl>
                    <PhotoDropzone
                      value={field.value ?? null}
                      onChange={field.onChange}
                      error={form.formState.errors.photo?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button - Sticky on mobile */}
        <div className="sticky bottom-4 z-10 sm:static">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full text-base py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Creating Preview...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 w-5 h-5" />
                Create Preview
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
