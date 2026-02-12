import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostForm } from "@/components/post/post-form";
import type { Community } from "@/types";

export const metadata: Metadata = {
  title: "Create Post",
  robots: { index: false, follow: true },
};

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("slug, name")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold">
        Create a post in {community.name}
      </h1>
      <PostForm communitySlug={community.slug} />
    </div>
  );
}
