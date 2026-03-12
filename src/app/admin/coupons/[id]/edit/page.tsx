import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCoupon } from "@/actions/coupons";
import { CouponForm } from "@/components/admin/coupon-form";
import { requireAdminPagePermission } from "@/lib/admin-auth";

function toDatetimeLocal(value: Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (input: number) => input.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPagePermission("marketing:manage");

  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) {
    notFound();
  }

  const updateAction = updateCoupon.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/coupons" className="rounded-md border border-gray-100 bg-white p-2 text-gray-500 shadow-sm transition-colors hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Editar cupom</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <CouponForm
          action={updateAction}
          cancelHref="/admin/coupons"
          submitLabel="Salvar alterações"
          initialValues={{
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type,
            value: coupon.value,
            minSubtotal: coupon.minSubtotal,
            maxDiscount: coupon.maxDiscount,
            startsAt: toDatetimeLocal(coupon.startsAt),
            expiresAt: toDatetimeLocal(coupon.expiresAt),
            isActive: coupon.isActive,
            usageLimit: coupon.usageLimit,
            appliesToBrandSlugs: coupon.appliesToBrandSlugs,
            appliesToCategorySlugs: coupon.appliesToCategorySlugs,
            firstOrderOnly: coupon.firstOrderOnly,
            allowWithPixDiscount: coupon.allowWithPixDiscount,
          }}
        />
      </div>
    </div>
  );
}