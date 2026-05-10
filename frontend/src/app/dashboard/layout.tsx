"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";
import {
  MessageSquare,
  Settings,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Home,
  BarChart3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-screen w-full flex-col bg-background font-sans text-foreground transition-colors duration-300">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "relative flex flex-col border-r border-border bg-card/50 transition-all duration-300 backdrop-blur-xl z-20",
            collapsed ? "w-20" : "w-64"
          )}
        >
          {/* Sidebar Logo */}
          <div className="flex h-16 items-center px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] bg-gradient-to-br from-blue-600 to-purple-600 text-[18px] font-bold text-white shadow-lg">
                S
              </div>
              {!collapsed && (
                <span className="text-sm font-bold tracking-tight text-foreground">
                  SupportMind AI
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[2px] px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-l-2 border-purple-500"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive && "text-purple-600 dark:text-purple-400"
                    )}
                  />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="space-y-1 p-3">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-[2px] px-3 py-2 text-sm font-medium transition-all text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center"
              )}
              title="Back to Home"
            >
              <Home className="size-5 shrink-0" />
              {!collapsed && <span>Home</span>}
            </Link>
          </div>

          {/* Collapse toggle */}
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-[2px] p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <>
                  <ChevronLeft className="size-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Collapse
                  </span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {sidebarLinks.find(
                (l) => pathname === l.href || pathname.startsWith(l.href + "/")
              )?.label ?? "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex size-9 items-center justify-center rounded-[2px] border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </button>
              )}
              <UserButton
                userProfileProps={{
                  appearance: clerkUserProfileAppearance,
                }}
                appearance={{
                  elements: {
                    avatarBox:
                      "size-9 border-2 border-purple-500/50 shadow-md rounded-[2px]",
                  },
                }}
              />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 flex flex-col min-h-0 relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
