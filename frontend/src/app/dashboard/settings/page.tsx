"use client";

import { UserProfile, useUser } from "@clerk/nextjs";
import { Check, Copy, Key, Mail, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useUser();
  const [apiKey] = useState("smk_live_************************");
  const [copied, setCopied] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-foreground">Account</h3>
        </div>
        <div className="space-y-4 rounded-[2px] border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-sm font-medium text-foreground">
                {user?.primaryEmailAddress?.emailAddress ?? "-"}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Name</label>
              <p className="text-sm font-medium text-foreground">
                {user?.fullName ?? "-"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProfile((value) => !value)}
            className="text-sm text-purple-600 dark:text-purple-400 transition-colors hover:opacity-80"
          >
            {showProfile ? "Hide profile settings" : "Manage account, password and OAuth ->"}
          </button>
        </div>
      </section>

      {showProfile ? (
        <section className="overflow-hidden rounded-[2px] border border-border">
          <UserProfile appearance={clerkUserProfileAppearance} />
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="size-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-foreground">API Key</h3>
        </div>
        <div className="space-y-4 rounded-[2px] border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Use this key to authenticate widget requests to your SupportMind instance.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-[2px] border border-border bg-muted/30 px-4 py-2.5 font-mono text-sm text-foreground">
              {apiKey}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex size-10 items-center justify-center rounded-[2px] border border-border transition-all hover:bg-muted",
                copied && "border-green-500/50 text-green-600 dark:text-green-400",
              )}
              title="Copy API key"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-[2px] border border-border text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              title="Regenerate API key"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this key private. Send it through the x-api-key header only.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-foreground">Security</h3>
        </div>
        <div className="space-y-3 rounded-[2px] border border-border bg-card p-6">
          {[
            ["Authentication", "Clerk SSO"],
            ["API key storage", "Hashed server-side"],
            ["Data isolation", "Tenant scoped"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
