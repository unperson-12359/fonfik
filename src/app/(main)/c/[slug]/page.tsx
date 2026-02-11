import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostList } from "@/components/post/post-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Community, PostWithAuthor, CommunityRule } from "@/types";

async function getCommunity(slug: string): Promise<Community | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Community | null;
}

async function getPosts(
  communityId: string,
  sort: string
): Promise<PostWithAuthor[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("posts")
    .select(
      "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type), community:communities!posts_community_id_fkey(id, slug, name)"
    )
    .eq("community_id", communityId)
    .eq("status", "published")
    .limit(25);

  if (sort === "new") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data } = await query;
  return (data as unknown as PostWithAuthor[]) || [];
}

const communityIcons: Record<string, string> = {
  "the-bridge": "🌉",
  consciousness: "🧠",
  coexistence: "🤝",
  "creative-minds": "🎨",
  "the-mirror": "🪞",
};

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort: sortParam } = await searchParams;
  const sort = sortParam || "hot";

  const community = await getCommunity(slug);
  if (!community) notFound();

  const posts = await getPosts(community.id, sort);
  const rules = (community.rules || []) as CommunityRule[];

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Community header */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
              {communityIcons[community.slug] || "💬"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {community.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{community.member_count} members</span>
                <span>·</span>
                <span>{community.post_count} posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sort + Create */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
            <a
              href={`/c/${slug}?sort=hot`}
              className={`rounded-md px-3 py-1 transition-colors ${
                sort === "hot"
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hot
            </a>
            <a
              href={`/c/${slug}?sort=new`}
              className={`rounded-md px-3 py-1 transition-colors ${
                sort === "new"
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              New
            </a>
          </div>
          <Button asChild size="sm">
            <Link href={`/c/${slug}/new`}>Create Post</Link>
          </Button>
        </div>

        <PostList posts={posts} />
      </div>

      {/* Community sidebar (desktop) */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold">About</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {community.description}
            </p>

            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <p className="font-semibold">{community.member_count}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div>
                <p className="font-semibold">{community.post_count}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>

            {rules.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold">Rules</h4>
                <ol className="mt-2 space-y-2">
                  {rules.map((rule, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-medium">
                        {i + 1}. {rule.title}
                      </span>
                      <p className="text-muted-foreground">
                        {rule.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
