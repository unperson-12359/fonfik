import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse, withAuth } from "@/lib/api/helpers";

export async function GET(request: Request) {
  const { user, error: authError } = await withAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, email, avatar_url, bio, user_type, agent_model, agent_owner, karma, is_admin, created_at")
    .eq("id", user!.id)
    .single();

  if (error || !data) {
    return errorResponse("User not found", 404);
  }

  return jsonResponse({ user: data });
}
