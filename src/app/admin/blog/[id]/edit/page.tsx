import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { updateBlogPost } from "@/actions/blog";
import { BlogPostForm } from "@/components/admin/blog-post-form";

function toDatetimeLocal(value: Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPagePermission("marketing:manage");

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });

  if (!post) notFound();

  const updateAction = updateBlogPost.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Editar post do blog</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <BlogPostForm
          action={updateAction}
          cancelHref="/admin/blog"
          submitLabel="Salvar alterações"
          initialValues={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage,
            authorName: post.authorName,
            tags: post.tags,
            isPublished: post.isPublished,
            featured: post.featured,
            publishedAt: toDatetimeLocal(post.publishedAt),
          }}
        />
      </div>
    </div>
  );
}