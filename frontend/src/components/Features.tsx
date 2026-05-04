import type { LucideIcon } from "lucide-react";
import { BarChart3, Brain, Clock, Globe, Shield, Zap } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const features: Feature[] = [
  {
    Icon: Brain,
    title: "Advanced AI Understanding",
    description: "Natural language processing that truly understands customer intent and context.",
  },
  {
    Icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a customer query. Instant responses at any time, any day.",
  },
  {
    Icon: Globe,
    title: "Multi-Language Support",
    description: "Communicate with customers in 95+ languages with perfect accuracy.",
  },
  {
    Icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track performance, sentiment, and resolution rates with detailed insights.",
  },
  {
    Icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption and data privacy.",
  },
  {
    Icon: Zap,
    title: "Instant Integration",
    description: "Connect with Slack, Discord, Email, and 50+ platforms in minutes.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-950/10 to-background" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Scale Support
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Powerful features that grow with your business
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const { Icon } = feature;

  return (
    <article className="group relative">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" />
      <div className="relative h-full rounded-2xl border border-border bg-card p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-white/20">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 transition-transform group-hover:scale-110">
          <Icon className="size-6 text-white" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </div>
    </article>
  );
}
