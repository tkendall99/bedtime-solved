import NextImage from "next/image";
import { BookOpen, Image as ImageIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const previewCards = [
  {
    icon: BookOpen,
    title: "Custom Cover",
    description: "Your child's name and likeness on a beautiful illustrated cover",
  },
  {
    icon: ImageIcon,
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
              {/* Cover card - image determines height */}
              {index === 0 && (
                <div className="relative w-full">
                  <NextImage
                    src="/images/examples/milos-dino-dreamland.png"
                    alt="Example storybook cover - Milo's Dino Dreamland"
                    width={800}
                    height={1200}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              )}

              {/* Illustrated pages - image determines height */}
              {index === 1 && (
                <div className="relative w-full">
                  <NextImage
                    src="/images/examples/illustrated-pages-example.png"
                    alt="Example illustrated pages spread"
                    width={800}
                    height={1200}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              )}

              {/* PDF download - image determines height */}
              {index === 2 && (
                <div className="relative w-full">
                  <NextImage
                    src="/images/examples/generate-pdf.png"
                    alt="Example PDF download"
                    width={800}
                    height={1200}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              )}

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
