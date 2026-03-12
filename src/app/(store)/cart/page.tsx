import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getCartAction, removeFromCartAction, updateCartItemAction } from "@/actions/cart";
import { CartViewTracker } from "@/components/analytics/ecommerce-trackers";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CartSummary } from "@/components/cart/cart-summary";

export default async function CartPage() {
  const cart = await getCartAction();
  const { items, subtotal } = cart;

  return (
    <div className="flex w-full max-w-[1440px] flex-col gap-8 mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 md:py-12">
      <CartViewTracker
        items={items.map((item) => ({
          item_id: item.variantId ? `${item.productId}:${item.variantId}` : item.productId,
          item_name: item.name,
          item_variant: item.variantName ?? undefined,
          price: item.unitPrice,
          quantity: item.quantity,
        }))}
        value={subtotal}
      />
      <div className="flex flex-col gap-2 md:gap-3">
        <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Carrinho" }]} />
        <h1 className="text-3xl sm:text-4xl font-medium font-serif text-[#1A1A1A] tracking-tight">Carrinho de Compras</h1>
        <p className="text-[#666666]">Revise seus itens e avance para um checkout rápido e seguro.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 rounded-[20px] border border-zinc-200/80 bg-white/80 px-5 py-4 text-sm font-semibold text-[#8A7F72] shadow-[0_20px_40px_-36px_rgba(26,26,26,0.55)]">
            <div className="col-span-6">Produto</div>
            <div className="col-span-3 text-center">Quantidade</div>
            <div className="col-span-3 text-right">Subtotal</div>
          </div>

          <div className="flex flex-col mb-4">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-zinc-200 bg-white p-8 text-center text-[#666666] shadow-[0_24px_44px_-38px_rgba(26,26,26,0.6)]">
                Seu carrinho está vazio no momento.
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.variantId ?? "base"}`} className="group mb-4 grid grid-cols-1 items-center gap-4 rounded-[24px] border border-zinc-200/80 bg-white p-5 shadow-[0_22px_40px_-36px_rgba(26,26,26,0.55)] last:mb-0 sm:grid-cols-12">
                  <div className="col-span-1 border-b border-zinc-100 pb-4 sm:col-span-6 sm:border-0 sm:pb-0 flex gap-4">
                    <div className="h-24 w-24 rounded-[18px] bg-[#FFFFFF] border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image || "https://images.unsplash.com/photo-1611095567219-79caa80c5980?q=80&w=400"})` }}
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <Link href={`/produto/${item.slug}`} className="font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors line-clamp-2 leading-tight">
                        {item.name}
                      </Link>
                      {item.variantName ? (
                        <span className="mt-1 text-sm text-[#666666]">Variação: {item.variantName}</span>
                      ) : null}
                      {item.sku ? (
                        <span className="mt-1 text-xs uppercase tracking-wide text-[#E5E5E5]">SKU: {item.sku}</span>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
                        <div className="flex items-center rounded-[20px] border border-zinc-200 bg-[#fcfbf8]">
                          <form
                            action={async () => {
                              "use server";
                              await updateCartItemAction(item.productId, item.quantity - 1, item.variantId || undefined);
                            }}
                          >
                            <button type="submit" className="p-2 text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF] rounded-l-[20px] transition-colors">
                              <Minus className="h-4 w-4" />
                            </button>
                          </form>
                          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                          <form
                            action={async () => {
                              "use server";
                              await updateCartItemAction(item.productId, item.quantity + 1, item.variantId || undefined);
                            }}
                          >
                            <button type="submit" className="p-2 text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF] rounded-r-[20px] transition-colors">
                              <Plus className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                        <div className="text-right">
                          <span className="block text-lg font-medium font-serif text-[#1A1A1A]">{formatCurrency(item.lineTotal)}</span>
                          <span className="block text-xs text-[#666666]">{formatCurrency(item.unitPrice)} cada</span>
                        </div>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await removeFromCartAction(item.productId, item.variantId || undefined);
                        }}
                        className="mt-3 sm:mt-auto self-start"
                      >
                        <button type="submit" className="text-sm text-red-500 hover:text-red-700 hover:underline flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="col-span-1 hidden justify-between items-center sm:col-span-3 sm:flex sm:justify-center">
                    <div className="flex items-center rounded-[18px] border border-zinc-200 bg-[#fcfbf8]">
                      <form
                        action={async () => {
                          "use server";
                          await updateCartItemAction(item.productId, item.quantity - 1, item.variantId || undefined);
                        }}
                      >
                        <button type="submit" className="p-2 text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF] rounded-l-lg transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                      </form>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <form
                        action={async () => {
                          "use server";
                          await updateCartItemAction(item.productId, item.quantity + 1, item.variantId || undefined);
                        }}
                      >
                        <button type="submit" className="p-2 text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF] rounded-r-lg transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="col-span-1 hidden justify-between items-center sm:col-span-3 sm:flex sm:justify-end">
                    <span className="font-medium font-serif text-[#1A1A1A] text-lg">{formatCurrency(item.lineTotal)}</span>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-24">
          <CartSummary subtotal={subtotal} itemsCount={items.reduce((total, item) => total + item.quantity, 0)} />
        </div>
      </div>
    </div>
  );
}
