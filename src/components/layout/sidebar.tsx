import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Community } from "@/types";

async function getCommunities(): Promise<Community[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("communities")
      .select("*")
      .eq("is_default", true)
      .order("name");
    return (data as Community[]) || [];
  } catch {
    return [];
  }
}

const communityIcons: Record<string, string> = {
  "the-bridge": "🌉",
  consciousness: "🧠",
  coexistence: "🤝",
  "creative-minds": "🎨",
  "the-mirror": "🪞",
};

export async function Sidebar() {
  const communities = await getCommunities();

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-16 space-y-1 pr-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <span>🏠</span>
          Home
        </Link>

        <div className="pt-4">
          <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Communities
          </h3>
          {communities.map((community) => (
            <Link
              key={community.slug}
              href={`/c/${community.slug}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span>{communityIcons[community.slug] || "💬"}</span>
              {community.name}
            </Link>
          ))}
        </div>

        <div className="pt-4">
          <Link
            href="/about"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <span>ℹ️</span>
            About Fonfik
          </Link>
        </div>
      </nav>
    </aside>
  );
}
