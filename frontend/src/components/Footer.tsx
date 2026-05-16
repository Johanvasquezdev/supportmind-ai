"use client";

import Link from "next/link";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#security" },
  { label: "Industries", href: "#industries" },
  { label: "FAQ", href: "#faq" },
];

export function Footer() {
  return (
    <footer id="footer" className="bg-[#080810] py-[100px] border-t border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Logo & Copyright (4 columns) */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="font-sans text-base font-bold text-[#F0EEE9] tracking-tight">
              SupportMind
            </Link>
            <div className="space-y-2">
              <p className="font-sans text-[13px] text-[#6B6A72]">
                SupportMind AI © 2026. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#22c55e]" />
                <span className="font-mono text-[11px] text-[#6B6A72] uppercase tracking-wider">
                  Operational
                </span>
              </div>
            </div>
          </div>

          {/* Links (4 columns) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-mono text-[11px] font-bold text-[#6B6A72] uppercase tracking-widest">Product</h4>
              <ul className="space-y-3">
                {links.slice(0, 3).map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="font-sans text-[13px] text-[#6B6A72] hover:text-[#F0EEE9] transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono text-[11px] font-bold text-[#6B6A72] uppercase tracking-widest">Company</h4>
              <ul className="space-y-3">
                {links.slice(3).map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="font-sans text-[13px] text-[#6B6A72] hover:text-[#F0EEE9] transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA (4 columns) */}
          <div className="md:col-span-4 space-y-6">
            <h3 className="font-sans text-[20px] font-bold text-[#F0EEE9]">Ready to scale?</h3>
            <p className="font-sans text-[14px] text-[#6B6A72] leading-relaxed">
              Start your 14-day free trial today. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-block bg-[#7c3aed] text-white font-sans text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-[2px] hover:bg-[#6d28d9] transition-colors"
            >
              Get Started
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
