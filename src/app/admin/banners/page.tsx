import Link from "next/link";
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteBanner, reorderBanners } from "@/actions/admin";
import { requireAdminPagePermission } from "@/lib/admin-auth";

function formatSchedule(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function getReorderedIds(
  banners: Array<{ id: string; placement: string }>,
  bannerId: string,
  direction: "up" | "down",
) {
  const current = banners.find((item) => item.id === bannerId);
  if (!current) return banners.map((item) => item.id);

  const scoped = banners.filter((item) => item.placement === current.placement).map((item) => item.id);
  const currentIndex = scoped.findIndex((id) => id === bannerId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= scoped.length) {
    return banners.map((item) => item.id);
  }

  [scoped[currentIndex], scoped[targetIndex]] = [scoped[targetIndex], scoped[currentIndex]];

  let scopedPointer = 0;
  return banners.map((item) => {
    if (item.placement !== current.placement) return item.id;
    const nextId = scoped[scopedPointer];
    scopedPointer += 1;
    return nextId;
  });
}

export default async function AdminBannersPage() {
  await requireAdminPagePermission("marketing:manage");

  const banners = await prisma.banner.findMany({
    orderBy: [{ placement: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Banners</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie os banners do hero e os blocos promocionais da home.</p>
        </div>
        <Link href="/admin/banners/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" /> Novo banner
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Banner</th>
              <th className="p-4 font-medium">Posição</th>
              <th className="p-4 font-medium">Janela</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {banners.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">Nenhum banner cadastrado ainda.</td>
              </tr>
            ) : banners.map((banner) => {
              const scoped = banners.filter((item) => item.placement === banner.placement);
              const scopedIndex = scoped.findIndex((item) => item.id === banner.id);

              return (
                <tr key={banner.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-semibold text-gray-900">{banner.title}</p>
                  <p className="text-xs text-gray-500">
                    {banner.placement === "hero" ? "Hero principal" : banner.placement === "secondary" ? "Secundário" : "Sidebar"}
                  </p>
                </td>
                <td className="p-4 text-gray-600">{banner.position}</td>
                <td className="p-4 text-xs text-gray-600">
                  <div>De: {formatSchedule(banner.startsAt)}</div>
                  <div>Até: {formatSchedule(banner.endsAt)}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {banner.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <form action={reorderBanners}>
                      <input
                        type="hidden"
                        name="orderedIds"
                        value={JSON.stringify(getReorderedIds(banners, banner.id, "up"))}
                      />
                      <button type="submit" disabled={scopedIndex === 0} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={reorderBanners}>
                      <input
                        type="hidden"
                        name="orderedIds"
                        value={JSON.stringify(getReorderedIds(banners, banner.id, "down"))}
                      />
                      <button type="submit" disabled={scopedIndex === scoped.length - 1} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </form>
                    <Link href={`/admin/banners/${banner.id}/edit`} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deleteBanner}>
                      <input type="hidden" name="id" value={banner.id} />
                      <button type="submit" className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}