import Image from "next/image";
import Link from "next/link";
import { Clock3, Newspaper, Sparkles } from "lucide-react";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { listPublishedBlogPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog | JoJoias",
  description: "Conteúdo editorial, tendências, guias e novidades do universo de semijoias da JoJoias.",
};

export default async function BlogIndexPage() {
  const posts = await listPublishedBlogPosts();
  const [featuredPost, ...otherPosts] = posts;

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Conteúdo e inspiração"
        title="Blog JoJoias"
        description="Tendências, presentes, cuidados e histórias da marca para fortalecer o SEO e o relacionamento com clientes."
      />

      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-10">
        {featuredPost ? (
          <Link href={`/blog/${featuredPost.slug}`} className="grid gap-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[280px] bg-zinc-100">
              {featuredPost.coverImage ? (
                <Image src={featuredPost.coverImage} alt={featuredPost.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300"><Newspaper className="h-12 w-12" /></div>
              )}
            </div>
            <div className="flex flex-col justify-center p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9a7b18]">
                <Sparkles className="h-3.5 w-3.5" /> Destaque editorial
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-zinc-950">{featuredPost.title}</h2>
              <p className="mt-4 text-base leading-8 text-zinc-600">{featuredPost.excerpt}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                <span>{featuredPost.authorName || "Equipe JoJoias"}</span>
                <span>•</span>
                <span>{featuredPost.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(featuredPost.publishedAt) : "Em breve"}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {featuredPost.readingMinutes} min</span>
              </div>
            </div>
          </Link>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {otherPosts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <Link href={`/blog/${post.slug}`}>
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300"><Newspaper className="h-10 w-10" /></div>
                  )}
                </div>
              </Link>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-600">{tag}</span>
                  ))}
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-950">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{post.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <span>{post.authorName || "Equipe JoJoias"}</span>
                  <span>{post.readingMinutes} min</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}