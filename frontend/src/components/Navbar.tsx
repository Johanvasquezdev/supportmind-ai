"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#1a1a2e] bg-[#080810]/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="font-sans text-base font-bold text-[#F0EEE9] tracking-tight">SupportMind</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-sans text-sm text-[#6B6A72] transition-colors hover:text-[#F0EEE9]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-4 md:flex">
               <span className="font-mono text-xs text-[#6B6A72] uppercase tracking-widest cursor-pointer hover:text-[#F0EEE9] transition-colors">EN</span>
               <div className="h-4 w-px bg-[#1a1a2e]" />
            </div>

            {isLoaded && !isSignedIn && (
              <Link
                href="/sign-up"
                className="font-sans text-xs font-bold uppercase tracking-widest text-[#F0EEE9] border border-[#1a1a2e] px-4 py-2 hover:border-[#7c3aed] transition-colors"
              >
                Start Free Trial
              </Link>
            )}

            {isLoaded && isSignedIn && (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/chat"
                  className="font-sans text-xs font-bold uppercase tracking-widest text-[#F0EEE9] border border-[#1a1a2e] px-4 py-2 hover:border-[#7c3aed] transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "size-8 border border-[#1a1a2e] rounded-none",
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
