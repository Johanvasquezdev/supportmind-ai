"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Globe, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="SupportMind AI home">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
              S
            </span>
            <span className="text-xl font-semibold text-foreground">SupportMind AI</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setIsDark((value) => !value)}
              className="rounded-lg border border-border p-2 transition-all hover:scale-105 hover:bg-accent active:scale-95"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-border p-2 transition-all hover:scale-105 hover:bg-accent active:scale-95"
              aria-label="Language selector"
            >
              <Globe className="size-5" />
              <span className="text-xs font-medium">EN</span>
            </button>

            {isLoaded && !isSignedIn && (
              <>
                <Link
                  href="/sign-in"
                  className="group relative px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
                >
                  Start Free Trial
                </Link>
              </>
            )}

            {isLoaded && isSignedIn && (
              <>
                <Link
                  href="/dashboard/chat"
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Dashboard
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "size-9 border-2 border-purple-500/50",
                    },
                  }}
                />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="text-foreground md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="space-y-3 px-4 py-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDark((value) => !value)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border p-2 transition-all hover:bg-accent"
              >
                {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                <span className="text-sm">{isDark ? "Light" : "Dark"}</span>
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border p-2 transition-all hover:bg-accent"
              >
                <Globe className="size-5" />
                <span className="text-sm">EN</span>
              </button>
            </div>
            <div className="space-y-2 pt-4">
              {isLoaded && !isSignedIn && (
                <>
                  <Link
                    href="/sign-in"
                    className="block w-full px-4 py-2 text-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-center text-white"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
              {isLoaded && isSignedIn && (
                <Link
                  href="/dashboard/chat"
                  className="block w-full rounded-lg border border-border px-4 py-2 text-center text-foreground transition-colors hover:bg-accent"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
