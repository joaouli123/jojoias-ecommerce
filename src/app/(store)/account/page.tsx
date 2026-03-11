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

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [ordersCount, addressesCount, latestOrders] = await Promise.all([
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.address.count({ where: { userId: session.user.id } }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        refundStatus: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Minha conta</h1>
        <p className="mt-2 text-sm text-zinc-500">Acompanhe pedidos, endereços cadastrados e o resumo do seu acesso.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Pedidos realizados</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{ordersCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Endereços salvos</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{addressesCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Perfil</p>
            <p className="mt-2 text-lg font-bold text-zinc-950">{session.user.role ?? "CUSTOMER"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Últimos pedidos</h2>
            <p className="text-sm text-zinc-500 mt-1">Resumo rápido das suas compras mais recentes.</p>
          </div>
          <Link href="/account/orders" className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-900 hover:bg-zinc-50">
            Ver todos
          </Link>
        </div>

        {latestOrders.length ? (
          <div className="mt-6 space-y-3">
            {latestOrders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 hover:bg-zinc-100/80 transition-colors">
                <div>
                  <p className="text-sm text-zinc-500">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="font-bold text-zinc-950 mt-1">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-semibold text-zinc-900">{formatCurrency(order.total)}</p>
                  <p className="text-zinc-500 mt-1">{order.status}</p>
                  {getRefundStatusLabel(order.refundStatus) ? (
                    <p className="mt-1 text-amber-700">{getRefundStatusLabel(order.refundStatus)}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
            Você ainda não realizou pedidos. Assim que concluir uma compra, ela aparecerá aqui.
          </div>
        )}
      </section>
    </div>
  );
}

