import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderPostSaleRequestForm } from "@/components/account/order-post-sale-request-form";

function getRefundStatusLabel(status: string | null) {
  switch (status) {
    case "REQUESTED":
      return "Solicitação recebida";
    case "APPROVED":
      return "Solicitação aprovada";
    case "REFUNDED":
      return "Reembolso concluído";
    case "DENIED":
      return "Solicitação negada";
    default:
      return "Sem solicitação";
  }
}

function canCustomerRequestPostSale(order: {
  status: string;
  paymentStatus: string | null;
  refundStatus: string | null;
}) {
  const normalizedPaymentStatus = (order.paymentStatus || "").toLowerCase();

  if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
    return false;
  }

  if (!["approved", "partially_refunded"].includes(normalizedPaymentStatus)) {
    return false;
  }

  return !["REQUESTED", "APPROVED", "REFUNDED"].includes(order.refundStatus || "");
}

export default async function AccountOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          variant: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const postSaleEligible = canCustomerRequestPostSale(order);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-[#666666]">Detalhe do pedido</p>
            <h1 className="text-2xl font-medium font-serif tracking-tight text-[#1A1A1A] mt-1">#{order.id.slice(-8).toUpperCase()}</h1>
          </div>
          <Link href="/account/orders" className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-medium font-serif text-[#1A1A1A] hover:bg-[#FFFFFF]">
            Voltar para pedidos
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Status</p>
            <p className="mt-2 text-lg font-medium font-serif text-[#1A1A1A]">{order.status}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Pagamento</p>
            <p className="mt-2 text-lg font-medium font-serif text-[#1A1A1A]">{order.paymentMethod || "Não informado"}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Total</p>
            <p className="mt-2 text-lg font-medium font-serif text-[#1A1A1A]">{formatCurrency(order.total)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-100 bg-[#FFFFFF] p-5">
          <h2 className="text-lg font-medium font-serif text-[#1A1A1A]">Acompanhamento do pedido</h2>
          <div className="mt-4">
            <OrderTimeline status={order.status} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-medium font-serif text-[#1A1A1A]">Itens do pedido</h2>

        <div className="mt-6 space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
              <div>
                <Link href={`/produto/${item.product.slug}`} className="font-medium font-serif text-[#1A1A1A] hover:text-[#D4AF37]">
                  {item.product.name}
                </Link>
                {item.variant ? <p className="mt-1 text-sm text-[#666666]">Variação: {item.variant.name}</p> : null}
                <p className="mt-1 text-sm text-[#666666]">Quantidade: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-[#1A1A1A]">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between text-[#666666]">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[#666666]">
            <span>Frete</span>
            <span>{formatCurrency(order.shipping)}</span>
          </div>
          <div className="flex items-center justify-between font-medium font-serif text-[#1A1A1A] text-base pt-2 border-t border-zinc-100">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-medium font-serif text-[#1A1A1A]">Endereço de entrega</h2>
          <div className="mt-4 space-y-1 text-sm text-[#666666]">
            <p>{order.addressStreet}, {order.addressNumber}</p>
            {order.addressComplement ? <p>{order.addressComplement}</p> : null}
            <p>{order.addressDistrict}</p>
            <p>{order.addressCity}/{order.addressState}</p>
            <p>CEP {order.addressZipcode}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-medium font-serif text-[#1A1A1A]">Frete e pagamento</h2>
          <div className="mt-4 space-y-2 text-sm text-[#666666]">
            <p>Serviço: <span className="font-semibold text-[#1A1A1A]">{order.shippingService || "A definir"}</span></p>
            <p>Prazo estimado: <span className="font-semibold text-[#1A1A1A]">{order.shippingEstimatedDays ? `${order.shippingEstimatedDays} dia(s) úteis` : "A definir"}</span></p>
            <p>Status do pagamento: <span className="font-semibold text-[#1A1A1A]">{order.paymentStatus || "Pendente"}</span></p>
            {order.trackingCode ? (
              <p>
                Rastreio: <span className="font-semibold text-[#1A1A1A]">{order.trackingCode}</span>
                {order.trackingUrl ? (
                  <Link href={order.trackingUrl} target="_blank" rel="noreferrer" className="ml-2 font-medium font-serif text-[#D4AF37] hover:opacity-80">
                    acompanhar
                  </Link>
                ) : null}
              </p>
            ) : (
              <p>Rastreio: <span className="font-semibold text-[#1A1A1A]">Será disponibilizado após a postagem.</span></p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-medium font-serif text-[#1A1A1A]">Trocas, devolução e reembolso</h2>
            <p className="mt-2 text-sm text-[#666666]">Acompanhe o status do pós-venda e abra uma solicitação quando o pedido já tiver sido enviado ou entregue.</p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            {getRefundStatusLabel(order.refundStatus)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Status</p>
            <p className="mt-2 font-medium font-serif text-[#1A1A1A]">{getRefundStatusLabel(order.refundStatus)}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Valor registrado</p>
            <p className="mt-2 font-medium font-serif text-[#1A1A1A]">{order.refundAmount != null ? formatCurrency(order.refundAmount) : "A definir"}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Solicitado em</p>
            <p className="mt-2 font-medium font-serif text-[#1A1A1A]">{order.refundRequestedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.refundRequestedAt) : "Ainda não solicitado"}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-[#FFFFFF] p-4">
            <p className="text-sm text-[#666666]">Reembolsado em</p>
            <p className="mt-2 font-medium font-serif text-[#1A1A1A]">{order.refundedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.refundedAt) : "Sem conclusão"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-100 bg-[#FFFFFF] p-5">
          <p className="text-sm font-semibold text-[#1A1A1A]">Motivo e histórico registrado</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#666666]">{order.returnReason || "Nenhuma observação de pós-venda foi registrada até o momento."}</p>
        </div>

        {postSaleEligible ? (
          <OrderPostSaleRequestForm orderId={order.id} maxAmount={order.total} />
        ) : order.refundStatus === "REQUESTED" || order.refundStatus === "APPROVED" || order.refundStatus === "REFUNDED" ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Sua solicitação já está registrada. Acompanhe as próximas atualizações nesta página.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#FFFFFF] p-4 text-sm text-[#666666]">
            A abertura da solicitação fica disponível quando o pedido já foi enviado ou entregue e o pagamento foi confirmado.
          </div>
        )}
      </section>
    </div>
  );
}