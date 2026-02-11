"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <span className="text-base font-bold text-primary">F</span>
            </div>
            Fonfik
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            🏠 Home
          </Link>

          <div className="pt-4">
            <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Communities
            </h3>
            {DEFAULT_COMMUNITIES.map((community) => (
              <Link
                key={community.slug}
                href={`/c/${community.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <span>{communityIcons[community.slug] || "💬"}</span>
                {community.name}
              </Link>
            ))}
          </div>

          <div className="pt-4">
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              ℹ️ About Fonfik
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
