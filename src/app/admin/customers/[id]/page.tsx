import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Package, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPagePermission } from "@/lib/admin-auth";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPagePermission("customers:view");

  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: {
        orderBy: { createdAt: "desc" },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!customer || customer.role !== "CUSTOMER") {
    notFound();
  }

  const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para clientes
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Perfil do cliente</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">{customer.name}</h1>
              <p className="mt-2 text-sm text-gray-500">Cliente desde {new Date(customer.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">Lifetime value</p>
              <p className="mt-1 text-2xl font-black text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                <Mail className="h-4 w-4 text-amber-600" /> E-mail
              </p>
              <p className="mt-2 break-all">{customer.email}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                <Phone className="h-4 w-4 text-amber-600" /> Telefone
              </p>
              <p className="mt-2">{customer.phone || "Não informado"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pedidos</p>
              <p className="mt-2 text-3xl font-black text-gray-900">{customer.orders.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Endereços</p>
              <p className="mt-2 text-3xl font-black text-gray-900">{customer.addresses.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Ticket médio</p>
              <p className="mt-2 text-3xl font-black text-gray-900">
                {formatCurrency(customer.orders.length ? totalSpent / customer.orders.length : 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Endereços</h2>
          </div>

          <div className="mt-5 space-y-4">
            {customer.addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                Nenhum endereço salvo por este cliente.
              </div>
            ) : (
              customer.addresses.map((address) => (
                <div key={address.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="font-bold text-gray-900">{address.label || "Endereço principal"}</p>
                  <p className="mt-2">{address.recipient}</p>
                  <p>
                    {address.street}, {address.number}
                    {address.complement ? ` - ${address.complement}` : ""}
                  </p>
                  <p>{address.district}</p>
                  <p>
                    {address.city} - {address.state}
                  </p>
                  <p>CEP {address.zipcode}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Histórico de pedidos</h2>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="p-4 font-medium">Pedido</th>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Itens</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium text-right">Abrir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customer.orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    Esse cliente ainda não concluiu pedidos.
                  </td>
                </tr>
              ) : (
                customer.orders.map((order) => (
                  <tr key={order.id} className="align-top hover:bg-gray-50/70">
                    <td className="p-4 font-mono text-xs text-gray-500">{order.id}</td>
                    <td className="p-4 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="p-4 text-gray-600">
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item) => (
                          <p key={item.id}>
                            {item.quantity}x {item.product.name}
                          </p>
                        ))}
                        {order.items.length > 3 ? (
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            +{order.items.length - 3} itens
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-semibold text-amber-700 transition-colors hover:text-amber-900"
                      >
                        Ver pedido
                      </Link>
                    </td>
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