import { NextResponse } from "next/server";
import { validateCouponCode } from "@/lib/coupons";
import { couponValidationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = couponValidationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos para validação do cupom." },
        { status: 400 },
      );
    }

    const result = await validateCouponCode(parsed.data.code, parsed.data.subtotal, {
      brandSlugs: parsed.data.brandSlugs,
      categorySlugs: parsed.data.categorySlugs,
      customerOrderCount: parsed.data.customerOrderCount,
    });

    if (!result.isValid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ coupon: result.coupon });
  } catch {
    return NextResponse.json({ error: "Não foi possível validar o cupom agora." }, { status: 500 });
  }
}