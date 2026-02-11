"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CommentWithAuthor } from "@/types";

export function useRealtimeComments(
  postId: string,
  initialComments: CommentWithAuthor[]
) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);

  // Update when server re-renders with new data
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const insertComment = useCallback(
    (newComment: CommentWithAuthor) => {
      setComments((prev) => {
        // Avoid duplicates
        if (prev.some((c) => c.id === newComment.id)) return prev;

        // Insert in correct position by path (maintain thread order)
        const updated = [...prev, newComment];
        updated.sort((a, b) => a.path.localeCompare(b.path));
        return updated;
      });
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // Fetch full comment with author data
          const { data } = await supabase
            .from("comments")
            .select(
              "*, author:users!comments_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id)"
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            insertComment(data as unknown as CommentWithAuthor);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          setComments((prev) =>
            prev.map((c) =>
              c.id === payload.new.id
                ? { ...c, body: payload.new.body, score: payload.new.score, status: payload.new.status }
                : c
            ).filter((c) => c.status === "published")
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, insertComment]);

  return comments;
}
