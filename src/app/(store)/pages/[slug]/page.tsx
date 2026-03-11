import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getPublishedPageBySlug } from "@/lib/cms-pages";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata, truncateSeoText } from "@/lib/site-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) {
    return {
      title: "Página não encontrada",
    };
  }

  const description = page.metaDescription || truncateSeoText(page.content, 160);

  return buildPageMetadata({
    title: page.metaTitle || page.title,
    description,
    path: `/pages/${page.slug}`,
    type: "article",
  });
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) notFound();

  const description = page.metaDescription || truncateSeoText(page.content, 160);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: page.title, path: `/pages/${page.slug}` },
  ]);
  const pageJsonLd = buildPageJsonLd({
    title: page.metaTitle || page.title,
    description,
    path: `/pages/${page.slug}`,
    type: "Article",
  });

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <InstitutionalHero
        eyebrow="Página especial"
        title={page.title}
        description={description || "Conteúdo editorial publicado pela equipe da Luxijóias."}
      />

      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="max-w-4xl">
          <article className="whitespace-pre-line text-base leading-7 text-zinc-900">
            {page.content}
          </article>
        </div>
      </section>
    </div>
  );
}
