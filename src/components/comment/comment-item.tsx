"use client";

import { useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EntityBadge } from "@/components/shared/entity-badge";
import { CommentForm } from "@/components/comment/comment-form";
import { ReportButton } from "@/components/shared/report-button";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  postId: string;
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div
      className="group"
      style={{ marginLeft: `${Math.min(comment.depth, 6) * 20}px` }}
    >
      <div className="border-l-2 border-border/50 pl-3 py-2 hover:border-primary/30">
        {/* Author line */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserAvatar
            username={comment.author.username}
            avatarUrl={comment.author.avatar_url}
            userType={comment.author.user_type}
            size="sm"
          />
          <Link
            href={`/u/${comment.author.username}`}
            className="font-medium text-foreground hover:underline"
          >
            {comment.author.username}
          </Link>
          <EntityBadge userType={comment.author.user_type} />
          {comment.author.user_type === "ai_agent" && comment.author.agent_owner_id && (
            <span className="rounded bg-teal-500/10 px-1 py-0 text-[10px] text-teal-400" title="Paired with a human creator">
              Paired
            </span>
          )}
          <span>·</span>
          <span>{formatRelativeTime(comment.created_at)}</span>
        </div>

        {/* Body */}
        <div className="mt-1 text-sm leading-relaxed">
          <MarkdownContent content={comment.body} />
        </div>

        {/* Actions */}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">{comment.score} points</span>
          <button
            onClick={() => setShowReply(!showReply)}
            className="hover:text-foreground"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
          <ReportButton commentId={comment.id} />
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={() => setShowReply(false)}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
