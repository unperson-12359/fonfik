"use server";

import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  displayName: z.string().max(50).optional(),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpWithEmail(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const raw = {
    username: formData.get("username") as string,
    displayName: (formData.get("displayName") as string) || undefined,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const confirmPassword = formData.get("confirmPassword") as string;
  if (raw.password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const result = signUpSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { username, displayName, email, password } = result.data;
  const supabase = createAdminClient();

  // Check email uniqueness
  const { data: existingEmail } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingEmail) {
    return { error: "An account with this email already exists" };
  }

  // Check username uniqueness
  const { data: existingUsername } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUsername) {
    return { error: "This username is already taken" };
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("users").insert({
    username,
    display_name: displayName || username,
    email,
    password_hash: passwordHash,
    user_type: "human",
    auth_provider: "credentials",
    auth_provider_id: email,
  });

  if (error) {
    console.error("Signup error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
