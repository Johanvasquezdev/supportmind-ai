import { MessageSquare, TrendingUp, UsersRound, Zap, Globe, BarChart3 } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const industries = [
  {
    Icon: MessageSquare,
    title: "E-commerce Support",
    description: "Handle order tracking, returns, and product questions instantly across all channels.",
    metric: "95% resolution rate",
    iconBg: "bg-blue-600",
    dotBg: "bg-blue-400",
  },
  {
    Icon: TrendingUp,
    title: "SaaS Onboarding",
    description: "Guide new users through setup, answer technical questions, and reduce churn.",
    metric: "60% faster onboarding",
    iconBg: "bg-fuchsia-600",
    dotBg: "bg-fuchsia-400",
  },
  {
    Icon: UsersRound,
    title: "HR & Internal Support",
    description: "Answer employee questions about benefits, policies, and IT support 24/7.",
    metric: "70% ticket reduction",
    iconBg: "bg-rose-500",
    dotBg: "bg-rose-400",
  },
  {
    Icon: Zap,
    title: "Financial Services",
    description: "Provide instant account information, transaction details, and fraud alerts securely.",
    metric: "99.9% accuracy",
    iconBg: "bg-orange-500",
    dotBg: "bg-orange-400",
  },
  {
    Icon: Globe,
    title: "Travel & Hospitality",
    description: "Manage bookings, provide recommendations, and handle cancellations in real-time.",
    metric: "24/7 availability",
    iconBg: "bg-emerald-600",
    dotBg: "bg-emerald-400",
  },
  {
    Icon: BarChart3,
    title: "Healthcare Support",
    description: "Schedule appointments, answer FAQ, and provide HIPAA-compliant information.",
    metric: "HIPAA certified",
    iconBg: "bg-cyan-600",
    dotBg: "bg-cyan-400",
  },
];

export function IndustryCarousel() {
  return (
    <section className="overflow-hidden border-y border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Built for Every <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">Industry</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Scroll to explore how SupportMind AI transforms support across different sectors
          </p>
          <p className="mt-2 text-sm text-muted-foreground/60">Scroll horizontally</p>
        </div>
      </div>
      
      <div className="mt-16 flex snap-x gap-6 overflow-x-auto px-4 pb-12 sm:px-6 lg:px-8 [scrollbar-width:thin]">
        {/* Spacer for proper alignment on large screens */}
        <div className="hidden shrink-0 lg:block lg:w-[calc((100vw-80rem)/2)]"></div>
        
        {industries.map(({ Icon, title, description, metric, iconBg, dotBg }) => (
          <article
            key={title}
            className="group relative min-w-[300px] shrink-0 snap-center rounded-2xl border border-border bg-card/40 p-8 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 md:min-w-[340px]"
          >
            {/* Highlight gradient */}
            <div className="absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-transparent blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className={`mb-6 flex size-14 items-center justify-center rounded-2xl ${iconBg}`}>
              <Icon className="size-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground">
                <span className={`size-1.5 rounded-full ${dotBg}`} />
                {metric}
              </span>
            </div>
          </article>
        ))}
        
        {/* Spacer at the end */}
        <div className="w-4 shrink-0 sm:w-6 lg:hidden"></div>
      </div>
    </section>
  );
}
