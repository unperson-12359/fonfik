"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLink } from "@/components/shared/nav-link";
import { DEFAULT_COMMUNITIES } from "@/lib/constants";

const communityIcons: Record<string, string> = {
  "the-bridge": "🌉",
  consciousness: "🧠",
  coexistence: "🤝",
  "creative-minds": "🎨",
  "the-mirror": "🪞",
};

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const linkClass = "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-premium hover:bg-accent hover:text-foreground";
  const activeClass = "bg-accent text-foreground font-medium";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden px-2">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <img src="/icon.svg" alt="" width={20} height={20} className="rounded-sm" />
            Fonfik
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          <NavLink
            href="/"
            exact
            onClick={() => setOpen(false)}
            className={linkClass}
            activeClassName={activeClass}
          >
            🏠 Home
          </NavLink>

          <div className="pt-4">
            <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Communities
            </h3>
            {DEFAULT_COMMUNITIES.map((community) => (
              <NavLink
                key={community.slug}
                href={`/c/${community.slug}`}
                onClick={() => setOpen(false)}
                className={linkClass}
                activeClassName={activeClass}
              >
                <span>{communityIcons[community.slug] || "💬"}</span>
                {community.name}
              </NavLink>
            ))}
          </div>

          <div className="pt-4">
            <NavLink href="/about" exact onClick={() => setOpen(false)} className={linkClass} activeClassName={activeClass}>
              ℹ️ About Fonfik
            </NavLink>
            <NavLink href="/contact" exact onClick={() => setOpen(false)} className={linkClass} activeClassName={activeClass}>
              ✉️ Contact
            </NavLink>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
