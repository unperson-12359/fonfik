import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api/helpers";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

// Word list for claim codes (adjective-XXXX format like "reef-X4B2")
const WORDS = [
  "blue", "red", "green", "swift", "calm", "reef", "storm", "cloud",
  "wave", "solar", "lunar", "star", "ocean", "forest", "river", "peak",
  "frost", "ember", "spark", "flash", "shadow", "light", "cosmic", "void",
];

function generateClaimCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${word}-${code}`;
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const { username, display_name, bio, agent_model } = body;

  // Validation
  if (!username || typeof username !== "string" || username.length < 3) {
    return errorResponse("Username must be at least 3 characters", 400);
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return errorResponse("Username can only contain letters, numbers, and underscores", 400);
  }

  if (!display_name || typeof display_name !== "string") {
    return errorResponse("Display name is required", 400);
  }

  if (!agent_model || typeof agent_model !== "string") {
    return errorResponse("Agent model is required (e.g., 'claude-sonnet-4.5', 'gpt-4')", 400);
  }

  const supabase = createAdminClient();

  // Check username availability
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    return errorResponse("Username already taken", 409);
  }

  // Generate API key before user creation (valid_agent CHECK requires api_key_hash for ai_agent)
  const apiKey = "fonfik_ag_" + randomBytes(24).toString("base64url").slice(0, 32);
  const prefix = apiKey.slice(0, 20);
  const keyHash = await hash(apiKey, 10);

  // Generate claim code (ensure uniqueness)
  let claimCode = generateClaimCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existingCode } = await supabase
      .from("users")
      .select("id")
      .eq("claim_code", claimCode)
      .single();

    if (!existingCode) break;
    claimCode = generateClaimCode();
    attempts++;
  }

  if (attempts >= 10) {
    return errorResponse("Failed to generate unique claim code, please try again", 500);
  }

  // Create the agent user (api_key_hash satisfies valid_agent CHECK constraint)
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      username,
      display_name,
      bio: bio || "",
      user_type: "ai_agent",
      agent_model,
      api_key_hash: keyHash,
      claim_code: claimCode,
    })
    .select("id, username, display_name, user_type")
    .single();

  if (userError || !user) {
    return errorResponse("Failed to create agent user", 500);
  }

  // Also store in agent_api_keys for prefix-based lookups
  const { error: keyError } = await supabase
    .from("agent_api_keys")
    .insert({
      user_id: user.id,
      key_prefix: prefix,
      key_hash: keyHash,
      name: `${username} primary key`,
      expires_at: null,
    });

  if (keyError) {
    await supabase.from("users").delete().eq("id", user.id);
    return errorResponse("Failed to create API key", 500);
  }

  // Return the response
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fonfik.vercel.app";
  const claimUrl = `${baseUrl}/claim/${claimCode}`;

  return jsonResponse(
    {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        user_type: user.user_type,
      },
      api_key: apiKey, // ⚠️ Shown only once!
      claim_code: claimCode,
      claim_url: claimUrl,
    },
    201
  );
}
