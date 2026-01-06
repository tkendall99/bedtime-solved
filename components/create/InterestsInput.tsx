"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRESET_INTERESTS } from "@/lib/constants/storyOptions";

interface InterestsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  error?: boolean;
}

export function InterestsInput({
  value,
  onChange,
  maxSelections = 3,
  error = false,
}: InterestsInputProps) {
  const [customInput, setCustomInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isAtLimit = value.length >= maxSelections;
  const availablePresets = PRESET_INTERESTS.filter(
    (interest) => !value.includes(interest)
  );

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxSelections) {
      onChange([...value, trimmed]);
    }
  };

  const removeInterest = (interest: string) => {
    onChange(value.filter((i) => i !== interest));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim() && customInput.length <= 30) {
      addInterest(customInput);
      setCustomInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected interests */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((interest) => (
            <Badge
              key={interest}
              variant="default"
              className="pl-3 pr-1 py-1.5 gap-1 text-sm"
            >
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors"
                aria-label={`Remove ${interest}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Custom input */}
      {!isAtLimit && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Add custom interest..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={30}
            className={cn(error && value.length === 0 && "border-destructive")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!customInput.trim()}
            onClick={handleCustomSubmit}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Preset interests */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {isAtLimit
            ? "Maximum selections reached"
            : `Or choose from suggestions (${value.length}/${maxSelections})`}
        </p>
        <div className="flex flex-wrap gap-2">
          {availablePresets.map((interest) => (
            <Badge
              key={interest}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/50",
                isAtLimit &&
                  "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-input"
              )}
              onClick={() => !isAtLimit && addInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
