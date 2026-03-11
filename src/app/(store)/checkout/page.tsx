import Link from "next/link";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCartAction } from "@/actions/cart";
import { auth } from "@/auth";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getIntegrationSettings } from "@/lib/integrations";
import { CheckoutFormFields } from "@/components/checkout/checkout-form-fields";
import { CheckoutCouponField } from "@/components/checkout/checkout-coupon-field";
import { CheckoutMobileSummary } from "@/components/checkout/checkout-mobile-summary";
import { CheckoutTotalsSummary } from "@/components/checkout/checkout-totals-summary";
import { PaymentMethodsSection } from "@/components/checkout/payment-methods-section";
import { CheckoutTracker } from "@/components/analytics/ecommerce-trackers";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CheckoutProtectedForm } from "@/components/checkout/checkout-protected-form";

export default async function CheckoutPage() {
  const cart = await getCartAction();
  const session = await auth();
  const checkoutToken = crypto.randomUUID();
  const itemsCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  const [savedAddresses, mercadoPago, cartProducts, customerOrderCount] = await Promise.all([
    session?.user?.id
      ? prisma.address.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 4,
        })
      : Promise.resolve([]),
    getIntegrationSettings("mercado_pago"),
    prisma.product.findMany({
      where: {
        id: { in: cart.items.map((item) => item.productId) },
      },
      select: {
        brand: {
          select: { slug: true },
        },
        category: {
          select: { slug: true },
        },
      },
    }),
    session?.user?.id
      ? prisma.order.count({
          where: { userId: session.user.id },
        })
      : Promise.resolve(0),
  ]);

  const pixDiscountPercent = Number(mercadoPago?.extraConfig.pixDiscountPercent ?? 10) || 10;
  const couponBrandSlugs = Array.from(new Set(cartProducts.map((product) => product.brand?.slug).filter(Boolean))) as string[];
  const couponCategorySlugs = Array.from(new Set(cartProducts.map((product) => product.category.slug).filter(Boolean)));

  if (!cart.items.length) {
    redirect("/cart");
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <CheckoutTracker
        checkoutToken={checkoutToken}
        items={cart.items.map((item) => ({
          item_id: item.variantId ? `${item.productId}:${item.variantId}` : item.productId,
          item_name: item.name,
          item_variant: item.variantName ?? undefined,
          price: item.unitPrice,
          quantity: item.quantity,
        }))}
        value={cart.subtotal}
      />
      <div className="mb-8 md:mb-10">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Carrinho", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">Checkout Seguro</h1>
        <p className="text-zinc-500 mt-2">Finalize seu pedido em poucos passos com total segurança.</p>
        <Link href="/cart" className="mt-2 inline-block text-sm font-semibold text-zinc-700 hover:text-zinc-900">
          Voltar ao carrinho
        </Link>
      </div>
      <CheckoutProtectedForm checkoutToken={checkoutToken}>
        <div className="lg:col-span-8 space-y-6">
          <CheckoutMobileSummary items={cart.items} subtotal={cart.subtotal} pixDiscountPercent={pixDiscountPercent} />

          <CheckoutFormFields subtotal={cart.subtotal} itemsCount={itemsCount} savedAddresses={savedAddresses} />

          <div className="lg:hidden">
            <CheckoutCouponField
              subtotal={cart.subtotal}
              brandSlugs={couponBrandSlugs}
              categorySlugs={couponCategorySlugs}
              customerOrderCount={customerOrderCount}
              inputName="couponCodeMobile"
            />
          </div>

          <PaymentMethodsSection pixDiscountPercent={pixDiscountPercent} />

          <section className="rounded-[20px] border border-zinc-200 bg-white p-5 md:p-6">
            <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-zinc-800">
              Observações do pedido (opcional)
            </label>
            <div className="relative">
              <MessageSquareText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <textarea
                id="notes"
                name="notes"
                placeholder="Ex.: referência para entrega, horário preferencial ou recado para o pedido"
                rows={3}
                className="w-full rounded-[20px] border border-zinc-200 pl-10 pr-4 py-3 text-sm outline-none resize-y focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </section>

          <div className="lg:hidden">
            <Button type="submit" size="lg" className="w-full h-14 rounded-[20px] text-base font-bold bg-[#111111] hover:bg-[#111111]/90">
              Finalizar compra <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-xl font-bold text-zinc-950 mb-5">Resumo do Pedido</h2>

            <div className="space-y-3 max-h-[240px] overflow-auto pr-1">
              {cart.items.map((item) => (
                <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{item.name}</p>
                    {item.variantName ? <p className="text-zinc-500">Variação: {item.variantName}</p> : null}
                    <p className="text-zinc-500">Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-zinc-900 whitespace-nowrap">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <dl className="border-t border-zinc-200 mt-5 pt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="font-semibold text-zinc-900">{formatCurrency(cart.subtotal)}</dd>
              </div>
              <CheckoutTotalsSummary subtotal={cart.subtotal} pixDiscountPercent={pixDiscountPercent} />
            </dl>

            <div className="mt-5 border-t border-zinc-200 pt-5">
              <CheckoutCouponField
                subtotal={cart.subtotal}
                brandSlugs={couponBrandSlugs}
                categorySlugs={couponCategorySlugs}
                customerOrderCount={customerOrderCount}
                inputName="couponCodeDesktop"
                compact
              />
            </div>

            <div className="mt-6">
              <Button type="submit" size="lg" className="w-full h-14 rounded-[20px] text-base font-bold bg-[#111111] hover:bg-[#111111]/90">
                Finalizar compra <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </aside>
      </CheckoutProtectedForm>
    </div>
  );
}
