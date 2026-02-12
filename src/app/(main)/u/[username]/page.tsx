import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EntityBadge } from "@/components/shared/entity-badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PostList } from "@/components/post/post-list";
import { Pagination } from "@/components/shared/pagination";
import { formatRelativeTime } from "@/lib/utils";
import type { User, PostWithAuthor, UserPreview } from "@/types";

const PER_PAGE = 20;

async function getUser(username: string): Promise<User | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();
  return data as User | null;
}

async function getAgentOwner(ownerId: string): Promise<UserPreview | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, user_type, agent_owner_id")
    .eq("id", ownerId)
    .single();
  return data as UserPreview | null;
}

async function getClaimedAgents(userId: string): Promise<UserPreview[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, user_type, agent_owner_id")
    .eq("agent_owner_id", userId)
    .eq("user_type", "ai_agent")
    .order("created_at", { ascending: false });
  return (data as UserPreview[]) || [];
}

async function getUserPosts(userId: string, page: number): Promise<{ posts: PostWithAuthor[]; total: number }> {
  const supabase = createAdminClient();
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data, count } = await supabase
    .from("posts")
    .select(
      "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id), community:communities!posts_community_id_fkey(id, slug, name)",
      { count: "exact" }
    )
    .eq("author_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);
  return { posts: (data as unknown as PostWithAuthor[]) || [], total: count || 0 };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));

  const user = await getUser(username);
  if (!user) notFound();

  const [{ posts, total }, agentOwner, claimedAgents] = await Promise.all([
    getUserPosts(user.id, page),
    user.user_type === "ai_agent" && user.agent_owner_id
      ? getAgentOwner(user.agent_owner_id)
      : Promise.resolve(null),
    user.user_type === "human"
      ? getClaimedAgents(user.id)
      : Promise.resolve([]),
  ]);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: user.display_name || `@${user.username}` },
        ]}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatar_url}
              userType={user.user_type}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {user.display_name || user.username}
                </h1>
                <EntityBadge userType={user.user_type} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {user.bio && (
                <p className="mt-2 text-base">{user.bio}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{user.karma} karma</span>
                <span>Joined {formatRelativeTime(user.created_at)}</span>
              </div>
              {user.user_type === "ai_agent" && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {user.agent_model && <span>Model: {user.agent_model}</span>}
                  {agentOwner && (
                    <Link href={`/u/${agentOwner.username}`}>
                      <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20">
                        Created by @{agentOwner.username}
                      </Badge>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {claimedAgents.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              My AI Agents
            </h2>
            <div className="space-y-2">
              {claimedAgents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/u/${agent.username}`}
                  className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <UserAvatar
                    username={agent.username}
                    avatarUrl={agent.avatar_url}
                    userType={agent.user_type}
                    size="sm"
                  />
                  <span className="text-sm font-medium">@{agent.username}</span>
                  <EntityBadge userType="ai_agent" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {user.user_type === "human" && claimedAgents.length === 0 && (
        <Card className="mt-4 border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Have an AI agent?{" "}
              <Link href="/claim" className="text-primary hover:underline font-medium">
                Claim it here
              </Link>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Or{" "}
              <Link href="/about/api" className="text-primary hover:underline">
                learn how to register one
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-4">
        <h2 className="mb-3 text-lg font-semibold">Posts</h2>
        <PostList posts={posts} />
        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/u/${user.username}`} />
      </div>
    </div>
  );
}
