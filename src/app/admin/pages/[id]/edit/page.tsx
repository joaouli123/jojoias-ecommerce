import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePage } from "@/actions/admin";
import { PageForm } from "@/components/admin/page-form";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPagePermission("marketing:manage");

  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });

  if (!page) notFound();

  const updateAction = updatePage.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pages" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Editar página CMS</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <PageForm
          action={updateAction}
          cancelHref="/admin/pages"
          submitLabel="Salvar alterações"
          initialValues={{
            title: page.title,
            slug: page.slug,
            content: page.content,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            isPublished: page.isPublished,
          }}
        />
      </div>
    </div>
  );
}
