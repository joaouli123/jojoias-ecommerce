import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

function getRefundStatusLabel(status: string | null) {
  switch (status) {
    case "REQUESTED":
      return "Pós-venda solicitado";
    case "APPROVED":
      return "Pós-venda aprovado";
    case "REFUNDED":
      return "Reembolsado";
    case "DENIED":
      return "Solicitação negada";
    default:
      return null;
  }
}

export default async function AccountOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          variant: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950">Meus pedidos</h1>
      <p className="mt-2 text-sm text-zinc-500">Acompanhe status, total e itens das suas compras.</p>

      {orders.length ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="block rounded-[20px] border border-zinc-100 bg-zinc-50 p-5 hover:bg-zinc-100/70 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-500">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-950">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex rounded-full bg-white px-3 py-1 font-semibold text-zinc-800 border border-zinc-200">{order.status}</span>
                  {getRefundStatusLabel(order.refundStatus) ? (
                    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800 border border-amber-200">
                      {getRefundStatusLabel(order.refundStatus)}
                    </span>
                  ) : null}
                  <span className="inline-flex rounded-full bg-white px-3 py-1 font-semibold text-zinc-800 border border-zinc-200">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-zinc-600">
                {order.items.slice(0, 3).map((item) => `${item.quantity}x ${item.product.name}${item.variant ? ` (${item.variant.name})` : ""}`).join(" • ")}
                {order.items.length > 3 ? ` • +${order.items.length - 3} item(ns)` : ""}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[20px] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
          Nenhum pedido encontrado na sua conta.
        </div>
      )}
    </section>
  );
}