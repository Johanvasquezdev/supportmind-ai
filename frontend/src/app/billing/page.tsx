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
    <div className="min-h-screen bg-background font-sans selection:bg-purple-500/30">
      {/* Top bar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl sticky top-0 z-50">
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-9 border-2 border-purple-500/50 rounded-[2px]",
            },
          }}
        />
      </header>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Trial status */}
        <section className="group relative mb-12 rounded-[2px] border border-border bg-card/50 p-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />
          <div className="flex items-start gap-6">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[2px] bg-purple-600/10 border border-purple-500/20">
              <Clock className="size-6 text-purple-500" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#7c3aed]">
                    Free Trial
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {TRIAL_DAYS_REMAINING} days remaining out of {TRIAL_DAYS_TOTAL}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-muted rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-700 ease-out"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              <p className="text-[11px] font-sans text-muted-foreground leading-relaxed max-w-md">
                Your trial includes full access to all Pro features. Start your transition to production-ready AI with no credit card required.
              </p>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-[#F0EEE9]">
              Choose Your Plan
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              Upgrade when you&apos;re ready. No pressure.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "group relative flex flex-col rounded-[2px] border p-8 transition-all duration-300",
                  plan.highlighted
                    ? "border-t-[#7c3aed] border-t-2 border-border bg-purple-500/5 shadow-[0_0_50px_-12px_rgba(124,58,237,0.2)]"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                <div className={cn(
                  "absolute inset-x-0 top-0 h-px bg-[#1a1a2e] transition-opacity rounded-t-[2px]",
                  plan.highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} />
                


                <div className="mb-8 space-y-3">
                  <h3 className="text-2xl font-bold text-[#F0EEE9]">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground uppercase">{plan.period}</span>
                  </div>
                </div>

                <ul className="mb-10 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <Check
                        className={cn(
                          "size-4 shrink-0 mt-0.5",
                          plan.highlighted ? "text-purple-400" : "text-purple-400/60"
                        )}
                      />
                      <span className="text-[13px] font-sans">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-[2px] px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95",
                    plan.highlighted
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500"
                      : "border border-border bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  <Zap className="size-3.5" />
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Enterprise Grade Security · PCI DSS Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
