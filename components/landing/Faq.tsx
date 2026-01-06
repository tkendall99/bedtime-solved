"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is my child's photo safe?",
    answer:
      "Absolutely. Your child's privacy is our top priority. Photos are encrypted during upload, stored securely, and only used to generate your storybook. We never share photos with third parties, and you can request deletion at any time. We minimize data retention and follow strict privacy guidelines for handling children's data.",
  },
  {
    question: "How long does it take?",
    answer:
      "The preview (cover + first page) generates in about 2-3 minutes. Once you approve and pay, the full 8-10 page book takes another 5-10 minutes to complete. You'll receive an email with your download link as soon as it's ready.",
  },
  {
    question: "Can I print it?",
    answer:
      "Yes! You'll receive a high-resolution PDF that's perfect for printing. Print it at home, at a local print shop, or use an online service like Shutterfly or Blurb. The PDF is formatted for standard book sizes and includes bleed margins for professional printing.",
  },
  {
    question: "What ages does this work for?",
    answer:
      "Our stories work beautifully for children ages 2-10. You can select an age band during creation, and we'll adjust the story complexity, vocabulary, and themes accordingly. Toddler stories are simpler with more repetition, while stories for older kids include more adventure and detail.",
  },
  {
    question: "Can I redo a page if it looks off?",
    answer:
      "Yes! After your preview generates, you can request adjustments before paying. If something doesn't look quite right in the full book, we offer one free regeneration per order. Our goal is for you to love the final result.",
  },
];

export function Faq() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-semibold mb-4">
            Questions? We&apos;ve got answers
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about creating your storybook
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg data-[state=open]:shadow-primary/5 transition-shadow duration-300"
            >
              <AccordionTrigger className="text-left font-[family-name:var(--font-fraunces)] font-medium text-base hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
