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
    throw new Error("You must be signed in to comment");
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
