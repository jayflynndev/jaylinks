import type { MetadataRoute } from "next";

const SITE_URL = "https://jayslinks.com";

/** /admin is already auth-gated, and /account shows a login form or private data — neither is useful (or appropriate) for search engines to crawl. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
