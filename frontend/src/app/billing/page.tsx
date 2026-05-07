"use client";

import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Check, Clock, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// TODO: Fetch from backend GET /tenants/me once endpoint exists
const TRIAL_DAYS_TOTAL = 14;
const TRIAL_DAYS_REMAINING = 14;

const plans = [
  {
    name: "Basic",
    price: "$49",
    period: "/month",
    description: "For small teams getting started",
    features: [
      "5 documents",
      "1,000 messages/month",
      "1 team member",
      "Email support",
      "Standard RAG",
    ],
    cta: "Subscribe",
    highlighted: false,
    href: "/checkout?plan=basic"
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing businesses",
    features: [
      "Unlimited documents",
      "10,000 messages/month",
      "10 team members",
      "Priority support",
      "Advanced RAG",
      "Custom AI instructions",
      "Analytics dashboard",
    ],
    cta: "Subscribe",
    highlighted: true,
    href: "/checkout?plan=pro"
  },
];

export default function BillingPage() {
  const trialProgress =
    ((TRIAL_DAYS_TOTAL - TRIAL_DAYS_REMAINING) / TRIAL_DAYS_TOTAL) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-9 border-2 border-purple-500/50",
            },
          }}
        />
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Trial status */}
        <section className="mb-12 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20">
              <Clock className="size-6 text-purple-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Free Trial
                </h2>
                <p className="text-sm text-muted-foreground">
                  {TRIAL_DAYS_REMAINING} days remaining out of {TRIAL_DAYS_TOTAL}
                </p>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your trial includes full access to all Pro features. No credit card required.
              </p>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground">
              Upgrade when you&apos;re ready. No pressure.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-xl border p-6 transition-all",
                  plan.highlighted
                    ? "border-purple-500/50 bg-gradient-to-b from-purple-500/5 to-transparent shadow-lg shadow-purple-500/10"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-medium text-white shadow-lg shadow-purple-500/25">
                      <Sparkles className="size-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6 space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          plan.highlighted
                            ? "text-purple-400"
                            : "text-green-400"
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]",
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "border border-border bg-accent text-foreground hover:bg-accent/80"
                  )}
                >
                  <Zap className="size-4" />
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
