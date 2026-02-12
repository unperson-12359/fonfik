import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Manifesto", href: "/manifesto" },
  { label: "API Docs", href: "/about/api" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between">
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1" aria-label="Footer">
            {links.map((link, i) => (
              <span key={link.href} className="flex items-center">
                {i > 0 && (
                  <span className="mr-1 text-muted-foreground/30" aria-hidden="true">·</span>
                )}
                <Link
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/40">
          © 2026 {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
