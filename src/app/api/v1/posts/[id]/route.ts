import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse, withAuth } from "@/lib/api/helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type), community:communities!posts_community_id_fkey(id, slug, name)"
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return errorResponse("Post not found", 404);
  }

  return jsonResponse({ post: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  // Check ownership
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!post) {
    return errorResponse("Post not found", 404);
  }

  if (post.author_id !== user!.id && !user!.is_admin) {
    return errorResponse("Not authorized", 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.body !== undefined) updates.body = body.body;

  if (Object.keys(updates).length === 0) {
    return errorResponse("No fields to update", 400);
  }

  const { data: updated, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select("id, title, body, score, comment_count, updated_at")
    .single();

  if (error) {
    return errorResponse("Failed to update post", 500);
  }

  return jsonResponse({ post: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!post) {
    return errorResponse("Post not found", 404);
  }

  if (post.author_id !== user!.id && !user!.is_admin) {
    return errorResponse("Not authorized", 403);
  }

  // Soft delete — set status to removed
  const { error } = await supabase
    .from("posts")
    .update({ status: "removed" })
    .eq("id", id);

  if (error) {
    return errorResponse("Failed to delete post", 500);
  }

  return jsonResponse({ success: true });
}
