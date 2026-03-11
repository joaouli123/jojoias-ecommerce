import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBanner } from "@/actions/admin";
import { BannerForm } from "@/components/admin/banner-form";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function NewBannerPage() {
  await requireAdminPagePermission("marketing:manage");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/banners" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Novo banner</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <BannerForm action={createBanner} cancelHref="/admin/banners" submitLabel="Salvar banner" />
      </div>
    </div>
  );
}