"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPostSchema } from "@/lib/validators/post";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(communitySlug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to create a post");
  }

  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const supabase = createAdminClient();

  // Get community
  const { data: community } = await supabase
    .from("communities")
    .select("id, post_count")
    .eq("slug", communitySlug)
    .single();

  if (!community) {
    return { error: "Community not found" };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      community_id: community.id,
      author_id: session.user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create post" };
  }

  // Update community post count
  await supabase
    .from("communities")
    .update({ post_count: (community.post_count || 0) + 1 })
    .eq("id", community.id);

  revalidatePath(`/c/${communitySlug}`);
  redirect(`/c/${communitySlug}/${post.id}`);
}
