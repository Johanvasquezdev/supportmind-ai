import { SectionHeading } from "./SectionHeading";

const faqs = [
  {
    question: "How does SupportMind AI learn about my business?",
    answer:
      "SupportMind AI ingests your documentation, FAQs, past support tickets, and knowledge base during setup to create a custom AI agent that understands your products and policies.",
  },
  { question: "Can I customize the AI responses?", answer: "Yes. You can tune tone, escalation rules, allowed sources, and response style." },
  { question: "What happens if the AI doesn't know the answer?", answer: "It can refuse, ask for clarification, or escalate to a human based on your configured policy." },
  { question: "Is my customer data secure?", answer: "Data is isolated by tenant and protected with encryption, access controls, and audit-friendly storage patterns." },
];

export function FAQ() {
  return (
    <section id="faq" className="border-y border-border/60 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Frequently Asked"
          highlight="Questions"
          subtitle="Everything you need to know about SupportMind AI"
        />
        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-border bg-card/70 p-6 open:border-white/60"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none text-xl font-semibold text-foreground">
                {faq.question}
              </summary>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
