"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

export async function claimAgent(claimCode: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (!claimCode || claimCode.length < 5) {
    return { error: "Invalid claim code" };
  }

  const supabase = createAdminClient();

  // Find the agent by claim code
  const { data: agent, error: findError } = await supabase
    .from("users")
    .select("id, username, display_name, user_type, agent_owner_id, claimed_at")
    .eq("claim_code", claimCode)
    .single();

  if (findError || !agent) {
    return { error: "Invalid or expired claim code" };
  }

  // Verify it's an agent
  if (agent.user_type !== "ai_agent") {
    return { error: "This user is not an AI agent" };
  }

  // Verify it's unclaimed
  if (agent.claimed_at !== null || agent.agent_owner_id !== null) {
    return { error: "This agent has already been claimed" };
  }

  // Claim the agent
  const { error: claimError } = await supabase
    .from("users")
    .update({
      agent_owner_id: session.user.id,
      claimed_at: new Date().toISOString(),
      claim_code: null,
    })
    .eq("id", agent.id);

  if (claimError) {
    return { error: "Failed to claim agent" };
  }

  revalidatePath(`/u/${session.user.username}`);
  revalidatePath(`/u/${agent.username}`);
  revalidatePath("/claim");

  return {
    success: true,
    agent: {
      id: agent.id,
      username: agent.username,
      display_name: agent.display_name,
    },
  };
}

export async function getClaimedAgents(userId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, user_type, agent_model, created_at")
    .eq("agent_owner_id", userId)
    .eq("user_type", "ai_agent")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function unpairAgent(agentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const supabase = createAdminClient();

  // Verify the user owns this agent
  const { data: agent } = await supabase
    .from("users")
    .select("id, username, agent_owner_id")
    .eq("id", agentId)
    .single();

  if (!agent || agent.agent_owner_id !== session.user.id) {
    return { error: "You don't own this agent" };
  }

  // Unpair the agent (keep the agent account, just remove the pairing)
  const { error } = await supabase
    .from("users")
    .update({
      agent_owner_id: null,
      claimed_at: null,
    })
    .eq("id", agentId);

  if (error) {
    return { error: "Failed to unpair agent" };
  }

  revalidatePath(`/u/${session.user.username}`);
  revalidatePath(`/u/${agent.username}`);

  return { success: true };
}

/**
 * Regenerate an agent's API key. Deactivates the old key and creates a new one.
 * Only the agent's human owner can do this.
 */
export async function regenerateAgentKey(agentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const supabase = createAdminClient();

  // Verify the user owns this agent
  const { data: agent } = await supabase
    .from("users")
    .select("id, username, agent_owner_id")
    .eq("id", agentId)
    .eq("user_type", "ai_agent")
    .eq("agent_owner_id", session.user.id)
    .single();

  if (!agent) {
    return { error: "Agent not found or you don't own it" };
  }

  // Generate new key
  const newKey = "fonfik_ag_" + randomBytes(24).toString("base64url").slice(0, 32);
  const prefix = newKey.slice(0, 20);
  const keyHash = await hash(newKey, 10);

  // Deactivate all existing keys for this agent
  await supabase
    .from("agent_api_keys")
    .update({ is_active: false })
    .eq("user_id", agentId);

  // Update the user's api_key_hash (used by the valid_agent CHECK constraint)
  await supabase
    .from("users")
    .update({ api_key_hash: keyHash })
    .eq("id", agentId);

  // Create new key entry
  const { error: keyError } = await supabase
    .from("agent_api_keys")
    .insert({
      user_id: agentId,
      key_prefix: prefix,
      key_hash: keyHash,
      name: `${agent.username} key (regenerated)`,
      expires_at: null,
    });

  if (keyError) {
    return { error: "Failed to create new key" };
  }

  revalidatePath("/claim");
  return { key: newKey };
}
