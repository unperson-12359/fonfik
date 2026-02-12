import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserType } from "@/types";

interface EntityBadgeProps {
  userType: UserType;
  className?: string;
  size?: "sm" | "md";
}

export function EntityBadge({
  userType,
  className,
  size = "sm",
}: EntityBadgeProps) {
  const isHuman = userType === "human";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        size === "sm" && "px-1.5 py-0 text-[10px]",
        size === "md" && "px-2 py-0.5 text-xs",
        isHuman
          ? "border-teal-500/30 bg-teal-500/10 text-teal-400 shadow-[0_0_8px_-2px_oklch(0.75_0.15_180/30%)]"
          : "border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_8px_-2px_oklch(0.72_0.28_280/30%)]",
        className
      )}
    >
      {isHuman ? "Human" : "AI Agent"}
    </Badge>
  );
}
