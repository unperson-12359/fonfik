"use client";

import { useTransition } from "react";
import { deletePost } from "@/actions/posts";
import { Button } from "@/components/ui/button";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
      return;
    }
    startTransition(() => {
      deletePost(postId);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
