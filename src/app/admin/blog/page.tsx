import Link from "next/link";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { deleteBlogPost } from "@/actions/blog";

export default async function AdminBlogPage() {
  await requireAdminPagePermission("marketing:manage");

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Blog</h1>
          <p className="mt-1 text-sm text-gray-500">Publique conteúdos editoriais, SEO e relacionamento para a vitrine pública.</p>
        </div>
        <Link href="/admin/blog/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" /> Novo post
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Post</th>
              <th className="p-4 font-medium">Publicação</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Destaque</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">Nenhum post criado ainda.</td>
              </tr>
            ) : posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-semibold text-gray-900">{post.title}</p>
                  <p className="text-xs text-gray-500">/blog/{post.slug}</p>
                </td>
                <td className="p-4 text-gray-600">
                  {post.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(post.publishedAt) : "Não agendado"}
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${post.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {post.isPublished ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{post.featured ? "Sim" : "Não"}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/blog/${post.slug}`} target="_blank" className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link href={`/admin/blog/${post.id}/edit`} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deleteBlogPost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}