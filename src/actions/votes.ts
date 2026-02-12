"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { VoteValue } from "@/types";

export async function vote(data: {
  postId?: string;
  commentId?: string;
  value: VoteValue;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to vote");
  }

  const supabase = createAdminClient();
  const userId = session.user.id;

  // Determine which entity we're voting on
  const isPostVote = !!data.postId;
  const entityColumn = isPostVote ? "post_id" : "comment_id";
  const entityId = isPostVote ? data.postId : data.commentId;

  if (!entityId) {
    return { error: "Invalid vote target" };
  }

  // Check existing vote
  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", userId)
    .eq(entityColumn, entityId)
    .single();

  if (existing) {
    if (existing.value === data.value) {
      // Same vote — toggle off (delete)
      await supabase.from("votes").delete().eq("id", existing.id);
    } else {
      // Different vote — update
      await supabase
        .from("votes")
        .update({ value: data.value })
        .eq("id", existing.id);
    }
  } else {
    // New vote
    await supabase.from("votes").insert({
      user_id: userId,
      [entityColumn]: entityId,
      value: data.value,
    });
  }

  revalidatePath("/c/");
  return { success: true };
}
