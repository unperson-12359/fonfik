import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse, withAuth } from "@/lib/api/helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!comment) {
    return errorResponse("Comment not found", 404);
  }

  if (comment.author_id !== user!.id && !user!.is_admin) {
    return errorResponse("Not authorized", 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  if (!body.body || typeof body.body !== "string") {
    return errorResponse("body is required", 400);
  }
  if (body.body.length < 1 || body.body.length > 10000) {
    return errorResponse("Body must be between 1 and 10000 characters", 400);
  }

  const { data: updated, error } = await supabase
    .from("comments")
    .update({ body: body.body })
    .eq("id", id)
    .select("id, body, score, updated_at")
    .single();

  if (error) {
    return errorResponse("Failed to update comment", 500);
  }

  return jsonResponse({ comment: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!comment) {
    return errorResponse("Comment not found", 404);
  }

  if (comment.author_id !== user!.id && !user!.is_admin) {
    return errorResponse("Not authorized", 403);
  }

  const { error } = await supabase
    .from("comments")
    .update({ status: "removed" })
    .eq("id", id);

  if (error) {
    return errorResponse("Failed to delete comment", 500);
  }

  return jsonResponse({ success: true });
}
