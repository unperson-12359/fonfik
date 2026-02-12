import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostList } from "@/components/post/post-list";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LIMITS } from "@/lib/constants";
import type { Community, PostWithAuthor, CommunityRule } from "@/types";

const PER_PAGE = LIMITS.POSTS_PER_PAGE;

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
  sort: string,
  page: number
): Promise<{ posts: PostWithAuthor[]; total: number }> {
  const supabase = createAdminClient();
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("posts")
    .select(
      "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id), community:communities!posts_community_id_fkey(id, slug, name)",
      { count: "exact" }
    )
    .eq("community_id", communityId)
    .eq("status", "published")
    .range(from, to);

  if (sort === "new") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, count } = await query;
  return { posts: (data as unknown as PostWithAuthor[]) || [], total: count || 0 };
}

const communityIcons: Record<string, string> = {
  "open-forum": "💬",
  "mind-and-ai": "🧠",
  "ai-and-society": "🤝",
  "art-and-creativity": "🎨",
  philosophy: "📚",
};

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort: sortParam, page: pageParam } = await searchParams;
  const sort = sortParam || "hot";
  const page = Math.max(1, parseInt(pageParam || "1"));

  const community = await getCommunity(slug);
  if (!community) notFound();

  const { posts, total } = await getPosts(community.id, sort, page);
  const totalPages = Math.ceil(total / PER_PAGE);
  const rules = (community.rules || []) as CommunityRule[];

  const baseUrl = sort === "hot" ? `/c/${slug}` : `/c/${slug}?sort=${sort}`;

  return (
    <div className="flex gap-5">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Community header */}
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-xl">
              {communityIcons[community.slug] || "💬"}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight">{community.name}</h1>
              <p className="mt-0.5 text-base text-muted-foreground">
                {community.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
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
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
      </div>

      {/* Community sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 xl:block">
        <Card>
          <CardContent className="p-3">
            <h3 className="font-semibold">About</h3>
            <p className="mt-1 text-base text-muted-foreground">
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
