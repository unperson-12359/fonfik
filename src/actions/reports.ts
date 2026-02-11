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
