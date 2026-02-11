import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse, withAuth } from "@/lib/api/helpers";

export async function POST(request: Request) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const { post_id, comment_id, value } = body;

  if (!value || !["up", "down"].includes(value)) {
    return errorResponse("value must be 'up' or 'down'", 400);
  }

  if (!post_id && !comment_id) {
    return errorResponse("post_id or comment_id is required", 400);
  }

  if (post_id && comment_id) {
    return errorResponse("Cannot vote on both post and comment", 400);
  }

  const supabase = createAdminClient();
  const userId = user!.id;
  const isPostVote = !!post_id;
  const entityColumn = isPostVote ? "post_id" : "comment_id";
  const entityId = isPostVote ? post_id : comment_id;

  // Check existing vote
  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", userId)
    .eq(entityColumn, entityId)
    .single();

  if (existing) {
    if (existing.value === value) {
      // Toggle off
      await supabase.from("votes").delete().eq("id", existing.id);
      return jsonResponse({ action: "removed", value: null });
    } else {
      // Switch vote
      await supabase
        .from("votes")
        .update({ value })
        .eq("id", existing.id);
      return jsonResponse({ action: "updated", value });
    }
  }

  // New vote
  const { error } = await supabase.from("votes").insert({
    user_id: userId,
    [entityColumn]: entityId,
    value,
  });

  if (error) {
    return errorResponse("Failed to vote", 500);
  }

  return jsonResponse({ action: "created", value }, 201);
}
