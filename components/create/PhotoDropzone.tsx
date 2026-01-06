"use client";

import * as React from "react";
import { Upload, X, ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PHOTO_CONFIG } from "@/lib/constants/storyOptions";

interface PhotoDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function PhotoDropzone({ value, onChange, error }: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Generate preview URL when file changes
  React.useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [value]);

  const validateAndSetFile = (file: File) => {
    // Type validation
    if (
      !(PHOTO_CONFIG.acceptedTypes as readonly string[]).includes(file.type)
    ) {
      return;
    }
    // Size validation
    if (file.size > PHOTO_CONFIG.maxSizeBytes) {
      return;
    }
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleReplace = () => {
    inputRef.current?.click();
  };

  // Render preview state
  if (preview && value) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-card">
          <img
            src={preview}
            alt="Uploaded photo preview"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
            <span className="text-white text-sm truncate max-w-[60%]">
              {value.name}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReplace}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use a clear face photo in good light for best results.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_CONFIG.acceptString}
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    );
  }

  // Render dropzone state
  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload photo"
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging && "border-primary bg-primary/10",
          error && "border-destructive bg-destructive/5"
        )}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "bg-primary/10 text-primary",
            isDragging && "bg-primary/20"
          )}
        >
          {isDragging ? (
            <Upload className="w-8 h-8 animate-bounce" />
          ) : (
            <ImageIcon className="w-8 h-8" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragging ? "Drop your photo here" : "Drag & drop your photo"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP up to {PHOTO_CONFIG.maxSizeMB}MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_CONFIG.acceptString}
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
