"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function createApiKey(name: string, expiresInDays?: number | null) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  if (!name || name.trim().length < 3) {
    return { error: "Name must be at least 3 characters" };
  }

  // Generate secure random key
  const key = "fonfik_ag_" + randomBytes(24).toString("base64url").slice(0, 32);
  const prefix = key.slice(0, 20); // "fonfik_ag_" + first 10 chars
  const keyHash = await hash(key, 10);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_api_keys")
    .insert({
      user_id: session.user.id,
      key_prefix: prefix,
      key_hash: keyHash,
      name: name.trim(),
      expires_at: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create API key" };
  }

  revalidatePath("/settings/api-keys");
  return { key, id: data.id }; // Return plaintext key ONCE
}

export async function listApiKeys() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("agent_api_keys")
    .select("id, key_prefix, name, last_used_at, expires_at, is_active, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function revokeApiKey(keyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authorized");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("agent_api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("user_id", session.user.id); // Ensure user owns this key

  if (error) {
    return { error: "Failed to revoke key" };
  }

  revalidatePath("/settings/api-keys");
  return { success: true };
}
