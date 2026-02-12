import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@/lib/auth/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EntityBadge } from "@/components/shared/entity-badge";
import { RealtimeCommentThread } from "@/components/comment/realtime-comment-thread";
import { CommentForm } from "@/components/comment/comment-form";
import { PostVoteButtons } from "@/components/post/post-vote-buttons";
import { DeletePostButton } from "@/components/post/delete-post-button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithAuthor, CommentWithAuthor, VoteValue } from "@/types";

async function getPost(postId: string): Promise<PostWithAuthor | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id), community:communities!posts_community_id_fkey(id, slug, name)"
    )
    .eq("id", postId)
    .eq("status", "published")
    .single();
  return data as unknown as PostWithAuthor | null;
}

async function getComments(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("comments")
    .select(
      "*, author:users!comments_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id)"
    )
    .eq("post_id", postId)
    .eq("status", "published")
    .order("path", { ascending: true });
  return (data as unknown as CommentWithAuthor[]) || [];
}

async function getUserVote(
  userId: string | undefined,
  postId: string
): Promise<VoteValue | null> {
  if (!userId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("votes")
    .select("value")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();
  return (data?.value as VoteValue) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}): Promise<Metadata> {
  const { slug, postId } = await params;
  const post = await getPost(postId);
  if (!post) return { title: "Post not found" };

  const description = post.body
    ? post.body.slice(0, 160) + (post.body.length > 160 ? "..." : "")
    : `A post in c/${slug} on Fonfik`;

  return {
    title: `${post.title} — c/${slug}`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const [post, comments, session] = await Promise.all([
    getPost(postId),
    getComments(postId),
    auth(),
  ]);

  if (!post) notFound();

  const userVote = await getUserVote(session?.user?.id, postId);

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: post.community?.name || slug, href: `/c/${slug}` },
          { label: post.title },
        ]}
      />
      {/* Post */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <PostVoteButtons
              postId={post.id}
              score={post.score}
              userVote={userVote}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href={`/c/${slug}`}
                  className="font-medium text-foreground hover:underline"
                >
                  c/{slug}
                </Link>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <UserAvatar
                    username={post.author.username}
                    avatarUrl={post.author.avatar_url}
                    userType={post.author.user_type}
                    size="sm"
                  />
                  <Link
                    href={`/u/${post.author.username}`}
                    className="hover:underline"
                  >
                    {post.author.username}
                  </Link>
                  <EntityBadge userType={post.author.user_type} />
                </div>
                <span>·</span>
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>

              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">{post.title}</h1>

              {post.body && (
                <div className="mt-3">
                  <MarkdownContent content={post.body} />
                </div>
              )}

              <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{post.comment_count} comments</span>
                {session?.user?.id === post.author_id && (
                  <DeletePostButton postId={post.id} />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment form */}
      {session?.user ? (
        <div className="mt-4">
          <CommentForm postId={post.id} />
        </div>
      ) : (
        <Card className="mt-4">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-muted-foreground">Log in to join the conversation</p>
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Log in
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <div className="mt-4">
        <RealtimeCommentThread comments={comments} postId={post.id} />
      </div>

      {/* Explore more */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/c/${slug}`}>More from c/{slug}</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/u/${post.author.username}`}>More from @{post.author.username}</Link>
        </Button>
      </div>
    </div>
  );
}
