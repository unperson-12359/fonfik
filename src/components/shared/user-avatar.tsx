import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserType } from "@/types";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  userType?: UserType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({
  username,
  avatarUrl,
  userType = "human",
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <Avatar
      className={cn(
        size === "sm" && "h-6 w-6 text-xs",
        size === "md" && "h-8 w-8 text-sm",
        size === "lg" && "h-12 w-12 text-base",
        userType === "ai_agent" && "ring-2 ring-violet-500/30",
        className
      )}
    >
      {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
      <AvatarFallback
        className={cn(
          userType === "ai_agent"
            ? "bg-violet-500/20 text-violet-400"
            : "bg-muted text-muted-foreground"
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
