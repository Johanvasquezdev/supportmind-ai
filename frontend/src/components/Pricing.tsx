import Link from "next/link";
import { Check } from "lucide-react";

// constante que describe los tipos de planes 
const plans = [
  {
    name: "Start",
    description: "Perfect for small teams",
    price: "$49.99",
    cta: "Start Free Trial",
    features: ["1,000 conversations/month", "Email & chat support", "Basic analytics", "5 team members", "API access"],
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: "$99.99",
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
              className={`relative flex flex-col rounded-3xl p-8 xl:p-10 transition-all duration-300 border border-border bg-card/40 shadow-xl backdrop-blur-md ${
                plan.featured ? "shadow-purple-500/10 lg:py-12" : "hover:-translate-y-1"
              }`}
            >
              {/* Highlight gradient */}
              <div className={`absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-3xl bg-gradient-to-r from-blue-400 via-purple-500 to-transparent blur-sm transition-opacity duration-300 ${plan.featured ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              <div className={`absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-3xl bg-gradient-to-r from-blue-400 to-purple-600 transition-opacity duration-300 ${plan.featured ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-purple-900/40">
                    <span className="size-1.5 animate-pulse rounded-full bg-white" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              
              <p className="mt-8 flex items-baseline gap-1 text-5xl font-bold tracking-tight text-foreground">
                {plan.price}
                {plan.price !== "Custom" && (
                  <span className="text-lg font-normal text-muted-foreground">
                    /month
                  </span>
                )}
              </p>
              
              <ul className="mt-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-600/10 text-purple-500 dark:text-purple-400">
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
                    : "border border-border bg-muted/50 text-foreground hover:bg-muted hover:scale-[1.02]"
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
