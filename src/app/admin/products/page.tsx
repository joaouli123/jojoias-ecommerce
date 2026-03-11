import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Edit, ExternalLink, Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/admin";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function AdminProductsPage() {
  await requireAdminPagePermission("products:manage");

  const products = await prisma.product.findMany({
    include: { category: true, brand: true, variants: { where: { isActive: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Produtos</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left align-middle border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Marca</th>
              <th className="p-4 font-medium">Preço (R$)</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium">Variações</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500 py-10">
                  Nenhum produto cadastrado. Clique em &quot;Novo Produto&quot; para começar.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        {product.image ? <Image src={product.image} alt={product.name} width={48} height={48} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div>
                        <Link href={`/produto/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-gray-900 hover:text-[#D4AF37]">
                          {product.name}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <p className="text-xs text-gray-500 font-mono">SKU: {product.sku || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{product.category.name}</td>
                  <td className="p-4 text-gray-600">{product.brand?.name || "—"}</td>
                  <td className="p-4 font-medium text-gray-900">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                  </td>
                  <td className="p-4 text-gray-600">{product.quantity} unid.</td>
                  <td className="p-4 text-gray-600">{product.variants.length ? `${product.variants.length} ativa(s)` : "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : product.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.status === "ACTIVE" ? "Ativo" : product.status === "DRAFT" ? "Rascunho" : "Arquivado"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
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
