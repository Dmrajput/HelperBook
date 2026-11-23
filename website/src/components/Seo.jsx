import { Helmet } from "react-helmet-async";
import { SITE } from "@/config/site";

export function Seo({ title, description, path = "/", noIndex = false }) {
  const fullTitle = title ? `${title} · ${SITE.productName}` : `${SITE.productName} — Employee management for small businesses`;
  const desc = description || SITE.description;
  const url = `${SITE.siteUrl.replace(/\/$/, "")}${path}`;
  const isProdIndexed = import.meta.env.PROD && import.meta.env.VITE_ALLOW_INDEXING === "true";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.productName} />
      <meta property="og:image" content={`${SITE.siteUrl.replace(/\/$/, "")}/og-preview.jpg`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {(noIndex || !isProdIndexed) && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
}
