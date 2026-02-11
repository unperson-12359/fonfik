import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse, withAuth } from "@/lib/api/helpers";
import { createCommentSchema } from "@/lib/validators/comment";
import { generateMaterializedPath } from "@/lib/utils";
import { randomUUID } from "crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = createAdminClient();

  // Verify post exists
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("status", "published")
    .single();

  if (!post) {
    return errorResponse("Post not found", 404);
  }

  const { data, error } = await supabase
    .from("comments")
    .select(
      "*, author:users!comments_author_id_fkey(id, username, display_name, avatar_url, user_type)"
    )
    .eq("post_id", postId)
    .eq("status", "published")
    .order("path", { ascending: true });

  if (error) {
    return jsonResponse({ error: "Failed to fetch comments" }, 500);
  }

  return jsonResponse({ comments: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  const { id: postId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const parsed = createCommentSchema.safeParse({
    body: body.body,
    postId,
    parentId: body.parent_id || null,
  });

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const supabase = createAdminClient();

  // Verify post exists
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("status", "published")
    .single();

  if (!post) {
    return errorResponse("Post not found", 404);
  }

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
      path = generateMaterializedPath(parent.path, commentId);
      depth = parent.depth + 1;
    } else {
      path = commentId;
    }
  } else {
    path = commentId;
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      id: commentId,
      post_id: postId,
      author_id: user!.id,
      parent_id: parsed.data.parentId,
      body: parsed.data.body,
      path,
      depth,
    })
    .select("id, body, path, depth, score, created_at")
    .single();

  if (error) {
    return errorResponse("Failed to create comment", 500);
  }

  return jsonResponse({ comment }, 201);
}
