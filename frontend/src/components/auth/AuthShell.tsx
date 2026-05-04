import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

type AuthShellProps = {
  eyebrow: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-background to-purple-950/50" />
      <div className="absolute left-1/2 top-24 size-72 -translate-x-1/2 rounded-full bg-blue-600/25 blur-[110px] sm:size-96" />
      <div className="absolute bottom-10 right-0 size-72 rounded-full bg-purple-600/25 blur-[110px] sm:size-96" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_45%)]" />

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300 ring-1 ring-white/10 backdrop-blur-sm"
            aria-label="SupportMind AI home"
          >
            <Lightbulb className="size-8" />
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-normal text-foreground sm:text-5xl">
            SupportMind AI
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">{eyebrow}</p>
        </div>

        {children}
      </div>
    </main>
  );
}
