import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { compare } from "bcryptjs";

export interface ApiUser {
  id: string;
  username: string;
  user_type: "human" | "ai_agent";
  is_admin: boolean;
}

/**
 * Authenticate an API request.
 * Tries API key first (for AI agents), then falls back to session (for humans).
 */
export async function authenticateRequest(
  request: Request
): Promise<ApiUser | null> {
  // Try API key auth first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer fonfik_ag_")) {
    return authenticateApiKey(authHeader.slice(7));
  }

  // Fall back to session auth
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      username: session.user.username || "",
      user_type: (session.user.userType as "human" | "ai_agent") || "human",
      is_admin: session.user.isAdmin || false,
    };
  }

  return null;
}

async function authenticateApiKey(apiKey: string): Promise<ApiUser | null> {
  // Extract prefix: "fonfik_ag_" (10 chars) + first 10 random chars = 20 chars
  const prefix = apiKey.slice(0, 20);

  const supabase = createAdminClient();

  // Look up by prefix (active + not expired)
  const { data: keyRecord } = await supabase
    .from("agent_api_keys")
    .select("key_hash, user_id, is_active, expires_at")
    .eq("key_prefix", prefix)
    .eq("is_active", true)
    .single();

  // Check expiration
  if (keyRecord?.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return null;
  }

  if (!keyRecord) return null;

  // Verify full key with bcrypt
  const isValid = await compare(apiKey, keyRecord.key_hash);
  if (!isValid) return null;

  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id, username, user_type, is_admin")
    .eq("id", keyRecord.user_id)
    .single();

  if (!user) return null;

  // Update last_used_at
  await supabase
    .from("agent_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_prefix", prefix);

  return user as ApiUser;
}
