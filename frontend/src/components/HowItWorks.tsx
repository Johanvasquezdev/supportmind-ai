"use client";

import {
  Upload,
  Cpu,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  FileText,
  Brain,
  Search,
  Sparkles,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useState } from "react";

const steps = [
  {
    Icon: Upload,
    step: "01",
    title: "Upload Your Documents",
    description:
      "Paste or upload your company knowledge — FAQs, support policies, product guides, onboarding docs. Any text content your support team uses daily.",
    details: [
      { Icon: FileText, text: "Paste plain text or documentation" },
      { Icon: CheckCircle2, text: "No file format restrictions" },
      { Icon: Sparkles, text: "Process multiple documents at once" },
    ],
    color: "from-blue-500 to-cyan-400",
    glowColor: "blue",
  },
  {
    Icon: Cpu,
    step: "02",
    title: "AI Learns Your Business",
    description:
      "SupportMind automatically splits your content into smart chunks, generates semantic embeddings, and indexes everything for instant retrieval.",
    details: [
      { Icon: Brain, text: "Sentence-aware chunking preserves meaning" },
      { Icon: Search, text: "Vector embeddings enable semantic search" },
      { Icon: CheckCircle2, text: "Processing happens in the background" },
    ],
    color: "from-purple-500 to-pink-400",
    glowColor: "purple",
  },
  {
    Icon: MessageSquare,
    step: "03",
    title: "Chat With Your AI Agent",
    description:
      "Ask questions in natural language. The AI retrieves the most relevant sections from your docs and answers using only your verified content — no hallucinations.",
    details: [
      { Icon: Sparkles, text: "Answers grounded in your documentation" },
      { Icon: Brain, text: "Understands context and follow-up questions" },
      { Icon: CheckCircle2, text: "Cites sources from your knowledge base" },
    ],
    color: "from-emerald-500 to-teal-400",
    glowColor: "emerald",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="relative py-28">
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-950/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="How to Use"
          highlight="SupportMind AI"
          subtitle="From zero to AI-powered support in under 10 minutes. No training required."
        />

        {/* Step indicators */}
        <div className="mb-16 flex items-center justify-center gap-4">
          {steps.map((step, index) => (
            <button
              key={step.step}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`group flex items-center gap-3 rounded-full border px-5 py-2.5 transition-all duration-300 ${
                activeStep === index
                  ? "scale-105 border-white/20 bg-white/10 shadow-lg"
                  : "border-border hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  activeStep === index
                    ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                    : "bg-accent text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  activeStep === index
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.title.split(" ").slice(0, 2).join(" ")}
              </span>
            </button>
          ))}
        </div>

        {/* Step cards — always all visible on desktop, tabs on mobile */}
        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map(({ Icon, step, title, description, details, color, glowColor }, index) => (
            <article
              key={step}
              className={`group relative cursor-pointer rounded-2xl border bg-card/70 p-8 shadow-xl transition-all duration-500 ${
                activeStep === index
                  ? "border-border/80 shadow-purple-950/30 lg:scale-[1.03]"
                  : "border-border shadow-purple-950/10 hover:border-border/60"
              }`}
              onClick={() => setActiveStep(index)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActiveStep(index)}
              role="button"
              aria-label={`Step ${index + 1}: ${title}`}
            >
              {/* Highlight gradient */}
              <div className={`absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-transparent blur-sm transition-opacity duration-300 ${activeStep === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              <div className={`absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 to-purple-400 transition-opacity duration-300 ${activeStep === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />

              {/* Glow effect */}
              <div
                className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${color} opacity-0 blur-xl transition-opacity duration-500 ${
                  activeStep === index ? "opacity-20" : "group-hover:opacity-10"
                }`}
              />

              <div className="relative">
                {/* Step number + icon */}
                <div className="mb-6 flex items-center justify-between">
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="size-7 text-white" />
                  </div>
                  <span className="text-5xl font-black text-white/[0.04]">
                    {step}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                  {description}
                </p>

                {/* Detail bullets */}
                <ul className="space-y-3">
                  {details.map(({ Icon: DetailIcon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <DetailIcon className="mt-0.5 size-4 shrink-0 text-purple-400" />
                      <span className="text-sm text-muted-foreground">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow connector (hidden on last card) */}
              {index < steps.length - 1 ? (
                <div className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                  <ArrowRight className="size-5 text-muted-foreground/30" />
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="mb-6 text-lg text-muted-foreground">
            That&apos;s it. No complex setup, no ML expertise needed.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95"
          >
            Start Free Trial
            <ArrowRight className="size-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
