import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
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

      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="rounded-[20px] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
            <FileText className="h-4 w-4" /> Conteúdo CMS
          </div>
          <div className="mt-6 whitespace-pre-line text-base leading-8 text-zinc-700">
            {page.content}
          </div>
        </div>
      </section>
    </div>
  );
}
