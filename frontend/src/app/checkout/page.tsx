"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useApi } from "@/hooks/use-api";

type PlanId = "basic" | "pro";

const plans: Record<PlanId, { name: string; price: string }> = {
  basic: { name: "Basic Plan", price: "$49.00" },
  pro: { name: "Pro Plan", price: "$99.00" },
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
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] md:flex-row">
      <div className="w-full border-r border-white/5 bg-[#111111] p-8 md:w-1/2 md:p-16 lg:w-5/12">
        <Link
          href="/billing"
          className="mb-12 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Subscribe to SupportMind AI
          </p>
          <h1 className="mt-2 flex items-baseline gap-2 text-3xl font-semibold text-white">
            {selectedPlan.price}
            <span className="text-base font-normal text-muted-foreground">
              per month
            </span>
          </h1>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between border-b border-white/10 pb-6">
            <div>
              <p className="font-medium text-white">{selectedPlan.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Billed monthly
              </p>
            </div>
            <p className="font-medium text-white">{selectedPlan.price}</p>
          </div>

          <div className="flex justify-between font-semibold text-white">
            <p>Total due today</p>
            <p>{selectedPlan.price}</p>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-400">
                14-Day Money-Back Guarantee
              </p>
              <p className="mt-1 text-xs text-blue-400/70">
                If you are not 100% satisfied, you can cancel within 14 days for
                a full refund.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#0a0a0a] p-8 md:w-1/2 md:p-16 lg:w-7/12">
        <div className="mx-auto max-w-md space-y-8">
          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              Secure checkout
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Payment details are handled by Stripe Checkout. SupportMind never
              stores card numbers.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-400" />
              <p className="font-medium text-white">What happens next</p>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Stripe opens a hosted payment page.</li>
              <li>Your subscription starts after payment succeeds.</li>
              <li>You return to SupportMind automatically.</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={isRedirecting}
            onClick={startCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-center font-medium text-white transition-all hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRedirecting ? (
              <>
                <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Redirecting to Stripe...
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Continue to Stripe
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you will be redirected to Stripe to complete your
            subscription securely.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
      <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" />
    </div>
  );
}
