import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Start",
    description: "Perfect for small teams",
    price: "$49",
    cta: "Start Free Trial",
    features: ["1,000 conversations/month", "Email & chat support", "Basic analytics", "5 team members", "API access"],
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: "$99",
    cta: "Start Free Trial",
    featured: true,
    features: [
      "10,000 conversations/month",
      "Priority support",
      "Advanced analytics",
      "Unlimited team members",
      "Custom integrations",
      "Multi-language support",
      "White-label option",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    cta: "Contact Sales",
    features: ["Unlimited conversations", "Dedicated support", "Custom AI training", "SSO & SAML", "SLA guarantees", "On-premise deployment", "Custom contracts"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Transparent Pricing</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the perfect plan for your team. All plans include a 14-day free trial.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-center">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 xl:p-10 ${
                plan.featured
                  ? "border border-blue-500/30 bg-gradient-to-b from-blue-50/80 dark:from-[#151c33] to-white dark:to-[#0d121f] shadow-2xl shadow-purple-900/20 lg:py-12"
                  : "border border-black/5 dark:border-white/5 bg-white dark:bg-[#0d121f] shadow-xl"
              }`}
            >
              {plan.featured && (
                <div className="absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-3xl bg-gradient-to-r from-blue-400 via-purple-400 to-transparent blur-sm" />
              )}
              {plan.featured && (
                <div className="absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-3xl bg-gradient-to-r from-blue-400 to-purple-400" />
              )}
              
              <h3 className="text-2xl font-bold text-black dark:text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">{plan.description}</p>
              
              <p className="mt-8 flex items-baseline gap-1 text-5xl font-bold tracking-tight text-black dark:text-white">
                {plan.price}
                {plan.price !== "Custom" && <span className="text-lg font-normal text-black/70 dark:text-white/70">/month</span>}
              </p>
              
              <ul className="mt-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-black/70 dark:text-white/70">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                      <Check className="size-3.5 stroke-[3]" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link
                href={plan.cta === "Contact Sales" ? "#footer" : "/sign-up"}
                className={`mt-10 block w-full rounded-xl px-4 py-3.5 text-center text-sm font-semibold transition-all ${
                  plan.featured
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
                    : "border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:scale-[1.02]"
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
