"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
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
  BarChart3,
  Search,
  Code,
  Laptop,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const sidebarLinks = [
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Widget", href: "/dashboard/settings/widget", icon: Laptop },
  { label: "API Docs", href: "/dashboard/api-reference", icon: Code },
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
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutLabel] = useState(() =>
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac")
      ? "⌘K"
      : "Ctrl+K",
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] bg-[#7c3aed] text-[18px] font-bold text-white shadow-lg">
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

          {/* Search */}
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={cn(
                "flex w-full items-center rounded-[2px] px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                collapsed ? "justify-center" : "justify-between"
              )}
              aria-label="Open search"
            >
              <span className="flex items-center gap-3">
                <Search className="size-5 shrink-0" />
                {!collapsed && <span>Search</span>}
              </span>
              {!collapsed && (
                <span className="font-mono text-[10px] text-[#6B6A72]">
                  {shortcutLabel}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="border-t border-border px-3 py-3">
            <div className={cn(
              "flex items-center gap-3 rounded-[2px] px-3 py-2",
              collapsed ? "justify-center" : "justify-start"
            )}>
              <UserButton
                userProfileProps={{
                  appearance: clerkUserProfileAppearance,
                }}
                appearance={{
                  elements: {
                    avatarBox:
                      "size-8 border-2 border-purple-500/50 rounded-[2px]",
                  },
                }}
              />
              {!collapsed && (
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <p className="text-xs font-bold text-foreground leading-snug">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Collapse toggle */}
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-[2px] px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 flex flex-col min-h-0 relative">
            {children}
          </main>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
