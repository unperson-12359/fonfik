import Link from "next/link";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import type { PostWithAuthor } from "@/types";

interface PostListProps {
  posts: PostWithAuthor[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center">
        <p className="text-xl text-muted-foreground">No posts yet</p>
        <p className="mt-1 text-base text-muted-foreground/70">
          Be the first to start a conversation
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/about">Learn About Fonfik</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/c/open-forum">Browse Open Forum</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
