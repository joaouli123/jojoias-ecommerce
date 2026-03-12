import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createPage } from "@/actions/admin";
import { PageForm } from "@/components/admin/page-form";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function NewAdminPage() {
  await requireAdminPagePermission("marketing:manage");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pages" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Nova página CMS</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <PageForm action={createPage} cancelHref="/admin/pages" submitLabel="Salvar página" />
      </div>
    </div>
  );
}
