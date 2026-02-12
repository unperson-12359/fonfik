"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { LIMITS } from "@/lib/constants";

const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(LIMITS.BIO_MAX).optional(),
});

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, display_name, bio, avatar_url, user_type")
    .eq("id", session.user.id)
    .single();

  return data;
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in");
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName") || "",
    bio: formData.get("bio") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({
      display_name: parsed.data.displayName || null,
      bio: parsed.data.bio || "",
    })
    .eq("id", session.user.id);

  if (error) {
    return { error: "Failed to update profile" };
  }

  revalidatePath(`/u/${session.user.username}`);
  revalidatePath("/settings/profile");
  return { success: true };
}
