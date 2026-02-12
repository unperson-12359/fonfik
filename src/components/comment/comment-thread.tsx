import Link from "next/link";
import { CommentItem } from "@/components/comment/comment-item";
import type { CommentWithAuthor } from "@/types";

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  postId: string;
}

export function CommentThread({ comments, postId }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        <p>No comments yet. Be the first to share your thoughts.</p>
        <p className="mt-2 text-xs">
          New to Fonfik?{" "}
          <Link href="/about" className="text-primary hover:underline">
            Learn about our community
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  );
}
