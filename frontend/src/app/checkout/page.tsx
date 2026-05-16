"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type PlanId = "basic" | "pro";

const plans: Record<PlanId, { name: string; price: string }> = {
  basic: { name: "Basic Plan", price: "$49.99" },
  pro: { name: "Pro Plan", price: "$99.99" },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const api = useApi();
  const searchParams = useSearchParams();
  const plan = useMemo<PlanId>(() => {
    return searchParams.get("plan") === "pro" ? "pro" : "basic";
  }, [searchParams]);
  const selectedPlan = plans[plan];

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await api.post<{ url: string }>(
        "/billing/checkout-session",
        { plan }
      );
      window.location.href = response.data.url;
    } catch {
      setError(
        "Stripe checkout is not ready. Check STRIPE_SECRET_KEY and the plan price IDs."
      );
      setIsRedirecting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans md:flex-row selection:bg-purple-500/30">
      {/* Left Panel: Summary */}
      <div className="group relative w-full border-r border-border bg-card/50 p-8 md:w-1/2 md:p-16 lg:w-5/12 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />
        <Link
          href="/billing"
          className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Subscribe to SupportMind AI
          </p>
          <h1 className="mt-3 flex items-baseline gap-2 text-4xl font-bold tracking-tight text-foreground">
            {selectedPlan.price}
            <span className="text-sm font-mono font-normal uppercase text-muted-foreground">
              per month
            </span>
          </h1>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between border-b border-border pb-6">
            <div>
              <p className="font-bold text-[#F0EEE9]">{selectedPlan.name}</p>
              <p className="mt-1 text-xs font-mono text-muted-foreground uppercase">
                Billed monthly
              </p>
            </div>
            <p className="font-mono text-sm text-foreground">{selectedPlan.price}</p>
          </div>

          <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-foreground">
            <p>Total due today</p>
            <p>{selectedPlan.price}</p>
          </div>
        </div>

        <div className="mt-12 rounded-[2px] border border-purple-500/20 bg-purple-500/5 p-6 relative overflow-hidden group/guarantee">
          <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />
          <div className="flex gap-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-purple-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#F0EEE9]">
                14-Day Money-Back Guarantee
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                If you are not 100% satisfied with your production AI workspace, you can cancel within 14 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Action */}
      <div className="w-full bg-background p-8 md:w-1/2 md:p-16 lg:w-7/12 relative overflow-hidden group/action">
        <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />
        <div className="mx-auto max-w-md space-y-10">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
              Secure Checkout
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Payment details are handled by Stripe Checkout. SupportMind AI maintains enterprise-grade security and never stores your card information.
            </p>
          </div>

          <div className="group relative rounded-[2px] border border-border bg-card p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="size-5 text-purple-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">What happens next</p>
            </div>
            <ul className="space-y-4 text-[13px] font-sans text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-purple-500/50 font-mono">01</span>
                Stripe opens a secure, hosted payment page.
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500/50 font-mono">02</span>
                Your subscription initializes immediately after payment.
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500/50 font-mono">03</span>
                You will return to your workspace automatically.
              </li>
            </ul>
          </div>

          {error && (
            <div className="rounded-[2px] border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold uppercase tracking-widest text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={isRedirecting}
            onClick={startCheckout}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-[2px] p-5 text-center text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:cursor-not-allowed",
              isRedirecting
                ? "bg-muted text-muted-foreground"
                : "bg-[#7c3aed] text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500"
            )}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Continue to Stripe
              </>
            )}
          </button>

          <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Encrypted Transaction · SSL Secured
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="size-8 animate-spin rounded-[2px] border-2 border-border border-t-purple-500" />
    </div>
  );
}
