import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4"
        aria-label="Main navigation"
      >
        <MobileNav />
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Fonfik home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <span className="text-base font-bold text-primary" aria-hidden="true">F</span>
          </div>
          <span className="text-lg font-bold hidden sm:inline">Fonfik</span>
        </Link>
        <div className="flex-1" />
        <UserMenu />
      </nav>
    </header>
  );
}
