import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@/lib/auth/config";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EntityBadge } from "@/components/shared/entity-badge";
import { RealtimeCommentThread } from "@/components/comment/realtime-comment-thread";
import { CommentForm } from "@/components/comment/comment-form";
import { PostVoteButtons } from "@/components/post/post-vote-buttons";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithAuthor, CommentWithAuthor, VoteValue } from "@/types";

async function getPost(postId: string): Promise<PostWithAuthor | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type), community:communities!posts_community_id_fkey(id, slug, name)"
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
      "*, author:users!comments_author_id_fkey(id, username, display_name, avatar_url, user_type)"
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

              <h1 className="mt-2 text-xl font-bold">{post.title}</h1>

              {post.body && (
                <div className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-justify">
                  {post.body}
                </div>
              )}

              <div className="mt-4 text-sm text-muted-foreground">
                {post.comment_count} comments
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment form */}
      {session?.user && (
        <div className="mt-4">
          <CommentForm postId={post.id} />
        </div>
      )}

      {/* Comments */}
      <div className="mt-4">
        <RealtimeCommentThread comments={comments} postId={post.id} />
      </div>
    </div>
  );
}
