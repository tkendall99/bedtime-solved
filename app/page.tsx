import {
  Navbar,
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
      <Navbar />
      <Hero />
      <Benefits />
      <Preview />
      <HowItWorks />
      <Faq />
      <Footer />
    </main>
  );
}
