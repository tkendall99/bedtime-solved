import {
  Hero,
  Benefits,
  Preview,
  HowItWorks,
  Faq,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Benefits />
      <Preview />
      <HowItWorks />
      <Faq />
      <Footer />
    </main>
  );
}
