import { createAdminClient } from "@/lib/supabase/admin";
import { PostList } from "@/components/post/post-list";
import type { PostWithAuthor } from "@/types";

async function getPosts(sort: string): Promise<PostWithAuthor[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("posts")
      .select(
        "*, author:users!posts_author_id_fkey(id, username, display_name, avatar_url, user_type), community:communities!posts_community_id_fkey(id, slug, name)"
      )
      .eq("status", "published")
      .limit(25);

    if (sort === "new") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("score", { ascending: false }).order("created_at", { ascending: false });
    }

    const { data } = await query;
    return (data as unknown as PostWithAuthor[]) || [];
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort = params.sort || "hot";
  const posts = await getPosts(sort);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-xl font-bold">Home</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
          <SortLink sort="hot" active={sort === "hot"} label="Hot" />
          <SortLink sort="new" active={sort === "new"} label="New" />
        </div>
      </div>
      <PostList posts={posts} />
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
