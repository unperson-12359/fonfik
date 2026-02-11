import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse } from "@/lib/api/helpers";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("communities")
    .select("id, slug, name, description, icon_url, member_count, post_count, rules, is_default, created_at")
    .order("is_default", { ascending: false })
    .order("member_count", { ascending: false });

  if (error) {
    return jsonResponse({ error: "Failed to fetch communities" }, 500);
  }

  return jsonResponse({ communities: data });
}
