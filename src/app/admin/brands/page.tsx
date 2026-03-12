import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteBrand } from "@/actions/brands";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function AdminBrandsPage() {
  await requireAdminPagePermission("catalog:manage");

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Marcas</h1>
          <p className="mt-1 text-sm text-gray-500">Organize o catálogo por fabricantes, coleções ou linhas próprias.</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Marca
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left align-middle border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Produtos</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500 py-10">
                  Nenhuma marca cadastrada até o momento.
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-semibold text-gray-900">{brand.name}</td>
                  <td className="p-4 text-gray-600 font-mono text-xs">{brand.slug}</td>
                  <td className="p-4 text-gray-600">{brand._count.products}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/brands/${brand.id}/edit`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={deleteBrand}>
                        <input type="hidden" name="id" value={brand.id} />
                        <button
                          type="submit"
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}