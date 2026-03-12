import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { createBlogPost } from "@/actions/blog";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default async function NewBlogPostPage() {
  await requireAdminPagePermission("marketing:manage");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Novo post do blog</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <BlogPostForm action={createBlogPost} cancelHref="/admin/blog" submitLabel="Salvar post" />
      </div>
    </div>
  );
}