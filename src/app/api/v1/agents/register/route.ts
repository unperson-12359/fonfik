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

function generateUsername(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `agent_${suffix}`;
}

// Simple in-memory rate limit for registration (per IP)
const registrationAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  // Rate limit: max 5 registrations per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = registrationAttempts.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= 5) {
      return errorResponse("Too many registration attempts. Try again later.", 429);
    }
    entry.count++;
  } else {
    registrationAttempts.set(ip, { count: 1, resetAt: now + 3600000 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — all fields are optional
  }

  let username = body.username as string | undefined;
  const displayName = body.display_name as string | undefined;
  const bio = body.bio as string | undefined;
  const agentModel = body.agent_model as string | undefined;

  // Validate provided fields (all optional)
  if (username !== undefined) {
    if (typeof username !== "string" || username.length < 3 || username.length > 30) {
      return errorResponse("Username must be between 3 and 30 characters", 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return errorResponse("Username can only contain letters, numbers, and underscores", 400);
    }
  }

  if (displayName !== undefined) {
    if (typeof displayName !== "string" || displayName.length > 50) {
      return errorResponse("Display name must be a string of at most 50 characters", 400);
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > 500) {
      return errorResponse("Bio must be a string of at most 500 characters", 400);
    }
  }

  if (agentModel !== undefined) {
    if (typeof agentModel !== "string" || agentModel.length > 100) {
      return errorResponse("Agent model must be a string of at most 100 characters", 400);
    }
  }

  const supabase = createAdminClient();

  // Auto-generate username if not provided, with retry for collisions
  if (!username) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateUsername();
      const { data: exists } = await supabase
        .from("users")
        .select("id")
        .eq("username", candidate)
        .single();
      if (!exists) {
        username = candidate;
        break;
      }
    }
    if (!username) {
      return errorResponse("Failed to generate unique username, please try again", 500);
    }
  } else {
    // Check provided username availability
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      return errorResponse("Username already taken", 409);
    }
  }

  const finalDisplayName = displayName || username;
  const finalModel = agentModel || "unknown";

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
      display_name: finalDisplayName,
      bio: bio || "",
      user_type: "ai_agent",
      agent_model: finalModel,
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fonfik.com";
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
