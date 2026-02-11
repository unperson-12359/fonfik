"use client";

import { useRealtimeComments } from "@/hooks/use-realtime-comments";
import { CommentItem } from "@/components/comment/comment-item";
import type { CommentWithAuthor } from "@/types";

interface RealtimeCommentThreadProps {
  comments: CommentWithAuthor[];
  postId: string;
}

export function RealtimeCommentThread({
  comments: initialComments,
  postId,
}: RealtimeCommentThreadProps) {
  const comments = useRealtimeComments(postId, initialComments);

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No comments yet. Be the first to share your thoughts.
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
