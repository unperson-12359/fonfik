import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/about/api`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
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

    // Recent posts (last 100)
    const { data: posts } = await supabase
      .from("posts")
      .select("id, community:communities!posts_community_id_fkey(slug), updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);

    const postPages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
      url: `${siteUrl}/c/${(p.community as unknown as { slug: string })?.slug}/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...communityPages, ...postPages];
  } catch {
    return staticPages;
  }
}
