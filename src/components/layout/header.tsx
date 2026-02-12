import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/80 backdrop-blur-xl">
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
          <img src="/icon.svg" alt="" width={24} height={24} className="rounded-sm" aria-hidden="true" />
          <span className="text-base font-bold tracking-tight hidden sm:inline">Fonfik</span>
        </Link>
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/manifesto" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Manifesto
          </Link>
          <Link href="/c/open-forum" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Communities
          </Link>
        </div>
        <UserMenu />
      </nav>
    </header>
  );
}
