import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Mail, User, Clock3, AlertCircle, MapPin, Truck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { token, payment } = await searchParams;
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: true,
    },
  });

  if (!order) {
    notFound();
  }

  const isOwner = Boolean(session?.user?.id && order.userId === session.user.id);
  const hasValidGuestToken = Boolean(order.isGuest && order.checkoutToken && token === order.checkoutToken);

  if (!isOwner && !hasValidGuestToken) {
    notFound();
  }

  const normalizedPaymentStatus = (order.paymentStatus || payment || "pending").toLowerCase();
  const paymentRefunded = ["refunded", "partially_refunded"].includes(normalizedPaymentStatus);
  const paymentApproved = normalizedPaymentStatus === "approved";
  const paymentFailed = ["rejected", "cancelled", "failure", "charged_back"].includes(normalizedPaymentStatus);
  const paymentPending = ["pending", "in_process", "in_mediation"].includes(normalizedPaymentStatus);

  const HeaderIcon = paymentApproved ? CheckCircle2 : paymentRefunded || paymentFailed ? AlertCircle : Clock3;
  const headerColor = paymentApproved ? "text-emerald-600" : paymentRefunded || paymentFailed ? "text-rose-600" : "text-amber-500";
  const heading = paymentApproved ? "Pagamento confirmado!" : paymentRefunded ? "Pagamento reembolsado" : paymentFailed ? "Seu pedido foi criado, mas o pagamento falhou" : "Pedido recebido e aguardando pagamento";
  const description = paymentApproved
    ? "Seu pagamento foi aprovado. Em breve você receberá as próximas atualizações por e-mail."
    : paymentRefunded
    ? "Registramos um reembolso neste pedido. Se precisar de apoio adicional, nossa equipe de atendimento pode orientar os próximos passos."
    : paymentFailed
    ? "O pedido foi registrado, mas o pagamento ainda não foi concluído. Você pode tentar novamente pelo gateway ou falar com o atendimento."
    : paymentPending
      ? "Seu pedido foi registrado. Assim que o pagamento for confirmado, o status será atualizado automaticamente."
      : "Seu pedido foi recebido e está sendo validado pelo gateway de pagamento.";

  return (
    <div className="w-full max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <section className="rounded-[20px] border border-zinc-200 bg-white p-6 md:p-8 mb-8">
        <div className="flex items-start gap-4">
          <HeaderIcon className={`h-10 w-10 shrink-0 ${headerColor}`} />
          <div>
            <h1 className="text-3xl font-black text-zinc-950 tracking-tight">{heading}</h1>
            <p className="text-zinc-600 mt-2">{description}</p>
            <p className="text-sm text-zinc-500 mt-2">Número do pedido: <span className="font-bold text-zinc-900">#{order.id.slice(-8).toUpperCase()}</span></p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 rounded-[20px] border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-5 flex items-center gap-2"><Package className="h-5 w-5" /> Itens comprados</h2>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-zinc-900">{item.product.name}</p>
                  {item.variant ? <p className="text-sm text-zinc-500">Variação: {item.variant.name}</p> : null}
                  <p className="text-sm text-zinc-500">Qtd: {item.quantity}</p>
                </div>
                <span className="font-bold text-zinc-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <section className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Resumo financeiro</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd className="font-semibold text-zinc-900">{formatCurrency(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Frete</dt><dd className="font-semibold text-emerald-600">{formatCurrency(order.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Desconto</dt><dd className="font-semibold text-zinc-900">- {formatCurrency(order.discount)}</dd></div>
              <div className="flex justify-between border-t border-zinc-200 pt-3"><dt className="font-bold text-zinc-900">Total</dt><dd className="text-xl font-black text-zinc-950">{formatCurrency(order.total)}</dd></div>
            </dl>
          </section>

          <section className="rounded-[20px] border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Dados do pedido</h2>
            <div className="space-y-3 text-sm text-zinc-700">
              <p className="flex items-center gap-2"><User className="h-4 w-4" /> {order.user?.name || order.guestName || "Cliente"}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {order.user?.email || order.guestEmail || "Não informado"}</p>
              <p>Pagamento: <span className="font-semibold">{order.paymentMethod || "Não informado"}</span></p>
              <p>Status do pagamento: <span className="font-semibold">{order.paymentStatus || "Pendente"}</span></p>
              <p>Status: <span className="font-semibold">{order.status}</span></p>
              <p>Frete: <span className="font-semibold">{order.shippingService || "A definir"}</span></p>
              {order.paymentExpiresAt ? <p>Validade pagamento: <span className="font-semibold">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.paymentExpiresAt)}</span></p> : null}
              <p>Cupom: <span className="font-semibold">{order.couponCode || "Sem cupom"}</span></p>
            </div>
          </section>

          <section className="rounded-[20px] border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Entrega</h2>
            <div className="space-y-3 text-sm text-zinc-700">
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4" /> <span>{order.addressStreet}, {order.addressNumber}{order.addressComplement ? ` • ${order.addressComplement}` : ""}<br />{order.addressDistrict} • {order.addressCity}/{order.addressState}<br />CEP {order.addressZipcode}</span></p>
              <p className="flex items-center gap-2"><Truck className="h-4 w-4" /> {order.shippingService || "Frete calculado no checkout"} • até {order.shippingEstimatedDays || 0} dia(s) úteis</p>
              {order.trackingCode ? <p>Código de rastreio: <span className="font-semibold">{order.trackingCode}</span></p> : null}
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex items-center justify-center h-12 px-6 rounded-[20px] bg-[#111111] text-white font-bold hover:bg-[#111111]/90 transition-colors">
          Continuar comprando <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
        {session ? (
          <Link href="/account" className="inline-flex items-center justify-center h-12 px-6 rounded-[20px] border border-zinc-200 bg-white text-zinc-900 font-bold hover:bg-zinc-50 transition-colors">
            Ver minha conta
          </Link>
        ) : null}
        <Link href={`/rastreio?pedido=${encodeURIComponent(order.trackingCode || order.id)}&email=${encodeURIComponent(order.user?.email || order.guestEmail || "")}`} className="inline-flex items-center justify-center h-12 px-6 rounded-[20px] border border-zinc-200 bg-white text-zinc-900 font-bold hover:bg-zinc-50 transition-colors">
          Acompanhar rastreio
        </Link>
      </div>
    </div>
  );
}
