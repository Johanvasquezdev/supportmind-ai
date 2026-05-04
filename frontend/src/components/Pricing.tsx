import Link from "next/link";
import { Check } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small teams",
    price: "$49",
    cta: "Start Free Trial",
    features: ["1,000 conversations/month", "Email & chat support", "Basic analytics", "5 team members", "API access"],
  },
  {
    name: "Professional",
    description: "For growing businesses",
    price: "$149",
    cta: "Start Free Trial",
    featured: true,
    features: [
      "10,000 conversations/month",
      "Priority support",
      "Advanced analytics",
      "Unlimited team members",
      "Custom integrations",
      "Multi-language support",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    cta: "Contact Sales",
    features: ["Unlimited conversations", "Dedicated support", "Custom AI training", "SSO & SAML", "SLA guarantees"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Simple,"
          highlight="Transparent Pricing"
          subtitle="Choose the perfect plan for your team. All plans include a 14-day free trial."
        />
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-10 ${
                plan.featured
                  ? "border-blue-500/60 bg-gradient-to-br from-blue-950/70 to-purple-950/60 shadow-2xl shadow-purple-700/20"
                  : "border-border bg-card/70"
              }`}
            >
              <h3 className="text-3xl font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-4 text-muted-foreground">{plan.description}</p>
              <p className="mt-10 text-6xl font-bold text-foreground">
                {plan.price}
                {plan.price.startsWith("$") ? <span className="text-lg font-normal text-muted-foreground"> /month</span> : null}
              </p>
              <ul className="mt-10 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex size-6 items-center justify-center rounded-full bg-purple-600 text-white">
                      <Check className="size-4" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta === "Contact Sales" ? "#footer" : "/register"}
                className={`mt-10 block rounded-lg px-6 py-4 text-center font-semibold ${
                  plan.featured
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "border border-border text-foreground hover:bg-accent"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
