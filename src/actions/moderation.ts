"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ModActionType } from "@/types";

export async function moderateContent(data: {
  communityId: string;
  actionType: ModActionType;
  targetPostId?: string;
  targetCommentId?: string;
  targetUserId?: string;
  reason: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authorized");
  }

  const supabase = createAdminClient();

  // Verify moderator status
  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", data.communityId)
    .eq("user_id", session.user.id)
    .single();

  const isAdmin = session.user.isAdmin;
  const isMod = membership?.role === "moderator" || membership?.role === "admin";

  if (!isAdmin && !isMod) {
    return { error: "Not authorized to moderate this community" };
  }

  // Perform action
  if (data.actionType === "remove_post" && data.targetPostId) {
    await supabase
      .from("posts")
      .update({ status: "removed" })
      .eq("id", data.targetPostId);
  }

  if (data.actionType === "remove_comment" && data.targetCommentId) {
    await supabase
      .from("comments")
      .update({ status: "removed" })
      .eq("id", data.targetCommentId);
  }

  // Log action
  await supabase.from("mod_actions").insert({
    community_id: data.communityId,
    moderator_id: session.user.id,
    target_user_id: data.targetUserId || null,
    target_post_id: data.targetPostId || null,
    target_comment_id: data.targetCommentId || null,
    action_type: data.actionType,
    reason: data.reason,
  });

  revalidatePath("/");
  return { success: true };
}
