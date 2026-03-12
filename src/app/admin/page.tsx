// src/app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { formatAdminDateParts, formatOrderCode, getOrderStatusLabel, getOrderStatusTone, normalizeDisplayText } from "@/lib/admin-display";

export default async function AdminDashboardPage() {
  await requireAdminPagePermission("dashboard:view");

  const now = new Date();
  const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalProducts,
    totalOrders,
    totalUsers,
    lowStockProducts,
    activeCoupons,
    recentOrders,
    monthlyRevenue,
    previousRevenue,
    averageTicket,
    statusCounts,
    topSellingProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.product.count({ where: { status: "ACTIVE", quantity: { lte: 5 } } }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: startCurrentMonth } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: startPreviousMonth, lt: startCurrentMonth } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _avg: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const revenueThisMonth = monthlyRevenue._sum.total ?? 0;
  const revenueLastMonth = previousRevenue._sum.total ?? 0;
  const averageOrderValue = averageTicket._avg.total ?? 0;
  const revenueVariation = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 100;

  const topProductsData = topSellingProducts.length
    ? await prisma.product.findMany({
        where: { id: { in: topSellingProducts.map((item) => item.productId) } },
        select: { id: true, name: true, quantity: true, status: true },
      })
    : [];

  const topProductsMap = new Map(topProductsData.map((product) => [product.id, product]));
  const statusMap = new Map(statusCounts.map((item) => [item.status, item._count.status]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-medium font-serif text-gray-900 tracking-tight">Dashboard geral</h1>
          <p className="mt-2 text-sm text-gray-600">Visão rápida da operação, vendas e pontos de atenção do ecommerce.</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Faturamento do mês: <strong>{formatCurrency(revenueThisMonth)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Produtos</h3>
          <p className="text-3xl font-medium font-serif text-gray-900">{totalProducts}</p>
          <p className="mt-2 text-sm text-gray-500">{lowStockProducts} com estoque baixo</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Pedidos</h3>
          <p className="text-3xl font-medium font-serif text-gray-900">{totalOrders}</p>
          <p className="mt-2 text-sm text-gray-500">{statusMap.get("PENDING") ?? 0} pendentes</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Clientes</h3>
          <p className="text-3xl font-medium font-serif text-gray-900">{totalUsers}</p>
          <p className="mt-2 text-sm text-gray-500">Base ativa em crescimento</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Ticket médio</h3>
          <p className="text-3xl font-medium font-serif text-gray-900">{formatCurrency(averageOrderValue)}</p>
          <p className={`mt-2 text-sm ${revenueVariation >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {revenueVariation >= 0 ? "+" : ""}{revenueVariation.toFixed(1)}% vs. mês anterior
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800">Indicadores da operação</h2>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Cupons ativos</p>
              <p className="mt-2 text-2xl font-medium font-serif text-gray-900">{activeCoupons}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Pedidos processando</p>
              <p className="mt-2 text-2xl font-medium font-serif text-gray-900">{statusMap.get("PROCESSING") ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Pedidos enviados</p>
              <p className="mt-2 text-2xl font-medium font-serif text-gray-900">{statusMap.get("SHIPPED") ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Pedidos entregues</p>
              <p className="mt-2 text-2xl font-medium font-serif text-gray-900">{statusMap.get("DELIVERED") ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800">Produtos mais vendidos</h2>
          </div>
          <div className="p-6">
            {topSellingProducts.length === 0 ? (
              <p className="text-sm text-gray-500">As vendas ainda aparecerão aqui quando houver pedidos confirmados.</p>
            ) : (
              <div className="space-y-4">
                {topSellingProducts.map((item, index) => {
                  const product = topProductsMap.get(item.productId);

                  return (
                    <div key={item.productId} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">#{index + 1}</p>
                        <p className="mt-1 font-semibold text-gray-900">{product?.name ?? "Produto removido"}</p>
                        <p className="mt-1 text-sm text-gray-500">Estoque atual: {product?.quantity ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-medium font-serif text-gray-900">{item._sum.quantity ?? 0}</p>
                        <p className="text-xs uppercase tracking-wide text-gray-400">unidades</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Últimos Pedidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium">
                <th className="p-4 border-b">ID</th>
                <th className="p-4 border-b">Cliente</th>
                <th className="p-4 border-b">Data</th>
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const { date, time } = formatAdminDateParts(order.createdAt);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-mono text-sm font-semibold text-gray-900">#{formatOrderCode(order.id)}</p>
                        <p className="text-xs text-gray-400">{order.id.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{normalizeDisplayText(order.user?.name || order.guestName || "Visitante")}</p>
                        <p className="text-xs text-gray-500">{order.user?.email || order.guestEmail || "Sem email"}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{date}</p>
                        <p className="text-xs text-gray-500">{time}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getOrderStatusTone(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(order.total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
