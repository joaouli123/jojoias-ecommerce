import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBanner } from "@/actions/admin";
import { BannerForm } from "@/components/admin/banner-form";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPagePermission("marketing:manage");

  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) notFound();

  const updateAction = updateBanner.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/banners" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Editar banner</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <BannerForm
          action={updateAction}
          cancelHref="/admin/banners"
          submitLabel="Salvar alterações"
          initialValues={{
            title: banner.title,
            subtitle: banner.subtitle,
            imageUrl: banner.imageUrl,
            mobileUrl: banner.mobileUrl,
            href: banner.href,
            placement: banner.placement as "hero" | "secondary" | "sidebar",
            isActive: banner.isActive,
            position: banner.position,
            startsAt: banner.startsAt,
            endsAt: banner.endsAt,
          }}
        />
      </div>
    </div>
  );
}