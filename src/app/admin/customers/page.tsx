import Link from "next/link";
import { Eye, Mail, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPagePermission } from "@/lib/admin-auth";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AdminCustomersPage() {
  await requireAdminPagePermission("customers:view");

  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: { role: "CUSTOMER" },
    include: {
      _count: {
        select: {
          orders: true,
          addresses: true,
        },
      },
      orders: {
        select: {
          total: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe histórico de compras, contatos e endereços cadastrados.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          <span className="font-semibold text-gray-900">{customers.length}</span> clientes cadastrados
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Clientes ativos</p>
          <p className="mt-2 text-3xl font-black text-gray-900">
            {customers.filter((customer) => customer._count.orders > 0).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Com endereço salvo</p>
          <p className="mt-2 text-3xl font-black text-gray-900">
            {customers.filter((customer) => customer._count.addresses > 0).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Receita acumulada</p>
          <p className="mt-2 text-3xl font-black text-gray-900">
            {formatCurrency(
              customers.reduce(
                (sum, customer) => sum + customer.orders.reduce((customerSum, order) => customerSum + order.total, 0),
                0,
              ),
            )}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Contato</th>
              <th className="p-4 font-medium">Pedidos</th>
              <th className="p-4 font-medium">Endereços</th>
              <th className="p-4 font-medium">Lifetime value</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const lifetimeValue = customer.orders.reduce((sum, order) => sum + order.total, 0);

                return (
                  <tr key={customer.id} className="hover:bg-gray-50/70">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">
                          Desde {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" /> {customer.email}
                        </p>
                        <p className="flex items-center gap-2 text-xs">
                          <Phone className="h-4 w-4 text-gray-400" /> {customer.phone || "Não informado"}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{customer._count.orders}</td>
                    <td className="p-4 text-gray-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        <MapPin className="h-3.5 w-3.5" /> {customer._count.addresses}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{formatCurrency(lifetimeValue)}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" /> Ver perfil
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}