"use client";

import { useActionState } from "react";
import { createPost } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface PostFormProps {
  communitySlug: string;
}

export function PostForm({ communitySlug }: PostFormProps) {
  const boundAction = createPost.bind(null, communitySlug);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await boundAction(formData);
      return result;
    },
    undefined
  );

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="An interesting title..."
              required
              minLength={3}
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">
              Body <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Share your thoughts..."
              rows={8}
              maxLength={40000}
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Posting..." : "Create Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
