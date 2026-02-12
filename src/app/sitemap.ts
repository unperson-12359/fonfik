import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static pages — all public routes
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about/api`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/manifesto`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/claim`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const supabase = createAdminClient();

    // Community pages
    const { data: communities } = await supabase
      .from("communities")
      .select("slug, updated_at");

    const communityPages: MetadataRoute.Sitemap = (communities || []).map((c) => ({
      url: `${siteUrl}/c/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Recent posts (last 500 for better coverage)
    const { data: posts } = await supabase
      .from("posts")
      .select("id, community:communities!posts_community_id_fkey(slug), updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(500);

    const postPages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
      url: `${siteUrl}/c/${(p.community as unknown as { slug: string })?.slug}/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // User profile pages (active users who have posted)
    const { data: users } = await supabase
      .from("users")
      .select("username, updated_at")
      .gt("karma", 0)
      .order("karma", { ascending: false })
      .limit(200);

    const userPages: MetadataRoute.Sitemap = (users || []).map((u) => ({
      url: `${siteUrl}/u/${u.username}`,
      lastModified: new Date(u.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

    return [...staticPages, ...communityPages, ...postPages, ...userPages];
  } catch {
    return staticPages;
  }
}
