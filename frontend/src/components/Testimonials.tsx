"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "./SectionHeading";

const testimonials = [
  {
    quote: "SupportMind AI reduced our response time from 4 hours to under 2 minutes. Our customer satisfaction scores have never been higher.",
    name: "Sarah Chen",
    role: "Head of Customer Success at TechFlow Inc",
    initials: "SC",
    color: "bg-blue-600",
  },
  {
    quote: "We cut our support costs by 60% while improving quality. The AI handles 80% of our tickets, and our team focuses on complex issues.",
    name: "Michael Rodriguez",
    role: "VP of Operations at CloudScale",
    initials: "MR",
    color: "bg-purple-600",
  },
  {
    quote: "The onboarding process was incredibly smooth. Within a week, the AI was answering technical questions accurately from our knowledge base.",
    name: "Jessica Taylor",
    role: "Director of Support at DataStack",
    initials: "JT",
    color: "bg-emerald-600",
  },
  {
    quote: "Our international customers love getting instant answers in their native languages. SupportMind AI has been a game-changer for our global expansion.",
    name: "David Kim",
    role: "COO at GlobalReach",
    initials: "DK",
    color: "bg-orange-600",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [animateKey, setAnimateKey] = useState(0);

  // When active changes, increment animateKey to re-trigger the animation
  useEffect(() => {
    setAnimateKey((prev) => prev + 1);
  }, [active]);

  const visibleIndices = [active, (active + 1) % testimonials.length];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Loved by <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">Thousands</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See what our customers have to say about transforming their support
          </p>
        </div>

        <div key={animateKey} className="mt-16 grid gap-6 lg:grid-cols-2 animate-fade-in">
          {visibleIndices.map((index) => {
            const item = testimonials[index];
            return (
              <article key={item.name} className="group relative rounded-2xl border border-border bg-card/40 p-10 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10">
                {/* Highlight gradient */}
                <div className="absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-transparent blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <Quote className="mb-6 size-10 text-purple-500/80 stroke-[1.5]" />
                <p className="text-lg leading-relaxed text-muted-foreground">{item.quote}</p>
                <div className="mt-8 flex items-center gap-4">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${item.color} text-sm font-bold text-white shadow-lg`}>
                    {item.initials}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => setActive((value) => (value === 0 ? testimonials.length - 1 : value - 1))}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-accent active:scale-95"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="size-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActive(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={`h-1.5 transition-all duration-300 ${
                  active === index ? "w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" : "w-1.5 rounded-full bg-muted hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActive((value) => (value + 1) % testimonials.length)}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-accent active:scale-95"
            aria-label="Next testimonial"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
