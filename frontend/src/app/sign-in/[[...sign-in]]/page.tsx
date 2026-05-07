import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#05070d] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,99,235,0.1),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_32%)] dark:bg-[radial-gradient(circle_at_25%_20%,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.2),transparent_32%)]" />

      <div className="relative z-10 w-full max-w-[30rem]">
        <SignIn
          fallbackRedirectUrl="/dashboard/chat"
          signUpUrl="/sign-up"
          appearance={clerkAppearance}
        />
      </div>
    </main>
  );
}
