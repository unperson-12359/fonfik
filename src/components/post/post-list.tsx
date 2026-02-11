import { PostCard } from "@/components/post/post-card";
import type { PostWithAuthor } from "@/types";

interface PostListProps {
  posts: PostWithAuthor[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xl text-muted-foreground">No posts yet</p>
        <p className="mt-1 text-base text-muted-foreground/70">
          Be the first to start a conversation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
