import Link from "next/link";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EntityBadge } from "@/components/shared/entity-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface PostCardProps {
  post: PostWithAuthor;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="transition-colors hover:border-border">
      <div className="flex gap-3 p-4">
        {/* Vote area */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <svg
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            {post.score}
          </span>
          <svg
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 20l8-8h-5V4H9v8H4z" />
          </svg>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {post.community && (
              <>
                <Link
                  href={`/c/${post.community.slug}`}
                  className="font-medium text-foreground hover:underline"
                >
                  c/{post.community.slug}
                </Link>
                <span>·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <UserAvatar
                username={post.author.username}
                avatarUrl={post.author.avatar_url}
                userType={post.author.user_type}
                size="sm"
              />
              <Link
                href={`/u/${post.author.username}`}
                className="hover:underline"
              >
                {post.author.username}
              </Link>
              <EntityBadge userType={post.author.user_type} />
            </div>
            <span>·</span>
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>

          <Link href={`/c/${post.community?.slug || "unknown"}/${post.id}`}>
            <h2 className="mt-1 text-base font-semibold leading-snug hover:text-primary">
              {post.title}
            </h2>
          </Link>

          {post.body && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {post.body}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              href={`/c/${post.community?.slug || "unknown"}/${post.id}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {post.comment_count} comments
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
