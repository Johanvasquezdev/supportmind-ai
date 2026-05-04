import { Headphones, TrendingUp, UsersRound } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const industries = [
  {
    Icon: Headphones,
    title: "E-commerce Support",
    description: "Handle order tracking, returns, and product questions across all channels.",
    metric: "45% faster resolution rate",
  },
  {
    Icon: TrendingUp,
    title: "SaaS Onboarding",
    description: "Guide new users through setup, answer technical questions, and reduce churn.",
    metric: "60% faster onboarding",
  },
  {
    Icon: UsersRound,
    title: "HR & Internal Support",
    description: "Answer employee questions about benefits, policies, and IT support 24/7.",
    metric: "70% ticket reduction",
  },
];

export function IndustryCarousel() {
  return (
    <section className="overflow-hidden border-y border-border/60 py-24">
      <SectionHeading
        title="Built for Every"
        highlight="Industry"
        subtitle="Scroll to explore how SupportMind AI transforms support across different sectors"
      />
      <div className="flex snap-x gap-8 overflow-x-auto px-8 pb-6 [scrollbar-width:thin]">
        {industries.map(({ Icon, title, description, metric }) => (
          <article
            key={title}
            className="min-w-[320px] snap-center rounded-2xl border border-border bg-card/70 p-10 md:min-w-[500px]"
          >
            <div className="mb-10 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Icon className="size-10 text-white" />
            </div>
            <h3 className="text-3xl font-semibold text-foreground">{title}</h3>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>
            <span className="mt-8 inline-flex items-center gap-3 rounded-full border border-purple-500/30 bg-purple-500/15 px-5 py-2 text-sm text-foreground">
              <span className="size-2 rounded-full bg-emerald-400" />
              {metric}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
