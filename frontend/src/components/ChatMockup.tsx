"use client";

import { Bot, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "./SectionHeading";

const messages = [
  {
    role: "user" as const,
    text: "I can't access my account. Can you help?",
    time: "2:34 PM",
  },
  {
    role: "assistant" as const,
    text: "I'd be happy to help you regain access to your account. Let me check a few things. Can you confirm the email address associated with your account?",
    time: "2:34 PM",
  },
  {
    role: "user" as const,
    text: "[email protected]",
    time: "2:35 PM",
  },
  {
    role: "assistant" as const,
    text: "Thanks! I've found your account. I can see you haven't logged in for 90 days, so your session expired. I'm sending a secure reset link to your email now. You should receive it within 2 minutes.",
    time: "2:35 PM",
  },
  {
    role: "user" as const,
    text: "Got it, thanks! That was really fast.",
    time: "2:36 PM",
  },
  {
    role: "assistant" as const,
    text: "You're welcome! Once you reset your password, I recommend enabling two-factor authentication for extra security. Would you like me to walk you through that?",
    time: "2:36 PM",
  },
];

export function ChatMockup() {
  const sectionRef = useRef<HTMLElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Trigger animation when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  // Stagger messages appearing one by one
  useEffect(() => {
    if (!hasStarted) return;
    if (visibleCount >= messages.length) return;

    const delay = visibleCount === 0 ? 300 : 800;
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [hasStarted, visibleCount]);

  // Auto-scroll chat container as messages appear
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [visibleCount]);

  return (
    <section ref={sectionRef} className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="AI That Actually"
          highlight="Understands"
          subtitle="Watch how SupportMind AI handles real customer conversations with context, empathy, and precision."
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Chat window */}
          <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-white dark:bg-[#0d1428] shadow-2xl shadow-purple-950/30">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <span className="size-3 rounded-full bg-red-500" />
                  <span className="size-3 rounded-full bg-yellow-500" />
                  <span className="size-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">Support Chat</span>
              </div>
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-600 dark:text-green-400">
                <span className="mr-1">•</span> AI Active
              </span>
            </div>

            {/* Scrollable chat body */}
            <div
              ref={chatContainerRef}
              className="h-[420px] space-y-6 overflow-y-auto scroll-smooth p-6 md:p-8 chat-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(124, 58, 237, 0.4) transparent",
              }}
            >
              {messages.slice(0, visibleCount).map((message, i) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={`${message.role}-${message.time}-${i}`}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div
                      className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                          <Bot className="size-4 text-white" />
                        </span>
                      )}
                      <div className={`max-w-md ${isUser ? "text-right" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-left text-sm leading-relaxed ${
                            isUser
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              : "border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 text-black dark:text-white"
                          }`}
                        >
                          {message.text}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground/60">{message.time}</p>
                      </div>
                      {isUser && (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                          <UserRound className="size-4 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator while messages still loading */}
              {hasStarted && visibleCount < messages.length && (
                <div className="flex items-start gap-3 animate-fade-in-up">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                    <Bot className="size-4 text-white" />
                  </span>
                  <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="size-2 animate-bounce rounded-full bg-purple-500 dark:bg-purple-400" style={{ animationDelay: "0ms" }} />
                      <span className="size-2 animate-bounce rounded-full bg-purple-500 dark:bg-purple-400" style={{ animationDelay: "150ms" }} />
                      <span className="size-2 animate-bounce rounded-full bg-purple-500 dark:bg-purple-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-black/10 dark:border-white/10 p-4">
              <div className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-muted-foreground">
                <span className="flex-1 text-sm">Type your message...</span>
                <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 transition-transform hover:scale-110">
                  <Send className="size-4 text-white" />
                </span>
              </div>
            </div>
          </div>

          {/* View Dashboard CTA */}
          <div className="mt-6 flex justify-end">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
            >
              View Dashboard
              <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
