import { Camera, Clock, FileDown, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Camera,
    title: "Photo-based likeness",
    description: "Your child becomes the star of every page",
  },
  {
    icon: Clock,
    title: "Ready in minutes",
    description: "AI-powered generation, no waiting days",
  },
  {
    icon: FileDown,
    title: "Downloadable PDF",
    description: "Print at home or your favorite shop",
  },
  {
    icon: Gift,
    title: "Gift-ready",
    description: "Perfect for grandparents & birthdays",
  },
];

export function Benefits() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={cn(
                "group flex flex-col items-center text-center p-6 rounded-2xl",
                "bg-card/50 border border-border/50",
                "hover:bg-card hover:border-border hover:shadow-lg hover:shadow-primary/5",
                "transition-all duration-300",
                "animate-fade-in-up",
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon container */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Text */}
              <h3 className="font-[family-name:var(--font-fraunces)] font-semibold text-base mb-1">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
