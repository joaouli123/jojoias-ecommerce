import type { Metadata } from "next";
import Link from "next/link";
import { Search, Truck, ExternalLink } from "lucide-react";
import { findTrackableOrder } from "@/lib/public-order-tracking";
import { formatCurrency } from "@/lib/utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jojoias.com.br";

export const metadata: Metadata = {
  title: "Rastreio",
  description: "Acompanhe o status do seu pedido JoJoias com numero do pedido ou codigo de rastreio e e-mail da compra.",
  alternates: {
    canonical: "/rastreio",
  },
  openGraph: {
    title: "Rastreio | JoJoias",
    description: "Acompanhe o status do seu pedido JoJoias com numero do pedido ou codigo de rastreio e e-mail da compra.",
    url: `${siteUrl}/rastreio`,
    type: "website",
    locale: "pt_BR",
  },
};

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string; email?: string }>;
}) {
  const { pedido = "", email = "" } = await searchParams;
  const order = pedido && email ? await findTrackableOrder(pedido, email) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#D4AF37]">Rastreio público</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Acompanhe seu pedido</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">Informe o número completo do pedido ou o código de rastreio junto com o e-mail usado na compra.</p>

        <form className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1fr_auto]" method="get">
          <input name="pedido" defaultValue={pedido} placeholder="Pedido ou código de rastreio" className="h-12 rounded-[20px] border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
          <input name="email" type="email" defaultValue={email} placeholder="E-mail da compra" className="h-12 rounded-[20px] border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800">
            <Search className="h-4 w-4" />
            Consultar
          </button>
        </form>
      </div>

      {pedido && email && !order ? (
        <div className="mt-6 rounded-[20px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Não encontramos um pedido com esses dados. Confira o e-mail informado e tente novamente.</div>
      ) : null}

      {order ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Pedido</p>
                <h2 className="text-2xl font-black tracking-tight text-zinc-950">#{order.id.slice(-8).toUpperCase()}</h2>
              </div>
              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">{order.status}</span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Pagamento</p>
                <p className="mt-2 font-semibold text-zinc-900">{order.paymentStatus || "Pendente"}</p>
              </div>
              <div className="rounded-[20px] border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Frete</p>
                <p className="mt-2 font-semibold text-zinc-900">{order.shippingService || "A definir"}</p>
              </div>
              <div className="rounded-[20px] border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Código</p>
                <p className="mt-2 font-semibold text-zinc-900">{order.trackingCode || "Ainda não gerado"}</p>
              </div>
              <div className="rounded-[20px] border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Total</p>
                <p className="mt-2 font-semibold text-zinc-900">{formatCurrency(order.total)}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-zinc-900">Itens</p>
              <div className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-[20px] border border-zinc-100 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-zinc-900">{item.product.name}</p>
                      {item.variant ? <p className="text-zinc-500">Variação: {item.variant.name}</p> : null}
                    </div>
                    <span className="text-zinc-600">{item.quantity}x</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-[20px] bg-[#D4AF37]/15 p-3 text-[#B18D14]"><Truck className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Entrega</p>
                  <p className="text-sm text-zinc-500">Prazo estimado: {order.shippingEstimatedDays ? `${order.shippingEstimatedDays} dia(s) úteis` : "a confirmar"}</p>
                </div>
              </div>
              {order.trackingUrl ? (
                <Link href={order.trackingUrl} target="_blank" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-[#D4AF37]">
                  Abrir rastreio da transportadora <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
            </section>

            <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm text-sm text-zinc-600">
              <p className="font-semibold text-zinc-900">Endereço</p>
              <p className="mt-3">{order.addressStreet}, {order.addressNumber}{order.addressComplement ? ` • ${order.addressComplement}` : ""}</p>
              <p>{order.addressDistrict}</p>
              <p>{order.addressCity}/{order.addressState} • CEP {order.addressZipcode}</p>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
