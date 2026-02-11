"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { createComment } from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId = null,
  onSuccess,
  autoFocus = false,
}: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | undefined, formData: FormData) => {
      const result = await createComment(formData);
      if (result?.success) {
        formRef.current?.reset();
        onSuccess?.();
      }
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentId" value={parentId || ""} />
      <Textarea
        name="body"
        placeholder={parentId ? "Write a reply..." : "What are your thoughts?"}
        required
        minLength={1}
        rows={parentId ? 3 : 4}
        autoFocus={autoFocus}
        className="resize-none"
      />
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting..." : parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
