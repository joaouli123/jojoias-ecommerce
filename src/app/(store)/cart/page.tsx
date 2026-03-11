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
    <div className="flex flex-col w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 gap-8 pb-16">
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
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">Carrinho de Compras</h1>
        <p className="text-zinc-500">Revise seus itens e avance para um checkout rápido e seguro.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 text-sm font-semibold text-zinc-400 border-b border-zinc-200 pb-4 px-2">
            <div className="col-span-6">Produto</div>
            <div className="col-span-3 text-center">Quantidade</div>
            <div className="col-span-3 text-right">Subtotal</div>
          </div>

          <div className="flex flex-col mb-4">
            {items.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
                Seu carrinho está vazio no momento.
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.variantId ?? "base"}`} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-6 border-b border-zinc-100 last:border-0 group">
                  <div className="col-span-1 border-b border-zinc-100 pb-4 sm:border-0 sm:pb-0 sm:col-span-6 flex gap-4">
                    <div className="h-24 w-24 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image || "https://images.unsplash.com/photo-1611095567219-79caa80c5980?q=80&w=400"})` }}
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <Link href={`/produto/${item.slug}`} className="font-semibold text-zinc-900 group-hover:text-[#D4AF37] transition-colors line-clamp-2 leading-tight">
                        {item.name}
                      </Link>
                      {item.variantName ? (
                        <span className="mt-1 text-sm text-zinc-500">Variação: {item.variantName}</span>
                      ) : null}
                      {item.sku ? (
                        <span className="mt-1 text-xs uppercase tracking-wide text-zinc-400">SKU: {item.sku}</span>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
                        <div className="flex items-center rounded-[20px] border border-zinc-200 bg-white">
                          <form
                            action={async () => {
                              "use server";
                              await updateCartItemAction(item.productId, item.quantity - 1, item.variantId || undefined);
                            }}
                          >
                            <button type="submit" className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-l-[20px] transition-colors">
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
                            <button type="submit" className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-r-[20px] transition-colors">
                              <Plus className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                        <div className="text-right">
                          <span className="block text-lg font-black text-zinc-950">{formatCurrency(item.lineTotal)}</span>
                          <span className="block text-xs text-zinc-500">{formatCurrency(item.unitPrice)} cada</span>
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
                    <div className="flex items-center rounded-lg border border-zinc-200 bg-white">
                      <form
                        action={async () => {
                          "use server";
                          await updateCartItemAction(item.productId, item.quantity - 1, item.variantId || undefined);
                        }}
                      >
                        <button type="submit" className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-l-lg transition-colors">
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
                        <button type="submit" className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-r-lg transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="col-span-1 hidden justify-between items-center sm:col-span-3 sm:flex sm:justify-end">
                    <span className="font-black text-zinc-950 text-lg">{formatCurrency(item.lineTotal)}</span>
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
