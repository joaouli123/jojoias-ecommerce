import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function AdminOrdersPage() {
  await requireAdminPagePermission("orders:view");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pedidos</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie a operação diária e exporte relatórios rápidos para financeiro e expedição.</p>
        </div>
        <Link
          href="/admin/orders/export"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left align-middle border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">ID Pedido</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Frete</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500 py-10">
                  Nenhum pedido realizado ainda.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono text-xs text-gray-500">{order.id}</td>
                  <td className="p-4 font-medium text-gray-900">
                    {order.user?.name || order.guestName || "Visitante"}
                    {order.user?.email && <p className="text-xs text-gray-500 font-normal">{order.user.email}</p>}
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "SHIPPED"
                          ? "bg-purple-100 text-purple-800"
                          : order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{order.paymentStatus || "Pendente"}</p>
                  </td>
                  <td className="p-4 text-gray-600">{order.shippingService || "—"}</td>
                  <td className="p-4 font-medium text-gray-900">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.total)}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
