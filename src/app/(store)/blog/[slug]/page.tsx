import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPublishedBlogPostBySlug, listPublishedBlogPosts } from "@/lib/blog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post não encontrado" };
  }

  return {
    title: `${post.title} | Blog JoJoias`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | Blog JoJoias`,
      description: post.excerpt,
      type: "article",
      url: `${siteUrl}/blog/${post.slug}`,
      images: post.coverImage ? [{ url: `${siteUrl}${post.coverImage}` }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) notFound();

  const related = (await listPublishedBlogPosts())
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="bg-white">
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-10">
          <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200">{tag}</span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span>{post.authorName || "Equipe JoJoias"}</span>
            <span>•</span>
            <span>{post.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(post.publishedAt) : "Sem data"}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {post.readingMinutes} min de leitura</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-10">
        {post.coverImage ? (
          <div className="relative mb-10 aspect-[16/7] overflow-hidden rounded-3xl bg-zinc-100">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        ) : null}

        <article className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="whitespace-pre-line text-base leading-8 text-zinc-700">{post.content}</div>
        </article>

        <div className="mt-10 flex items-center justify-between gap-4">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-[#D4AF37]">
            <ArrowLeft className="h-4 w-4" /> Voltar para o blog
          </Link>
        </div>

        {related.length ? (
          <div className="mt-12">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Continue lendo</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/blog/${item.slug}`} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition-colors hover:border-[#D4AF37]/40 hover:bg-white">
                  <h3 className="text-lg font-bold text-zinc-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}