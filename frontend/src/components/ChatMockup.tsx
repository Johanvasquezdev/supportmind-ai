import { Bot, Send, UserRound } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const messages = [
  {
    role: "user",
    text: "I can't access my account. Can you help?",
    time: "2:34 PM",
  },
  {
    role: "assistant",
    text: "I'd be happy to help you regain access to your account. Let me check a few things. Can you confirm the email address associated with your account?",
    time: "2:34 PM",
  },
  {
    role: "user",
    text: "[email protected]",
    time: "2:35 PM",
  },
  {
    role: "assistant",
    text: "Thanks! I've found your account. Your session expired, so I'm sending a secure reset link to your email now.",
    time: "2:35 PM",
  },
];

export function ChatMockup() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="AI That Actually"
          highlight="Understands"
          subtitle="Watch how SupportMind AI handles real customer conversations with context, empathy, and precision."
        />

        <div className="mx-auto overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0d1428] shadow-2xl shadow-purple-950/30">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <span className="size-3 rounded-full bg-red-500" />
                <span className="size-3 rounded-full bg-yellow-500" />
                <span className="size-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Support Chat</span>
            </div>
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-400">
              AI Active
            </span>
          </div>

          <div className="h-[460px] space-y-8 overflow-hidden p-6 md:p-8">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={`${message.role}-${message.time}-${message.text}`}
                  className={`flex items-start gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                      <Bot className="size-5 text-white" />
                    </span>
                  ) : null}
                  <div className={`max-w-2xl ${isUser ? "text-right" : ""}`}>
                    <div
                      className={`rounded-2xl px-5 py-4 text-left text-sm leading-relaxed md:text-base ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "border border-white/10 bg-white/8 text-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{message.time}</p>
                  </div>
                  {isUser ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <UserRound className="size-5 text-muted-foreground" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-muted-foreground">
              <span className="flex-1">Type your message...</span>
              <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Send className="size-5 text-white" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
