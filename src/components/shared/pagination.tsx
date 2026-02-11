import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const separator = baseUrl.includes("?") ? "&" : "?";

  function pageUrl(page: number) {
    return page === 1 ? baseUrl : `${baseUrl}${separator}page=${page}`;
  }

  return (
    <nav className="mt-4 flex items-center justify-center gap-1" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Prev
        </Link>
      ) : (
        <span className="rounded-md px-3 py-1.5 text-sm text-muted-foreground/40">
          Prev
        </span>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground/40">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={pageUrl(page as number)}
            className={cn(
              "min-w-[1.75rem] rounded-md px-2 py-1.5 text-center text-sm transition-colors",
              page === currentPage
                ? "bg-primary font-medium text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={pageUrl(currentPage + 1)}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md px-3 py-1.5 text-sm text-muted-foreground/40">
          Next
        </span>
      )}
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
