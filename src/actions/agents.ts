"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
