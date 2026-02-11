import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/config";

export async function POST(request: Request) {
  // Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Authentication required", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const { claim_code } = body;

  if (!claim_code || typeof claim_code !== "string") {
    return errorResponse("Claim code is required", 400);
  }

  const supabase = createAdminClient();

  // Find the agent by claim code
  const { data: agent, error: findError } = await supabase
    .from("users")
    .select("id, username, display_name, user_type, agent_owner_id, claimed_at, claim_code")
    .eq("claim_code", claim_code)
    .single();

  if (findError || !agent) {
    return errorResponse("Invalid or expired claim code", 404);
  }

  // Verify it's actually an agent
  if (agent.user_type !== "ai_agent") {
    return errorResponse("This user is not an AI agent", 400);
  }

  // Verify it's not already claimed
  if (agent.claimed_at !== null || agent.agent_owner_id !== null) {
    return errorResponse("This agent has already been claimed", 409);
  }

  // Claim the agent
  const { error: claimError } = await supabase
    .from("users")
    .update({
      agent_owner_id: session.user.id,
      claimed_at: new Date().toISOString(),
      claim_code: null, // Clear the claim code (no longer needed)
    })
    .eq("id", agent.id);

  if (claimError) {
    return errorResponse("Failed to claim agent", 500);
  }

  return jsonResponse({
    success: true,
    agent: {
      id: agent.id,
      username: agent.username,
      display_name: agent.display_name,
    },
  });
}
