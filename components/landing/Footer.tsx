import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { BookOpen } from "lucide-react";

const footerLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        {/* Top section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">
              Bedtime. Solved.
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="bg-border/50" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 text-sm text-muted-foreground">
          <p>&copy; {currentYear} Bedtime Solved. All rights reserved.</p>
          <p className="text-center md:text-right">
            Made with love for parents everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
