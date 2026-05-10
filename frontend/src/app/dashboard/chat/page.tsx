"use client";

import { useRef, useState, useEffect, FormEvent } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  FileText,
  Play,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { VoiceMicButton } from "@/components/ui/VoiceMicButton";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { synthesizeSpeech } from "@/lib/voice-api";
import { CitationBadge } from "@/components/chat/CitationBadge";
import { SourcesList } from "@/components/chat/SourcesList";
import { parseMessageWithCitations, ContextItem } from "@/lib/parse-citations";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: Array<{
    vectorId: string;
    score: number;
    text: string;
    metadata?: {
      documentId?: string;
      documentTitle?: string;
      chunkIndex?: number;
    };
  }>;
  conversationId?: string;
  createdAt: string;
  isStreaming?: boolean;
  isError?: boolean;
}

interface ChatResponse {
  conversationId: string;
  message: string;
  context: Array<{
    vectorId: string;
    score: number;
    text: string;
    metadata?: {
      documentId?: string;
      documentTitle?: string;
      chunkIndex?: number;
    };
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  messages: Message[];
}

export default function ChatPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const api = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"answer" | "summary" | "exact">("answer");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [activeAudioMessageId, setActiveAudioMessageId] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<{ blob: Blob; text: string } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    state: voiceState,
    start: startVoice,
    stop: stopVoice,
    error: voiceError,
    secondsRemaining,
    transcript
  } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const fetchConversations = async () => {
    try {
      const res = await api.get<Conversation[]>("/chat/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get<any[]>("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchDocuments();
  }, []);

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await api.get<Message[]>(`/chat/conversations/${id}/messages`);
      setMessages(res.data);
      setConversationId(id);
    } catch (err) {
      setError("Failed to load conversation history.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  };

  // Auto-scroll when messages change, but respect user preference
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Detect user scroll to disable auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoading && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [isLoading, isStreaming]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      // Ignore audio errors (e.g. user hasn't interacted yet)
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isStreaming) return;

    setError(null);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add empty assistant message that will be streamed into
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      context: [],
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }]);

    setIsStreaming(true);
    setIsLoading(false);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication failed");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
            mode,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json().catch(() => ({}));
          const retryAfter = data?.retryAfter ?? 60;
          throw new Error(`Rate limited. Try again in ${retryAfter} seconds.`);
        }
        throw new Error(response.statusText || "Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response");
      }

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE messages are separated by double newlines
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const event = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 2);

          if (event.startsWith("data: ")) {
            try {
              const data = JSON.parse(event.slice(6));

              if (data.type === "token") {
                if (!fullContent) {
                  playNotificationSound();
                }
                fullContent += data.content;
                setMessages((prev) => prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: fullContent }
                    : msg
                ));
                setAutoScroll(true);
              }

              if (data.type === "done") {
                setConversationId(data.conversationId);
                setMessages((prev) => prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: fullContent,
                        context: data.context,
                        conversationId: data.conversationId,
                        isStreaming: false,
                      }
                    : msg
                ));
                setIsStreaming(false);
                fetchConversations();
              }

              if (data.type === "error") {
                const isRateLimit = data.message?.toLowerCase().includes("rate limit") || 
                      data.message?.toLowerCase().includes("busy") || 
                      data.message?.toLowerCase().includes("429") ||
                      data.message?.toLowerCase().includes("capacity");
                const displayMsg = isRateLimit 
                  ? "The AI is currently processing many requests. Please wait about 10 seconds and try again."
                  : "Something went wrong. Please try again.";

                setMessages((prev) => prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: displayMsg,
                        isStreaming: false,
                        isError: true,
                      }
                    : msg
                ));
                setIsStreaming(false);
                setError(data.message || "Stream error");
              }
            } catch (parseErr) {
              console.error("Failed to parse SSE message:", parseErr);
            }
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch (err: any) {
      console.error("Stream error:", err);
      const isRateLimit = err.message?.toLowerCase().includes("rate limit") || 
                        err.message?.toLowerCase().includes("busy") || 
                        err.message?.toLowerCase().includes("429") ||
                        err.message?.toLowerCase().includes("capacity");
      const displayMsg = isRateLimit 
        ? "The AI is currently at capacity. Please take a 10-second break and try again!" 
        : (err.message || "Something went wrong. Please try again.");

      setMessages((prev) => prev.map((msg) =>
        msg.id === assistantId
          ? {
              ...msg,
              content: displayMsg,
              isStreaming: false,
              isError: true,
            }
          : msg
      ));
      setIsStreaming(false);
      setError(displayMsg);
    }

    inputRef.current?.focus();
  };

  const retryMessage = async (messageContent: string) => {
    // Remove the error message
    setMessages((prev) => prev.filter((msg) => !msg.isError));
    // Resend the message
    setInput(messageContent);
    // Trigger send
    const fakeEvent = { preventDefault: () => {} } as FormEvent;
    await sendMessage(fakeEvent);
  };

  const handleSynthesize = async (messageId: string, content: string) => {
    try {
      setActiveAudioMessageId(messageId);

      const token = await getToken();
      if (!token) return;

      const blob = await synthesizeSpeech(content, token);
      setAudioData({ blob, text: content });
    } catch (err) {
      console.error("Synthesis failed", err);
      setActiveAudioMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as FormEvent);
    }
  };

  return (
    <div className="flex flex-1 h-full min-h-0 relative overflow-hidden bg-transparent font-sans">
      {/* History Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 relative",
        isHistoryOpen ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-[2px] hover:bg-muted text-muted-foreground transition-colors"
              title="Back to Home"
            >
              <Home size={16} />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">History</span>
          </div>
          <button
            onClick={startNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={cn(
                "w-full text-left rounded-[2px] p-3 transition-all group relative",
                conversationId === conv.id
                  ? "bg-purple-600/10 border border-purple-500/20 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="text-xs font-medium truncate pr-4">
                {conv.title || conv.messages[0]?.content?.substring(0, 40) || "New Conversation"}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 group-hover:text-muted-foreground">
                {new Date(conv.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground italic px-4">
              Your conversation history will appear here.
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-h-0 relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="absolute left-4 top-4 z-30 flex size-8 items-center justify-center rounded-[2px] border border-border bg-card/50 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-sm text-muted-foreground hover:text-foreground"
          title={isHistoryOpen ? "Hide history" : "Show history"}
        >
          {isHistoryOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center relative z-10">
              <div className="group relative flex size-16 items-center justify-center rounded-[2px] border border-border bg-card shadow-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent transition-opacity" />
                <Bot className="size-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 font-sans">
                  Hi{user?.firstName ? `, ${user.firstName}` : ""}!
                </h3>
                <p className="max-w-md text-muted-foreground text-sm font-sans">
                  Ask anything about your knowledge base. I&apos;ll provide grounded answers with verifiable sources.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {documents.length === 0 ? (
                  <Link
                    href="/dashboard/documents"
                    className="rounded-[2px] border border-purple-500/30 bg-purple-500/10 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20 active:scale-95"
                  >
                    Upload your first document to get started →
                  </Link>
                ) : (
                  <>
                    {documents.slice(0, 3).map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setInput(`Ask about ${doc.title}`)}
                        className="group relative rounded-[2px] border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        Ask about {doc.title.length > 20 ? `${doc.title.substring(0, 20)}...` : doc.title}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 py-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-4 group",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-border bg-card shadow-sm">
                      <Bot className="size-4 text-purple-500" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[2px] px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-purple-600 text-white border border-purple-600"
                        : "bg-card border border-border text-foreground"
                    )}
                  >
                    <div className="text-[14px] leading-relaxed overflow-hidden font-sans">
                      {msg.role === "assistant" && !msg.content && msg.isStreaming ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Thinking</span>
                        </div>
                      ) : (
                        <>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({children}) => <p className="mb-4 last:mb-0 whitespace-pre-wrap">{children}</p>,
                              strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                              code: ({children}) => <code className="bg-muted rounded-[2px] px-1.5 py-0.5 font-mono text-[12px]">{children}</code>,
                              text: ({children}) => {
                                if (typeof children === 'string' && msg.role === 'assistant') {
                                  const segments = parseMessageWithCitations(children, msg.context as any);
                                  return (
                                    <>
                                      {segments.map((seg, i) => {
                                        if (seg.type === 'citation') {
                                          return (
                                            <CitationBadge
                                              key={`citation-${i}`}
                                              index={seg.index}
                                              item={seg.item as any}
                                              onClick={(idx) => setHighlightedIndex(idx)}
                                            />
                                          );
                                        }
                                        return <span key={`text-${i}`}>{seg.content}</span>;
                                      })}
                                    </>
                                  );
                                }
                                return children;
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {/* Streaming cursor */}
                          {msg.isStreaming && (
                            <span className="inline-block w-0.5 h-[1.2em] bg-foreground animate-[blink_0.7s_infinite] ml-1 align-middle" />
                          )}
                        </>
                      )}
                    </div>

                    {/* Error state with retry */}
                    {msg.isError && (
                      <button
                        type="button"
                        onClick={() => retryMessage(msg.content)}
                        className="mt-3 font-mono text-[11px] text-red-500 hover:text-foreground transition-colors"
                      >
                        ↺ Try again
                      </button>
                    )}

                    {/* Sources appear after streaming completes */}
                    {msg.role === "assistant" && !msg.isStreaming && msg.context && msg.context.length > 0 && (
                      <div className="animate-[fadeIn_0.3s_ease-out_0.2s_forwards]" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                        <SourcesList
                          context={msg.context as any}
                          highlightedIndex={highlightedIndex}
                        />
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] bg-card border border-border shadow-sm overflow-hidden">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt={user.fullName || "User"} className="size-full object-cover" />
                      ) : (
                        <User className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              ))}


              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        <div className="relative">
          <div className={cn(
            "absolute bottom-0 left-1/2 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 items-center gap-2 rounded-[2px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 shadow-xl backdrop-blur-md transition-all duration-300 z-40",
            error ? "translate-y-[-1rem] opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}>
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1 text-xs font-bold uppercase tracking-wider">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-500 transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-card p-4">
          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-3xl items-end gap-3"
          >
            <div className="relative flex-1">
              <div className="mb-2 flex gap-2">
                  {/* Mode tabs */}
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
                        "relative overflow-hidden rounded-[2px] border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-95",
                        mode === option.value
                          ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "border-border bg-muted text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option.label}
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
                placeholder="Ask about your knowledge..."
                rows={1}
                className="w-full resize-none rounded-[2px] border border-border bg-muted/30 px-4 py-3 pr-12 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                disabled={isStreaming}
                style={{ minHeight: '44px', maxHeight: '200px' }}
              />
              {voiceError && (
                <div className="absolute -bottom-6 left-0 font-mono text-[10px] text-red-500 font-bold uppercase tracking-wider">
                  {voiceError}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <VoiceMicButton
                state={voiceState}
                onStart={startVoice}
                onStop={stopVoice}
                secondsRemaining={secondsRemaining}
                size={44}
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-purple-600 text-white transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-30"
              >
              {isStreaming ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </button>
          </div>
        </form>
          {/* Streaming indicator text */}
          <div className={cn(
            "mx-auto mt-2 max-w-3xl text-center font-mono text-[11px] text-muted-foreground transition-opacity duration-300",
            isStreaming ? "opacity-100" : "opacity-0"
          )}>
            AI is responding...
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Grounded Knowledge System · AI-G-72
          </p>
        </div>
      </div>
    </div>
  );
}
