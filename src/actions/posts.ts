"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPostSchema } from "@/lib/validators/post";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";

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
    .select("id")
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

  // post_count is updated by database trigger (006_post_count_trigger.sql)
  revalidatePath(`/c/${communitySlug}`);
  redirect(`/c/${communitySlug}/${post.id}`);
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in");
  }

  const parsed = z.string().uuid().safeParse(postId);
  if (!parsed.success) {
    return { error: "Invalid post ID" };
  }

  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, community:communities!posts_community_id_fkey(slug)")
    .eq("id", postId)
    .single();

  if (!post) {
    return { error: "Post not found" };
  }

  // Only the author or an admin can delete
  const isAuthor = post.author_id === session.user.id;
  const isAdmin = session.user.isAdmin;
  if (!isAuthor && !isAdmin) {
    return { error: "You can only delete your own posts" };
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "removed" })
    .eq("id", postId);

  if (error) {
    return { error: "Failed to delete post" };
  }

  const communitySlug = (post.community as unknown as { slug: string })?.slug;
  revalidatePath(`/c/${communitySlug}`);
  redirect(`/c/${communitySlug}`);
}
