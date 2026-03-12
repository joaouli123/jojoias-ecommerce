import Link from "next/link";
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deletePage } from "@/actions/admin";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function AdminPagesPage() {
  await requireAdminPagePermission("marketing:manage");

  const pages = await prisma.page.findMany({
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Páginas CMS</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie conteúdo institucional, landing pages e páginas de apoio da loja.</p>
        </div>
        <Link href="/admin/pages/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" /> Nova página
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Página</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">SEO</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">Nenhuma página criada ainda.</td>
              </tr>
            ) : pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-semibold text-gray-900">{page.title}</p>
                  <p className="text-xs text-gray-500">Atualizada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(page.updatedAt)}</p>
                </td>
                <td className="p-4 font-mono text-xs text-gray-600">/pages/{page.slug}</td>
                <td className="p-4 text-xs text-gray-600">
                  <div>{page.metaTitle || "Sem meta title"}</div>
                  <div>{page.metaDescription || "Sem meta description"}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${page.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {page.isPublished ? "Publicada" : "Rascunho"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/pages/${page.slug}`} target="_blank" className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link href={`/admin/pages/${page.id}/edit`} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deletePage}>
                      <input type="hidden" name="id" value={page.id} />
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
