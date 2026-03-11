import type { Metadata } from "next";

const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

type JsonLdPageInput = {
  title: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "FAQPage" | "Article";
};

export function normalizeSeoText(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateSeoText(value: string, maxLength: number) {
  const normalized = normalizeSeoText(value);
  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength + 1);
  const breakIndex = sliced.lastIndexOf(" ");
  return (breakIndex > Math.floor(maxLength * 0.6) ? sliced.slice(0, breakIndex) : normalized.slice(0, maxLength)).trim();
}

export function toAbsoluteUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${defaultSiteUrl}/${path}`;
  }

  return `${defaultSiteUrl}${path}`;
}

export function withSiteTitle(title: string) {
  const normalized = normalizeSeoText(title);
  if (!normalized) return "Luxijóias";
  if (normalized.includes("Luxijóias")) return normalized;
  return `${normalized} | Luxijóias`;
}

export function buildPageMetadata({ title, description, path, type = "website" }: PageMetadataInput): Metadata {
  const normalizedTitle = withSiteTitle(title);
  const normalizedDescription = truncateSeoText(description, 160);
  const absoluteUrl = toAbsoluteUrl(path);

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: normalizedTitle,
      description: normalizedDescription,
      url: absoluteUrl,
      type,
      locale: "pt_BR",
      siteName: "Luxijóias",
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildPageJsonLd({ title, description, path, type = "WebPage" }: JsonLdPageInput) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: normalizeSeoText(title),
    description: truncateSeoText(description, 160),
    url: toAbsoluteUrl(path),
    inLanguage: "pt-BR",
    isPartOf: {
      "@type": "WebSite",
      name: "Luxijóias",
      url: defaultSiteUrl,
    },
  };
}