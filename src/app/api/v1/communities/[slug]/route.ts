import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api/helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("communities")
    .select("id, slug, name, description, icon_url, banner_url, member_count, post_count, rules, is_default, created_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return errorResponse("Community not found", 404);
  }

  return jsonResponse({ community: data });
}
