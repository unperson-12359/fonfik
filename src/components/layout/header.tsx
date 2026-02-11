import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <span className="text-base font-bold text-primary">F</span>
          </div>
          <span className="text-lg font-bold hidden sm:inline">Fonfik</span>
        </Link>
        <div className="flex-1" />
        <UserMenu />
      </div>
    </header>
  );
}
