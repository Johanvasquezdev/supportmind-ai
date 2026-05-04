import { Sparkles, Upload, Zap } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const steps = [
  {
    Icon: Upload,
    title: "Connect Your Data",
    description: "Import your knowledge base, FAQs, and documentation. SupportMind learns your business in minutes.",
  },
  {
    Icon: Zap,
    title: "Train Your AI",
    description: "Our AI analyzes your data and customer patterns to create personalized, context-aware responses.",
  },
  {
    Icon: Sparkles,
    title: "Go Live Instantly",
    description: "Deploy your AI agent across all channels. Watch it handle support tickets 24/7 with human-like precision.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-950/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Get Started in"
          highlight="3 Simple Steps"
          subtitle="From setup to serving customers in under 10 minutes"
        />
        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map(({ Icon, title, description }, index) => (
            <article
              key={title}
              className="relative rounded-2xl border border-border bg-card/70 p-8 text-center shadow-xl shadow-purple-950/10"
            >
              <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600">
                <Icon className="size-10 text-white" />
              </div>
              <span className="absolute left-1/2 top-8 flex size-9 translate-x-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
