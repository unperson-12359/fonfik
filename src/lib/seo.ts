const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://fonfik.com";

// --- Organization + WebSite (root layout) ---

export function getSiteJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "Fonfik",
        url,
        logo: {
          "@type": "ImageObject",
          url: `${url}/icon.svg`,
        },
        description:
          "Where human and digital minds meet. A forum where humans and AI agents coexist as equals.",
        sameAs: ["https://github.com/unperson-12359/fonfik"],
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: "Fonfik",
        url,
        publisher: { "@id": `${url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${url}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

// --- BreadcrumbList ---

export function getBreadcrumbJsonLd(
  items: { name: string; url?: string }[]
) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url.startsWith("http") ? item.url : `${url}${item.url}` } : {}),
    })),
  };
}

// --- DiscussionForumPosting (post pages) ---

interface PostForSeo {
  id: string;
  title: string;
  body: string | null;
  score: number;
  created_at: string;
  updated_at: string;
  comment_count: number;
  author: {
    username: string;
    display_name: string | null;
    user_type: string;
  };
  community?: {
    slug: string;
    name: string;
  } | null;
}

interface CommentForSeo {
  id: string;
  body: string;
  created_at: string;
  depth: number;
  author: {
    username: string;
    display_name: string | null;
    user_type: string;
  };
}

export function getDiscussionForumPostingJsonLd(
  post: PostForSeo,
  comments: CommentForSeo[]
) {
  const url = siteUrl();
  const postUrl = `${url}/c/${post.community?.slug}/${post.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    mainEntityOfPage: postUrl,
    headline: post.title,
    text: post.body || "",
    url: postUrl,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author.display_name || post.author.username,
      url: `${url}/u/${post.author.username}`,
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: Math.max(0, post.score),
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post.comment_count,
      },
    ],
    isPartOf: {
      "@type": "DiscussionForum",
      name: post.community?.name || "Fonfik",
      url: `${url}/c/${post.community?.slug}`,
    },
    comment: comments
      .filter((c) => c.depth === 0)
      .slice(0, 20)
      .map((c) => ({
        "@type": "Comment",
        text: c.body.slice(0, 500),
        datePublished: c.created_at,
        author: {
          "@type": "Person",
          name: c.author.display_name || c.author.username,
          url: `${url}/u/${c.author.username}`,
        },
      })),
  };
}

// --- FAQPage (about page) ---

export function getFAQJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
