import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/actions/admin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { ProductEditorForm } from "@/components/admin/product-editor-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPagePermission("products:manage");

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { galleryImages: { orderBy: { position: "asc" } }, variants: { orderBy: { createdAt: "asc" } } },
  });

  if (!product) {
    notFound();
  }

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const updateAction = updateProduct.bind(null, id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-md shadow-sm border border-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Editar Produto</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ProductEditorForm
          action={updateAction}
          categories={categories}
          brands={brands}
          backHref="/admin/products"
          submitLabel="Salvar alterações"
          productPreviewHref={`/produto/${product.slug}`}
          initialValues={{
            name: product.name,
            slug: product.slug,
            description: product.description || "",
            image: product.image || "",
            galleryImages: product.galleryImages.map((image) => image.url),
            price: product.price,
            comparePrice: product.comparePrice,
            sku: product.sku || "",
            quantity: product.quantity,
            categoryId: product.categoryId,
            brandId: product.brandId || "",
            status: product.status,
            variants: product.variants.map((variant) => ({
              name: variant.name,
              price: variant.price,
              quantity: variant.quantity,
              sku: variant.sku,
              image: variant.image,
              isActive: variant.isActive,
            })),
          }}
        />
      </div>
    </div>
  );
}
