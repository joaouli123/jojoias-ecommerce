import Image from "next/image";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { MediaUploadForm } from "@/components/admin/media-upload-form";

export default async function AdminMediaPage() {
  await requireAdminPagePermission("marketing:manage");

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Biblioteca de mídia</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">Gerencie os uploads nativos da plataforma e copie URLs prontas para produtos, banners e conteúdo.</p>
      </div>

      <MediaUploadForm />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-square bg-gray-100">
              <Image src={asset.url} alt={asset.alt || asset.originalName} fill className="object-cover" />
            </div>
            <div className="space-y-2 p-4 text-sm">
              <p className="font-semibold text-gray-900 line-clamp-1">{asset.originalName}</p>
              <p className="text-xs text-gray-500">{asset.mimeType} • {(asset.size / 1024).toFixed(1)} KB</p>
              <input readOnly value={asset.url} className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-xs text-gray-700" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
