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
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
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
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <div className="flex h-screen relative overflow-hidden dark:bg-[#0a0a0a] bg-slate-50">
      {/* Background gradients for glassmorphism effect */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[128px]" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[128px]" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-indigo-600/20 dark:bg-indigo-600/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[128px]" />

      {/* Main Content Wrapper */}
      <div className="flex h-full w-full z-10 relative">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r dark:border-white/10 border-black/10 dark:bg-black/40 bg-white/40 backdrop-blur-2xl transition-all duration-300 shadow-2xl",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b dark:border-white/10 border-black/10 px-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-500/25">
              S
            </span>
            {!collapsed && (
              <span className="text-lg font-semibold dark:text-white text-black">
                SupportMind
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {sidebarLinks.map(({ label, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:text-white text-black shadow-sm dark:border-purple-500/30 border-purple-500/20 border"
                      : "dark:text-white/70 text-black/70 dark:hover:bg-white/5 hover:bg-black/5 dark:hover:text-white hover:text-black"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className={cn("size-5 shrink-0", isActive && "text-purple-500 dark:text-purple-400")} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div className="border-t dark:border-white/10 border-black/10 p-2">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-lg p-2 dark:text-white/70 text-black/70 transition-colors dark:hover:bg-white/5 hover:bg-black/5 dark:hover:text-white hover:text-black"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <>
                  <ChevronLeft className="size-5" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b dark:border-white/10 border-black/10 dark:bg-black/20 bg-white/20 px-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold dark:text-white text-black">
              {sidebarLinks.find(
                (l) => pathname === l.href || pathname.startsWith(l.href + "/")
              )?.label ?? "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsDark((value) => !value)}
                className="flex size-9 items-center justify-center rounded-lg border border-black/10 bg-white/50 text-black/70 shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Toggle dashboard theme"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <UserButton
                userProfileProps={{
                  appearance: clerkUserProfileAppearance,
                }}
                appearance={{
                  elements: {
                    avatarBox: "size-9 border-2 border-purple-500/50 shadow-md",
                  },
                }}
              />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
