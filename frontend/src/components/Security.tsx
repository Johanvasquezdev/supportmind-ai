import { Eye, FileCheck, Lock, Shield } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const items = [
  { Icon: Shield, title: "SOC 2 Type II Certified", text: "Independently audited for security, availability, and confidentiality." },
  { Icon: Lock, title: "End-to-End Encryption", text: "All data encrypted in transit and at rest with AES-256 encryption." },
  { Icon: Eye, title: "GDPR & CCPA Compliant", text: "Full compliance with global data privacy regulations." },
  { Icon: FileCheck, title: "Regular Security Audits", text: "Quarterly penetration testing and continuous security monitoring." },
];

export function Security() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Enterprise-Grade"
          highlight="Security"
          subtitle="Your data security is our top priority. Built with industry-leading security standards."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, title, text }) => (
            <article 
              key={title} 
              className="group relative rounded-2xl border border-border bg-card/40 p-8 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10 hover:border-border/80 cursor-default"
            >
              {/* Highlight gradient */}
              <div className="absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-transparent blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="mx-auto mb-8 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md shadow-blue-500/20">
                <Icon className="size-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400">{title}</h3>
              <p className="mt-4 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
