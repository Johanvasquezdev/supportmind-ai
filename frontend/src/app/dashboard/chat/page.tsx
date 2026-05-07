"use client";

import { useRef, useState, useEffect, FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, Bot, User, Loader2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: ChatResponse["context"];
}

interface ChatResponse {
  conversationId: string;
  message: string;
  context: Array<{
    vectorId: string;
    score: number;
    text: string;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export default function ChatPage() {
  const { user } = useUser();
  const api = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<"answer" | "summary" | "exact">("answer");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post<ChatResponse>("/chat", {
        message: trimmed,
        conversationId,
        mode,
      });

      if (!conversationId) {
        setConversationId(res.data.conversationId);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.data.message,
        context: res.data.context,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string; retryAfter?: number } } };
      if (axiosError.response?.status === 429) {
        const retryAfter = axiosError.response.data?.retryAfter ?? 60;
        setError(`Rate limited. Try again in ${retryAfter} seconds.`);
      } else {
        setError(
          axiosError.response?.data?.message ?? "Failed to send message. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as FormEvent);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center relative z-10">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20 shadow-lg shadow-purple-500/10">
              <Bot className="size-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold dark:text-white text-black">
                Hi{user?.firstName ? `, ${user.firstName}` : ""}! How can I help?
              </h3>
              <p className="max-w-md dark:text-white/70 text-black/70">
                Ask anything about your uploaded documents. I&apos;ll find the answer from your knowledge base.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                "What's our refund policy?",
                "How do I reset a password?",
                "Explain our pricing tiers",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border dark:border-white/10 border-black/10 dark:bg-black/40 bg-white/60 backdrop-blur-md px-4 py-2 text-sm dark:text-white/70 text-black/70 transition-all hover:border-purple-500/30 dark:hover:bg-white/10 hover:bg-black/5 dark:hover:text-white hover:text-black shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 py-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20 shadow-sm">
                    <Bot className="size-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-purple-500/20"
                      : "dark:bg-black/40 bg-white/60 backdrop-blur-md dark:border-white/10 border-black/10 dark:text-white text-black"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && msg.context && msg.context.length > 0 && (
                    <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-black/60 dark:text-white/60">
                        <FileText className="size-3.5" />
                        Sources used
                      </p>
                      <div className="space-y-2">
                        {msg.context.slice(0, 3).map((source, index) => (
                          <details
                            key={source.vectorId}
                            className="rounded-lg border border-black/10 bg-black/[0.03] p-2 text-xs dark:border-white/10 dark:bg-white/[0.03]"
                          >
                            <summary className="cursor-pointer text-black/70 dark:text-white/70">
                              Context {index + 1} · score {source.score.toFixed(2)}
                            </summary>
                            <p className="mt-2 line-clamp-4 text-black/60 dark:text-white/60">
                              {source.text}
                            </p>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg dark:bg-black/40 bg-white/60 backdrop-blur-md dark:border-white/10 border-black/10 shadow-sm">
                    <User className="size-4 dark:text-white/70 text-black/70" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/20 shadow-sm">
                  <Bot className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl dark:bg-black/40 bg-white/60 backdrop-blur-md dark:border-white/10 border-black/10 px-4 py-3 shadow-sm">
                  <Loader2 className="size-4 animate-spin text-purple-600 dark:text-purple-400" />
                  <span className="text-sm dark:text-white/70 text-black/70">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      <div className="relative">
        <div className={cn(
          "absolute bottom-0 left-1/2 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 shadow-xl backdrop-blur-md transition-all duration-300 dark:text-red-400 z-20",
          error ? "translate-y-[-1rem] opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}>
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t dark:border-white/10 border-black/10 dark:bg-black/20 bg-white/20 p-4 backdrop-blur-xl">
        <form
          onSubmit={sendMessage}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <div className="relative flex-1">
            <div className="mb-2 flex gap-2">
              {[
                { value: "answer", label: "Answer" },
                { value: "summary", label: "Summary" },
                { value: "exact", label: "Exact" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value as typeof mode)}
                  className={cn(
                    "relative overflow-hidden rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-300 active:scale-95",
                    mode === option.value
                      ? "border-purple-500/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-purple-700 shadow-sm dark:text-purple-300"
                      : "border-black/10 bg-white/50 text-black/60 hover:-translate-y-0.5 hover:bg-white hover:text-black hover:shadow-sm dark:border-white/10 dark:bg-black/30 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                  )}
                >
                  <span className="relative z-10">{option.label}</span>
                  {mode === option.value && (
                    <span className="absolute inset-0 z-0 bg-purple-500/10 dark:bg-purple-500/20" />
                  )}
                </button>
              ))}
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your documents..."
              rows={1}
              className="w-full resize-none rounded-xl border-black/10 bg-white/60 px-4 py-3 pr-12 text-sm text-black shadow-sm backdrop-blur-md transition-all placeholder:text-black/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-white/50"
              disabled={isLoading}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs dark:text-white/50 text-black/50">
          Answers are generated from your uploaded documents only.
        </p>
      </div>
    </div>
  );
}
