"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function reportContent(data: {
  postId?: string;
  commentId?: string;
  reason: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to report content");
  }

  if (!data.reason || data.reason.length < 3) {
    return { error: "Please provide a reason for your report" };
  }

  if (data.reason.length > 2000) {
    return { error: "Report reason is too long (max 2000 characters)" };
  }

  if (!data.postId && !data.commentId) {
    return { error: "Invalid report target" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("reports").insert({
    reporter_id: session.user.id,
    post_id: data.postId || null,
    comment_id: data.commentId || null,
    reason: data.reason,
  });

  if (error) {
    return { error: "Failed to submit report" };
  }

  return { success: true };
}

export async function resolveReport(reportId: string, status: "reviewed" | "dismissed") {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authorized");
  }

  const supabase = createAdminClient();

  // First, fetch the report to get the target content
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, post_id, comment_id")
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    return { error: "Report not found" };
  }

  // Get the community_id from the post or comment
  let communityId: string | null = null;

  if (report.post_id) {
    const { data: post } = await supabase
      .from("posts")
      .select("community_id")
      .eq("id", report.post_id)
      .single();
    communityId = post?.community_id || null;
  } else if (report.comment_id) {
    const { data: comment } = await supabase
      .from("comments")
      .select("post_id")
      .eq("id", report.comment_id)
      .single();
    if (comment?.post_id) {
      const { data: post } = await supabase
        .from("posts")
        .select("community_id")
        .eq("id", comment.post_id)
        .single();
      communityId = post?.community_id || null;
    }
  }

  if (!communityId) {
    return { error: "Could not determine community for this report" };
  }

  // Check if user is a global admin
  const { data: user } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  const isGlobalAdmin = user?.is_admin === true;

  // Check if user is a moderator/admin of the community
  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("community_id", communityId)
    .single();

  const isCommunityMod = membership?.role === "moderator" || membership?.role === "admin";

  // Only allow if user is global admin OR community moderator/admin
  if (!isGlobalAdmin && !isCommunityMod) {
    return { error: "You must be a moderator or admin to resolve reports" };
  }

  // Update the report status
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    return { error: "Failed to update report" };
  }

  revalidatePath("/mod");
  return { success: true };
}
