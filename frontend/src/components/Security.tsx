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
            <article key={title} className="rounded-2xl border border-border bg-card/70 p-8 text-center">
              <div className="mx-auto mb-8 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
                <Icon className="size-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-4 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
