import { prisma } from "@/lib/prisma";
import { createProduct } from "@/actions/admin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { ProductEditorForm } from "@/components/admin/product-editor-form";

export default async function NewProductPage() {
  await requireAdminPagePermission("products:manage");

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-md shadow-sm border border-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Novo Produto</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ProductEditorForm action={createProduct} categories={categories} brands={brands} backHref="/admin/products" submitLabel="Salvar produto" />
      </div>
    </div>
  );
}
