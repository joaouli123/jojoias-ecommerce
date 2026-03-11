import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/actions/admin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminPagePermission } from "@/lib/admin-auth";

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-md shadow-sm border border-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Editar Produto</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form action={updateAction} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Nome do Produto *</label>
              <input type="text" id="name" name="name" defaultValue={product.name} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug URL *</label>
              <input type="text" id="slug" name="slug" defaultValue={product.slug} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

             <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">Descrição</label>
              <textarea id="description" name="description" defaultValue={product.description || ""} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
            </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="image" className="text-sm font-medium text-gray-700">Imagem principal</label>
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                  <span>Aceita URL absoluta ou caminho interno como /uploads/media/... e /demo-products/...</span>
                  <Link href="/admin/media" className="font-semibold text-primary-600 hover:text-primary-700">Abrir biblioteca de mídia</Link>
                </div>
                <input type="text" id="image" name="image" defaultValue={product.image || ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="galleryImages" className="text-sm font-medium text-gray-700">Galeria de imagens</label>
                <textarea id="galleryImages" name="galleryImages" defaultValue={product.galleryImages.map((image) => image.url).join("\n")} rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
              </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium text-gray-700">Preço (R$) *</label>
              <input type="number" step="0.01" id="price" name="price" defaultValue={product.price} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

             <div className="space-y-2">
              <label htmlFor="comparePrice" className="text-sm font-medium text-gray-700">Preço Comparação (R$)</label>
              <input type="number" step="0.01" id="comparePrice" name="comparePrice" defaultValue={product.comparePrice || ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="space-y-2">
              <label htmlFor="sku" className="text-sm font-medium text-gray-700">Código SKU</label>
              <input type="text" id="sku" name="sku" defaultValue={product.sku || ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">Qtd. Estoque *</label>
              <input type="number" id="quantity" name="quantity" defaultValue={product.quantity} required min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="space-y-2">
              <label htmlFor="categoryId" className="text-sm font-medium text-gray-700">Categoria *</label>
              <select id="categoryId" name="categoryId" defaultValue={product.categoryId} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                 <option value="" disabled hidden>Selecione uma categoria</option>
                 {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                 ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="brandId" className="text-sm font-medium text-gray-700">Marca</label>
              <select id="brandId" name="brandId" defaultValue={product.brandId || ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                 <option value="">Sem marca</option>
                 {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                 ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-gray-700">Status *</label>
              <select id="status" name="status" defaultValue={product.status} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                 <option value="ACTIVE">Ativo (Público)</option>
                 <option value="DRAFT">Rascunho</option>
                 <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="variants" className="text-sm font-medium text-gray-700">Variações</label>
              <textarea
                id="variants"
                name="variants"
                defaultValue={product.variants.map((variant) => [variant.name, variant.price, variant.quantity, variant.sku || "", variant.image || ""].join("|")).join("\n")}
                rows={5}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500">Formato: nome|preço|estoque|sku|imagem. Ao salvar, as variações atuais serão substituídas pela lista acima.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
             <Link href="/admin/products" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
               Cancelar
             </Link>
             <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
               Salvar Alterações
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
