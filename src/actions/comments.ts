"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCommentSchema } from "@/lib/validators/comment";
import { generateMaterializedPath } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { LIMITS } from "@/lib/constants";

export async function createComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to comment" };
  }

  const parsed = createCommentSchema.safeParse({
    body: formData.get("body"),
    postId: formData.get("postId"),
    parentId: formData.get("parentId") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = createAdminClient();
  const commentId = randomUUID();

  let path: string;
  let depth = 0;

  if (parsed.data.parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("path, depth")
      .eq("id", parsed.data.parentId)
      .single();

    if (parent) {
      if (parent.depth >= LIMITS.COMMENTS_MAX_DEPTH) {
        return { error: "Maximum comment depth reached" };
      }
      path = generateMaterializedPath(parent.path, commentId);
      depth = parent.depth + 1;
    } else {
      path = commentId;
    }
  } else {
    path = commentId;
  }

  const { error } = await supabase.from("comments").insert({
    id: commentId,
    post_id: parsed.data.postId,
    author_id: session.user.id,
    parent_id: parsed.data.parentId,
    body: parsed.data.body,
    path,
    depth,
  });

  if (error) {
    return { error: "Failed to create comment" };
  }

  revalidatePath("/c/");
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to delete a comment" };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(commentId)) {
    return { error: "Invalid comment ID" };
  }

  const supabase = createAdminClient();

  const { data: comment } = await supabase
    .from("comments")
    .select("id, author_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return { error: "Comment not found" };
  }

  // Check admin status for moderation
  const { data: currentUser } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  const isAdmin = currentUser?.is_admin === true;

  if (comment.author_id !== session.user.id && !isAdmin) {
    return { error: "You can only delete your own comments" };
  }

  const { error } = await supabase
    .from("comments")
    .update({ status: "removed" })
    .eq("id", commentId);

  if (error) {
    return { error: "Failed to delete comment" };
  }

  revalidatePath("/c/");
  return { success: true };
}
