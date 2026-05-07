import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, Shield, Sparkles } from "lucide-react";

const valueProps = [
  { Icon: FileText, text: "Upload your docs" },
  { Icon: Sparkles, text: "AI learns your business" },
  { Icon: MessageSquare, text: "Answers from your content" },
  { Icon: Shield, text: "No hallucinations" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-background to-purple-950/50" />
      <div className="absolute left-1/4 top-1/4 size-72 rounded-full bg-blue-600/30 blur-[110px] sm:size-96" />
      <div className="absolute bottom-1/4 right-1/4 size-72 rounded-full bg-purple-600/30 blur-[110px] sm:size-96" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-4 py-2 backdrop-blur-sm">
            <Sparkles className="size-4 text-purple-400" />
            <span className="text-sm text-muted-foreground">AI Customer Support Trained on Your Knowledge Base</span>
          </div>

          <h1 className="text-5xl font-bold tracking-normal sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="mb-2 block text-foreground">Your Docs Become</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text pb-2 text-transparent">
              Your Support Agent
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-xl text-muted-foreground md:text-2xl">
            Upload your documentation and FAQs. SupportMind trains an AI agent that answers
            customer questions using <strong className="text-foreground">only your verified content</strong> — accurate, instant, 24/7.
          </p>

          {/* Value props row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 sm:gap-6">
            {valueProps.map(({ Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-accent/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
              >
                <Icon className="size-4 text-purple-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/60 active:scale-95"
            >
              Start Free Trial
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="group relative overflow-hidden rounded-lg border border-border px-8 py-4 text-foreground backdrop-blur-sm transition-all hover:scale-105 hover:border-blue-500/50 hover:bg-accent active:scale-95"
            >
              <span className="relative z-10">See How It Works</span>
              <span className="absolute inset-0 translate-y-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 transition-transform duration-300 group-hover:translate-y-0" />
            </a>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span>Set up in under 10 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
