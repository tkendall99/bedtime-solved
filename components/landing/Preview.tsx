import NextImage from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Image, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const previewCards = [
  {
    icon: BookOpen,
    title: "Custom Cover",
    description: "Your child's name and likeness on a beautiful illustrated cover",
  },
  {
    icon: Image,
    title: "Illustrated Pages",
    description: "8-10 pages of adventure with your child as the hero",
  },
  {
    icon: Download,
    title: "Instant Download",
    description: "High-quality PDF ready to print or share digitally",
  },
];

export function Preview() {
  return (
    <section id="preview" className="py-20 px-4 scroll-mt-8">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-semibold mb-4">
            What you get
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A professionally designed, personalized storybook that makes bedtime magical
          </p>
        </div>

        {/* Preview cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {previewCards.map((card, index) => (
            <div
              key={card.title}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "bg-card border border-border",
                "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
                "transition-all duration-300",
              )}
            >
              {/* Mock book preview area */}
              <div className={cn(
                "relative aspect-[4/5] flex items-center justify-center",
                index === 0 ? "" : "bg-gradient-to-br from-secondary via-muted/50 to-secondary p-6"
              )}>
                {/* Paper texture effect - only for non-cover cards */}
                {index !== 0 && <div className="absolute inset-0 paper-texture opacity-50" />}

                {/* Book cover with real image - fills entire area */}
                {index === 0 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <NextImage
                      src="/images/examples/milos-dino-dreamland.png"
                      alt="Example storybook cover - Milo's Dino Dreamland"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                )}

                {index === 1 && (
                  <div className="relative w-full max-w-[200px] flex gap-1">
                    {/* Left page */}
                    <div className="flex-1 aspect-[3/4] bg-card rounded-l-sm shadow-lg border border-border overflow-hidden">
                      <div className="p-2 h-full flex flex-col">
                        <Skeleton className="w-full h-[55%] rounded bg-accent/20 mb-2" />
                        <Skeleton className="w-full h-2 rounded-full bg-foreground/15 mb-1" />
                        <Skeleton className="w-full h-2 rounded-full bg-foreground/15 mb-1" />
                        <Skeleton className="w-3/4 h-2 rounded-full bg-foreground/15" />
                      </div>
                    </div>
                    {/* Right page */}
                    <div className="flex-1 aspect-[3/4] bg-card rounded-r-sm shadow-lg border border-border overflow-hidden">
                      <div className="p-2 h-full flex flex-col">
                        <Skeleton className="w-full h-2 rounded-full bg-foreground/15 mb-1" />
                        <Skeleton className="w-full h-2 rounded-full bg-foreground/15 mb-1" />
                        <Skeleton className="w-2/3 h-2 rounded-full bg-foreground/15 mb-2" />
                        <Skeleton className="w-full flex-1 rounded bg-primary/20" />
                      </div>
                    </div>
                    {/* Book binding */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-r from-black/5 via-black/10 to-black/5" />
                  </div>
                )}

                {index === 2 && (
                  <div className="relative flex flex-col items-center gap-3">
                    {/* PDF icon */}
                    <div className="w-20 h-24 bg-card rounded-lg shadow-lg border border-border flex items-center justify-center">
                      <div className="text-center">
                        <Download className="w-8 h-8 text-accent mx-auto mb-1" />
                        <span className="text-[10px] font-medium text-muted-foreground">.PDF</span>
                      </div>
                    </div>
                    {/* Download progress hint */}
                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-primary to-accent rounded-full" />
                    </div>
                  </div>
                )}

                {/* Decorative corner - hidden for cover since image fills area */}
                {index !== 0 && (
                  <div className="absolute top-3 right-3 w-8 h-8 opacity-30">
                    <card.icon className="w-full h-full text-primary" />
                  </div>
                )}
              </div>

              {/* Card content */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-[family-name:var(--font-fraunces)] font-semibold">
                    {card.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
