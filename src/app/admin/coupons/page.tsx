import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteCoupon } from "@/actions/coupons";
import { parseCouponScopeSlugs } from "@/lib/coupons";
import { formatCurrency } from "@/lib/utils";
import { requireAdminPagePermission } from "@/lib/admin-auth";

function describeCouponScope(coupon: {
  appliesToBrandSlugs: string | null;
  appliesToCategorySlugs: string | null;
  firstOrderOnly: boolean;
  allowWithPixDiscount: boolean;
}) {
  const brands = parseCouponScopeSlugs(coupon.appliesToBrandSlugs);
  const categories = parseCouponScopeSlugs(coupon.appliesToCategorySlugs);
  const labels = [
    brands.length ? `${brands.length} marca${brands.length > 1 ? "s" : ""}` : null,
    categories.length ? `${categories.length} categoria${categories.length > 1 ? "s" : ""}` : null,
    coupon.firstOrderOnly ? "1ª compra" : null,
    coupon.allowWithPixDiscount ? "acumula Pix" : "sem Pix",
  ].filter(Boolean);

  return labels.join(" • ");
}

export default async function AdminCouponsPage() {
  await requireAdminPagePermission("marketing:manage");

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cupons</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie descontos, regras e campanhas promocionais.</p>
        </div>
        <Link href="/admin/coupons/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" /> Novo cupom
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm align-middle">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Código</th>
              <th className="p-4 font-medium">Regra</th>
              <th className="p-4 font-medium">Período</th>
              <th className="p-4 font-medium">Usos</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">Nenhum cupom cadastrado ainda.</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-mono text-sm font-bold text-gray-900">{coupon.code}</p>
                    <p className="text-xs text-gray-500">{coupon.name}</p>
                  </td>
                  <td className="p-4 text-gray-600">
                    <p>{coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : formatCurrency(coupon.value)}</p>
                    <p className="text-xs text-gray-500">
                      {typeof coupon.minSubtotal === "number" ? `Pedido mínimo ${formatCurrency(coupon.minSubtotal)}` : "Sem pedido mínimo"}
                    </p>
                    <p className="text-xs text-gray-500">{describeCouponScope(coupon)}</p>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">
                    <p>{coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString("pt-BR") : "Imediato"}</p>
                    <p>{coupon.expiresAt ? `até ${new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}` : "sem expiração"}</p>
                  </td>
                  <td className="p-4 text-gray-600">
                    {coupon.usageCount}
                    {typeof coupon.usageLimit === "number" ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {coupon.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/coupons/${coupon.id}/edit`} className="rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <form action={deleteCoupon}>
                        <input type="hidden" name="id" value={coupon.id} />
                        <button type="submit" className="rounded p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
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