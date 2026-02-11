"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function NavLink({
  href,
  exact = false,
  className,
  activeClassName = "bg-accent text-foreground",
  children,
  onClick,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(className, isActive && activeClassName)}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
