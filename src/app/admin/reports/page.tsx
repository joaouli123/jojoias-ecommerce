import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { formatSystemEventPayload } from "@/lib/system-events";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { getOperationalHealthSnapshot } from "@/lib/health";

function percentage(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

export default async function AdminReportsPage() {
  await requireAdminPagePermission("reports:view");

  const now = new Date();
  const start30Days = new Date(now);
  start30Days.setDate(now.getDate() - 30);
  const start7Days = new Date(now);
  start7Days.setDate(now.getDate() - 7);

  const [
    ordersLast30Days,
    revenueLast30Days,
    ordersByStatus,
    paymentMethods,
    categoryPerformance,
    customerRevenue,
    openIncidents,
    recentIncidents,
    healthSnapshot,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start30Days } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: start30Days }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _avg: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
      orderBy: { _count: { status: "desc" } },
    }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { paymentMethod: { not: null } },
      _count: { paymentMethod: true },
      _sum: { total: true },
      orderBy: { _count: { paymentMethod: "desc" } },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 20,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { not: null }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { userId: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.systemEventLog.count({
      where: {
        status: "OPEN",
        level: { in: ["ERROR", "WARNING"] },
        createdAt: { gte: start7Days },
      },
    }),
    prisma.systemEventLog.findMany({
      where: {
        createdAt: { gte: start7Days },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getOperationalHealthSnapshot(),
  ]);

  const productIds = categoryPerformance.map((item) => item.productId);
  const customerIds = customerRevenue.flatMap((item) => (item.userId ? [item.userId] : []));

  const [products, customers] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, category: { select: { name: true } } },
        })
      : Promise.resolve([]),
    customerIds.length
      ? prisma.user.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((product) => [product.id, product]));
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

  const categoryTotals = new Map<string, { quantity: number; revenue: number }>();
  for (const item of categoryPerformance) {
    const product = productMap.get(item.productId);
    const categoryName = product?.category.name ?? "Sem categoria";
    const current = categoryTotals.get(categoryName) ?? { quantity: 0, revenue: 0 };
    categoryTotals.set(categoryName, {
      quantity: current.quantity + (item._sum.quantity ?? 0),
      revenue: current.revenue + ((item._sum.quantity ?? 0) * (item._sum.price ?? 0)),
    });
  }

  const sortedCategories = [...categoryTotals.entries()]
    .map(([category, values]) => ({ category, ...values }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  const totalStatusOrders = ordersByStatus.reduce((sum, item) => sum + item._count.status, 0);
  const totalPaymentOrders = paymentMethods.reduce((sum, item) => sum + item._count.paymentMethod, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios</h1>
        <p className="mt-2 text-sm text-gray-600">Resumo executivo da operação nos últimos 30 dias e visão de clientes, pagamentos e categorias.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pedidos em 30 dias</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{ordersLast30Days}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Faturamento em 30 dias</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{formatCurrency(revenueLast30Days._sum.total ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Ticket médio</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{formatCurrency(revenueLast30Days._avg.total ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm md:col-span-3 xl:col-span-1">
          <p className="text-sm text-amber-700">Incidentes abertos em 7 dias</p>
          <p className="mt-2 text-3xl font-black text-amber-950">{openIncidents}</p>
        </div>
        <a href="/admin/health" className={`rounded-2xl border p-5 shadow-sm md:col-span-3 xl:col-span-1 ${healthSnapshot.status === "healthy" ? "border-emerald-200 bg-emerald-50" : healthSnapshot.status === "degraded" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
          <p className={`text-sm ${healthSnapshot.status === "healthy" ? "text-emerald-700" : healthSnapshot.status === "degraded" ? "text-amber-700" : "text-rose-700"}`}>
            Saúde operacional
          </p>
          <p className="mt-2 text-3xl font-black text-gray-950 capitalize">{healthSnapshot.status}</p>
          <p className="mt-2 text-xs text-gray-600">{healthSnapshot.checks.filter((item) => item.status !== "healthy").length} check(s) exigindo atenção</p>
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Status dos pedidos</h2>
          <div className="mt-5 space-y-4">
            {ordersByStatus.map((item) => (
              <div key={item.status}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.status}</span>
                  <span className="text-gray-500">{item._count.status} pedidos</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-gray-900"
                    style={{ width: `${percentage(item._count.status, totalStatusOrders)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Métodos de pagamento</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="p-4 font-medium">Método</th>
                  <th className="p-4 font-medium">Pedidos</th>
                  <th className="p-4 font-medium">Participação</th>
                  <th className="p-4 font-medium">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">Sem dados de pagamentos até o momento.</td>
                  </tr>
                ) : (
                  paymentMethods.map((method) => (
                    <tr key={method.paymentMethod ?? "unknown"}>
                      <td className="p-4 font-semibold text-gray-900">{method.paymentMethod ?? "Não informado"}</td>
                      <td className="p-4 text-gray-600">{method._count.paymentMethod}</td>
                      <td className="p-4 text-gray-600">{percentage(method._count.paymentMethod, totalPaymentOrders).toFixed(1)}%</td>
                      <td className="p-4 font-semibold text-gray-900">{formatCurrency(method._sum.total ?? 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Categorias com melhor giro</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Itens vendidos</th>
                  <th className="p-4 font-medium">Receita estimada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">As categorias aparecerão aqui após as primeiras vendas.</td>
                  </tr>
                ) : (
                  sortedCategories.map((category) => (
                    <tr key={category.category}>
                      <td className="p-4 font-semibold text-gray-900">{category.category}</td>
                      <td className="p-4 text-gray-600">{category.quantity}</td>
                      <td className="p-4 font-semibold text-gray-900">{formatCurrency(category.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Clientes com maior valor</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Pedidos</th>
                  <th className="p-4 font-medium">Lifetime value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customerRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Sem histórico suficiente para ranquear clientes.</td>
                  </tr>
                ) : (
                  customerRevenue.map((customer) => {
                    const profile = customer.userId ? customerMap.get(customer.userId) : null;
                    return (
                      <tr key={customer.userId ?? "guest"}>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">{profile?.name ?? "Cliente removido"}</p>
                          <p className="text-xs text-gray-500">{profile?.email ?? "Sem e-mail"}</p>
                        </td>
                        <td className="p-4 text-gray-600">{customer._count.userId}</td>
                        <td className="p-4 font-semibold text-gray-900">{formatCurrency(customer._sum.total ?? 0)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Incidentes recentes do sistema</h2>
            <p className="mt-1 text-sm text-gray-500">Erros e alertas capturados em checkout, frete, e-mail e webhooks nos últimos 7 dias.</p>
          </div>
          <a href="/admin/incidents" className="text-sm font-semibold text-gray-900 hover:text-gray-700">Ver incidentes</a>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="p-4 font-medium">Quando</th>
                <th className="p-4 font-medium">Nível</th>
                <th className="p-4 font-medium">Origem</th>
                <th className="p-4 font-medium">Evento</th>
                <th className="p-4 font-medium">Mensagem</th>
                <th className="p-4 font-medium">Contexto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum incidente registrado recentemente.</td>
                </tr>
              ) : (
                recentIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="p-4 text-gray-600">
                      {new Date(incident.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${incident.level === "ERROR" ? "bg-red-100 text-red-700" : incident.level === "WARNING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {incident.level}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{incident.source}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{incident.eventCode}</td>
                    <td className="p-4 text-gray-900">{incident.message}</td>
                    <td className="p-4 text-xs text-gray-500">{formatSystemEventPayload(incident.payload)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
