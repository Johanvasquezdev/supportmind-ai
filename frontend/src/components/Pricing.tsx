"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Start",
    description: "Perfect for small teams",
    price: "$49.99",
    cta: "Start Free Trial",
    features: ["1,000 msg", "Email support", "Basic insights", "5 seats", "API access"],
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: "$99.99",
    cta: "Start Free Trial",
    featured: true,
    features: [
      "10,000 msg",
      "Priority support",
      "Advanced stats",
      "Unlimited seats",
      "Custom RAG",
      "Multi-lang",
      "White-label",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    cta: "Contact Sales",
    features: ["Unlimited msg", "Dedicated rep", "Custom model", "SSO/SAML", "SLA help", "On-prem", "Custom billing"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">Simple Pricing</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            Choose the perfect plan for your team. All plans include a 14-day free trial.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`flex flex-col bg-[#0d0d1a] border border-[#1a1a2e] rounded-[2px] p-8 ${
                plan.featured ? "border-t-2 border-t-[#7c3aed]" : ""
              }`}
            >
              <div className="mb-8">
                <h3 className="font-sans text-[18px] font-bold text-[#F0EEE9] mb-2">{plan.name}</h3>
                <p className="font-sans text-[13px] text-[#6B6A72]">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="font-sans text-[52px] font-bold text-[#F0EEE9] leading-none">{plan.price}</span>
                {plan.price !== "Custom" && (
                  <span className="font-sans text-[14px] text-[#6B6A72]">/month</span>
                )}
              </div>

              <div className="flex-1 mb-8">
                <div className="flex flex-wrap gap-2">
                  {plan.features.map((feature) => (
                    <span 
                      key={feature} 
                      className="font-mono text-[11px] text-[#6B6A72] border border-[#1a1a2e] rounded-[2px] px-2 py-1"
                    >
                      [ {feature} ]
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={plan.cta === "Contact Sales" ? "#footer" : "/sign-up"}
                className={`w-full py-4 rounded-[2px] font-sans text-xs font-bold uppercase tracking-widest text-center transition-all ${
                  plan.featured 
                    ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]" 
                    : "border border-[#1a1a2e] text-[#F0EEE9] hover:border-[#7c3aed]"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}
