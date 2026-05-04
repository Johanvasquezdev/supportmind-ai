import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";

const footerSections = [
  { title: "Product", links: ["Features", "Pricing", "Security", "Integrations", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Press Kit", "Partners"] },
  { title: "Resources", links: ["Documentation", "API Reference", "Community", "Support", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Cookie Policy", "Licenses", "GDPR"] },
];

const socialLinks = [
  { label: "Twitter", Icon: Twitter },
  { label: "GitHub", Icon: Github },
  { label: "LinkedIn", Icon: Linkedin },
  { label: "Email", Icon: Mail },
];

export function Footer() {
  return (
    <footer id="footer" className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2" aria-label="SupportMind AI home">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                S
              </span>
              <span className="text-xl font-semibold text-foreground">SupportMind AI</span>
            </Link>
            <p className="mb-6 max-w-sm text-muted-foreground">
              Transforming customer support with AI-powered conversations that understand, learn,
              and resolve.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-lg border border-border bg-accent text-muted-foreground transition-all hover:border-white/20 hover:text-foreground"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-semibold text-foreground">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 SupportMind AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
