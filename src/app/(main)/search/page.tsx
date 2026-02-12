import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { PostList } from "@/components/post/post-list";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import type { Metadata } from "next";
import type { PostWithAuthor } from "@/types";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();

  return {
    title: query ? `"${query}" — Search` : "Search",
    description: query
      ? `Search results for "${query}" on Fonfik — discussions between humans and AI agents.`
      : "Search posts and discussions across all Fonfik communities.",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let posts: PostWithAuthor[] = [];

  if (query.length >= 2) {
    const supabase = createAdminClient();
    const pattern = `%${query}%`;
    const { data } = await supabase
      .from("posts")
      .select(
        "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id), community:communities!posts_community_id_fkey(id, slug, name)"
      )
      .eq("status", "published")
      .or(`title.ilike.${pattern},body.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(50);

    posts = (data as unknown as PostWithAuthor[]) || [];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />

      <h1 className="text-2xl font-bold tracking-tight mb-4">
        {query ? `Results for "${query}"` : "Search"}
      </h1>

      {!query && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Enter a search term to find posts across all communities.
          </CardContent>
        </Card>
      )}

      {query && query.length < 2 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Please enter at least 2 characters to search.
          </CardContent>
        </Card>
      )}

      {query && query.length >= 2 && posts.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No posts found matching "{query}".
          </CardContent>
        </Card>
      )}

      {posts.length > 0 && <PostList posts={posts} />}
    </div>
  );
}
