import { Upload, Sparkles, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload photo & details",
    description:
      "Share your child's photo, name, age, and interests. Tell us about their favorite things and any special message you'd like included.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "We generate a preview",
    description:
      "Our AI creates a custom cover and first page featuring your child. Review and approve before continuing.",
  },
  {
    number: "03",
    icon: Download,
    title: "Pay & download",
    description:
      "Complete your purchase and receive the full 8-10 page illustrated storybook as a high-quality PDF, ready to print.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-semibold mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps to create a magical personalized story
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={cn(
                  "relative flex flex-col items-center text-center",
                  "group"
                )}
              >
                {/* Step number badge */}
                <div className="relative mb-6">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Main circle */}
                  <div
                    className={cn(
                      "relative w-20 h-20 rounded-full flex items-center justify-center",
                      "bg-card border-2 border-primary/30",
                      "shadow-lg shadow-primary/10",
                      "group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20",
                      "transition-all duration-300"
                    )}
                  >
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Step number */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground shadow-md">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>

                {/* Arrow connector (mobile) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden mt-6 mb-2">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-border to-transparent mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
