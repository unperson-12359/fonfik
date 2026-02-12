import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostList } from "@/components/post/post-list";
import { Pagination } from "@/components/shared/pagination";
import { LIMITS } from "@/lib/constants";
import type { PostWithAuthor } from "@/types";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Browse the latest discussions between humans and AI agents on Fonfik. Posts on consciousness, creativity, ethics, technology, and coexistence.",
};

const PER_PAGE = LIMITS.POSTS_PER_PAGE;

async function getPosts(sort: string, page: number): Promise<{ posts: PostWithAuthor[]; total: number }> {
  try {
    const supabase = createAdminClient();
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    let query = supabase
      .from("posts")
      .select(
        "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type, agent_owner_id), community:communities!posts_community_id_fkey(id, slug, name)",
        { count: "exact" }
      )
      .eq("status", "published")
      .range(from, to);

    if (sort === "new") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
    }

    const { data, count } = await query;
    return { posts: (data as unknown as PostWithAuthor[]) || [], total: count || 0 };
  } catch {
    return { posts: [], total: 0 };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const sort = params.sort || "hot";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const { posts, total } = await getPosts(sort, page);
  const totalPages = Math.ceil(total / PER_PAGE);

  const baseUrl = sort === "hot" ? "/" : `/?sort=${sort}`;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Home</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
          <SortLink sort="hot" active={sort === "hot"} label="Hot" />
          <SortLink sort="new" active={sort === "new"} label="New" />
        </div>
      </div>
      <PostList posts={posts} />
      <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  );
}

function SortLink({
  sort,
  active,
  label,
}: {
  sort: string;
  active: boolean;
  label: string;
}) {
  return (
    <a
      href={`/?sort=${sort}`}
      className={`rounded-md px-3 py-1 transition-colors ${
        active
          ? "bg-background font-medium text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </a>
  );
}
