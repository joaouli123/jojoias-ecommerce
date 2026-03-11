import { CouponType, type Coupon } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CouponValidationContext = {
  brandSlugs?: string[];
  categorySlugs?: string[];
  customerOrderCount?: number;
};

export type AppliedCoupon = {
  code: string;
  name: string;
  type: CouponType;
  value: number;
  discount: number;
  description?: string | null;
  allowWithPixDiscount: boolean;
};

export type CouponValidationResult =
  | {
      isValid: true;
      coupon: AppliedCoupon;
    }
  | {
      isValid: false;
      error: string;
    };

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function parseCouponScopeSlugs(value?: string | null) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function isCouponWithinSchedule(coupon: Coupon, now: Date) {
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.expiresAt && coupon.expiresAt < now) return false;
  return true;
}

export function calculateCouponDiscount(coupon: Coupon, subtotal: number) {
  const baseDiscount = coupon.type === "PERCENTAGE" ? subtotal * (coupon.value / 100) : coupon.value;
  const cappedDiscount = typeof coupon.maxDiscount === "number" ? Math.min(baseDiscount, coupon.maxDiscount) : baseDiscount;
  return Math.max(0, Math.min(cappedDiscount, subtotal));
}

export function validateCouponEntity(
  coupon: Coupon | null,
  subtotal: number,
  context: CouponValidationContext = {},
  now = new Date(),
): CouponValidationResult {
  if (!coupon) {
    return { isValid: false, error: "Cupom não encontrado." };
  }

  if (!coupon.isActive) {
    return { isValid: false, error: "Este cupom está desativado." };
  }

  if (!isCouponWithinSchedule(coupon, now)) {
    return { isValid: false, error: "Este cupom não está disponível neste momento." };
  }

  if (typeof coupon.usageLimit === "number" && coupon.usageCount >= coupon.usageLimit) {
    return { isValid: false, error: "Este cupom já atingiu o limite de uso." };
  }

  if (typeof coupon.minSubtotal === "number" && subtotal < coupon.minSubtotal) {
    return {
      isValid: false,
      error: `Este cupom exige subtotal mínimo de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(coupon.minSubtotal)}.`,
    };
  }

  const scopedBrands = parseCouponScopeSlugs(coupon.appliesToBrandSlugs);
  if (scopedBrands.length > 0) {
    const selectedBrands = new Set((context.brandSlugs ?? []).map((slug) => slug.trim().toLowerCase()).filter(Boolean));

    if (!scopedBrands.some((slug) => selectedBrands.has(slug))) {
      return { isValid: false, error: "Este cupom vale apenas para marcas específicas deste catálogo." };
    }
  }

  const scopedCategories = parseCouponScopeSlugs(coupon.appliesToCategorySlugs);
  if (scopedCategories.length > 0) {
    const selectedCategories = new Set((context.categorySlugs ?? []).map((slug) => slug.trim().toLowerCase()).filter(Boolean));

    if (!scopedCategories.some((slug) => selectedCategories.has(slug))) {
      return { isValid: false, error: "Este cupom vale apenas para categorias específicas deste catálogo." };
    }
  }

  if (coupon.firstOrderOnly && (context.customerOrderCount ?? 0) > 0) {
    return { isValid: false, error: "Este cupom é exclusivo para a primeira compra." };
  }

  const discount = calculateCouponDiscount(coupon, subtotal);

  if (discount <= 0) {
    return { isValid: false, error: "Este cupom não gera desconto para o pedido atual." };
  }

  return {
    isValid: true,
    coupon: {
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      discount,
      description: coupon.description,
      allowWithPixDiscount: coupon.allowWithPixDiscount,
    },
  };
}

export async function validateCouponCode(code: string, subtotal: number, context: CouponValidationContext = {}): Promise<CouponValidationResult> {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    return { isValid: false, error: "Informe um cupom para validar." };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  return validateCouponEntity(coupon, subtotal, context);
}