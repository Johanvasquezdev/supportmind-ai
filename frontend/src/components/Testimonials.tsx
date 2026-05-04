"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "./SectionHeading";

const testimonials = [
  {
    quote: "SupportMind AI reduced our response time from 4 hours to under 2 minutes. Customer satisfaction has never been higher.",
    name: "Sarah Chen",
    role: "Head of Customer Success at TechFlow Inc",
    initials: "SC",
  },
  {
    quote: "We cut support costs by 60% while improving quality. The AI handles repetitive tickets, and our team focuses on complex issues.",
    name: "Michael Rodriguez",
    role: "VP of Operations at CloudScale",
    initials: "MR",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);
  const visible = [testimonials[active], testimonials[(active + 1) % testimonials.length]];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Loved by"
          highlight="Thousands"
          subtitle="See what our customers have to say about transforming their support"
        />
        <div className="grid gap-8 lg:grid-cols-2">
          {visible.map((item) => (
            <article key={item.name} className="rounded-2xl border border-border bg-card/70 p-10">
              <Quote className="mb-8 size-12 text-blue-500" />
              <p className="text-xl leading-relaxed text-muted-foreground">{item.quote}</p>
              <div className="mt-8 flex items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-white">
                  {item.initials}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex justify-center gap-5">
          <button
            type="button"
            onClick={() => setActive((value) => (value === 0 ? testimonials.length - 1 : value - 1))}
            className="flex size-12 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/15"
            aria-label="Previous testimonial"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => setActive((value) => (value + 1) % testimonials.length)}
            className="flex size-12 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/15"
            aria-label="Next testimonial"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
