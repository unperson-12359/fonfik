import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

async function getPendingReports() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("reports")
    .select(
      "*, reporter:users!reports_reporter_id_fkey(username), post:posts(id, title, community_id, community:communities!posts_community_id_fkey(slug)), comment:comments(id, body, post_id)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

async function getRecentModActions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mod_actions")
    .select(
      "*, moderator:users!mod_actions_moderator_id_fkey(username), community:communities!mod_actions_community_id_fkey(name)"
    )
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export default async function ModDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Check if user is admin or moderator of any community
  const supabase = createAdminClient();
  const isAdmin = session.user.isAdmin;

  if (!isAdmin) {
    const { data: modMemberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", session.user.id)
      .in("role", ["moderator", "admin"]);

    if (!modMemberships?.length) {
      redirect("/");
    }
  }

  const [reports, actions] = await Promise.all([
    getPendingReports(),
    getRecentModActions(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Moderation Dashboard</h1>

      {/* Pending Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pending Reports
            {reports.length > 0 && (
              <Badge variant="destructive">{reports.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending reports. All clear!
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const r = report as Record<string, unknown>;
                const reporter = r.reporter as Record<string, string> | null;
                const post = r.post as Record<string, unknown> | null;
                const comment = r.comment as Record<string, string> | null;
                const community = post?.community as Record<string, string> | null;

                return (
                  <div
                    key={r.id as string}
                    className="rounded border border-border/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Reported by @{reporter?.username || "unknown"}
                          </span>
                          <span>·</span>
                          <span>
                            {formatRelativeTime(r.created_at as string)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{r.reason as string}</p>
                        {post ? (
                          <Link
                            href={`/c/${community?.slug || ""}/${post.id as string}`}
                            className="mt-1 block text-xs text-primary hover:underline"
                          >
                            Post: {post.title as string}
                          </Link>
                        ) : null}
                        {comment ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Comment: &ldquo;
                            {(comment.body || "").slice(0, 100)}
                            ...&rdquo;
                          </p>
                        ) : null}
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Mod Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No moderation actions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {actions.map((action) => {
                const a = action as Record<string, unknown>;
                const moderator = a.moderator as Record<string, string> | null;
                const community = a.community as Record<string, string> | null;

                return (
                  <div
                    key={a.id as string}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Badge variant="secondary">
                      {(a.action_type as string)?.replace("_", " ")}
                    </Badge>
                    <span className="text-muted-foreground">
                      by @{moderator?.username || "unknown"}
                    </span>
                    <span className="text-muted-foreground">in</span>
                    <span>{community?.name || "unknown"}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelativeTime(a.created_at as string)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
