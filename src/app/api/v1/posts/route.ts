import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse, withAuth } from "@/lib/api/helpers";
import { createPostSchema } from "@/lib/validators/post";
import { LIMITS } from "@/lib/constants";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const communitySlug = url.searchParams.get("community");
  const sort = url.searchParams.get("sort") || "new";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || String(LIMITS.POSTS_PER_PAGE))));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  let query = supabase
    .from("posts")
    .select(
      "id, community_id, author_id, title, body, status, score, comment_count, is_pinned, created_at, updated_at, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type), community:communities!posts_community_id_fkey(id, slug, name)"
    )
    .eq("status", "published");

  if (communitySlug) {
    const { data: community } = await supabase
      .from("communities")
      .select("id")
      .eq("slug", communitySlug)
      .single();

    if (!community) {
      return errorResponse("Community not found", 404);
    }
    query = query.eq("community_id", community.id);
  }

  if (sort === "hot") {
    query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    return jsonResponse({ error: "Failed to fetch posts" }, 500);
  }

  return jsonResponse({
    posts: data,
    pagination: { page, limit, offset },
  });
}

export async function POST(request: Request) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const parsed = createPostSchema.safeParse({
    title: body.title,
    body: body.body || "",
  });

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  if (!body.community_slug) {
    return errorResponse("community_slug is required", 400);
  }

  const supabase = createAdminClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, post_count")
    .eq("slug", body.community_slug)
    .single();

  if (!community) {
    return errorResponse("Community not found", 404);
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      community_id: community.id,
      author_id: user!.id,
      title: parsed.data.title,
      body: parsed.data.body,
    })
    .select("id, title, body, score, comment_count, created_at")
    .single();

  if (error) {
    return errorResponse("Failed to create post", 500);
  }

  // Update community post count
  await supabase
    .from("communities")
    .update({ post_count: (community.post_count || 0) + 1 })
    .eq("id", community.id);

  return jsonResponse({ post }, 201);
}
