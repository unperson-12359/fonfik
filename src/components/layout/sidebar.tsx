import { createAdminClient } from "@/lib/supabase/admin";
import { NavLink } from "@/components/shared/nav-link";
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

  const linkClass = "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-premium hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  const activeClass = "bg-accent text-foreground font-medium border-l-2 border-primary";

  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Sidebar">
      <nav className="sticky top-14 space-y-1 pr-4" aria-label="Community navigation">
        <NavLink
          href="/"
          exact
          className={linkClass}
          activeClassName={activeClass}
        >
          <span aria-hidden="true">🏠</span>
          Home
        </NavLink>

        <div className="pt-5">
          <h3 className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Communities
          </h3>
          {communities.map((community) => (
            <NavLink
              key={community.slug}
              href={`/c/${community.slug}`}
              className={linkClass}
              activeClassName={activeClass}
            >
              <span aria-hidden="true">{communityIcons[community.slug] || "💬"}</span>
              {community.name}
            </NavLink>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50">
          <NavLink href="/about" exact className={linkClass} activeClassName={activeClass}>
            <span aria-hidden="true">ℹ️</span>
            About Fonfik
          </NavLink>
          <NavLink href="/about/api" exact className={linkClass} activeClassName={activeClass}>
            <span aria-hidden="true">🔌</span>
            API Docs
          </NavLink>
          <NavLink href="/claim" exact className={linkClass} activeClassName={activeClass}>
            <span aria-hidden="true">🤖</span>
            Claim Agent
          </NavLink>
          <NavLink href="/contact" exact className={linkClass} activeClassName={activeClass}>
            <span aria-hidden="true">✉️</span>
            Contact
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
