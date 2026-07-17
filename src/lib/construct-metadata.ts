import type { Metadata } from "next";

import { siteConfig } from "~/configs/site-config";

interface ConstructMetadataParams {
  description?: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
  title?: string;
}

/**
 * Build page-level `Metadata` with sensible defaults inherited from
 * `siteConfig`. Use in a route's `export const metadata` or
 * `generateMetadata`.
 *
 * @example
 * export const metadata = constructMetadata({ title: "Dashboard" });
 */
export function constructMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  path = "/",
}: ConstructMetadataParams = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const url = new URL(path, siteConfig.url).toString();

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    robots: noIndex
      ? { follow: false, index: false }
      : { follow: true, index: true },
    openGraph: {
      description,
      images: [{ url: image }],
      siteName: siteConfig.name,
      title: pageTitle,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: [image],
      title: pageTitle,
    },
  };
}
