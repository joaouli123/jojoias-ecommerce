import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getPublishedPageBySlug } from "@/lib/cms-pages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) {
    return {
      title: "Página não encontrada",
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.content.slice(0, 160),
    alternates: {
      canonical: `/pages/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.content.slice(0, 160),
      type: "article",
      url: `${siteUrl}/pages/${page.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.content.slice(0, 160),
    },
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) notFound();

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Página especial"
        title={page.title}
        description={page.metaDescription || "Conteúdo editorial publicado pela equipe da JoJoias."}
      />

      <section className="mx-auto max-w-4xl px-6 py-14 sm:px-8 lg:px-10 lg:py-16">
        <article className="whitespace-pre-line text-[15px] leading-8 text-zinc-700 sm:text-base">
          {page.content}
        </article>
      </section>
    </div>
  );
}
