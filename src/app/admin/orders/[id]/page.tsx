import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, User, Clock, MessageSquareText, MapPin, Truck, CreditCard, RotateCcw } from "lucide-react";
import { executeOrderRefund, updateOrderNotes, updateOrderPostSale, updateOrderStatus, updateOrderTracking } from "@/actions/admin";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { formatAdminDateParts, formatOrderCode, getOrderStatusLabel, getOrderStatusTone, getPaymentStatusLabel, normalizeDisplayText } from "@/lib/admin-display";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = { user: await requireAdminPagePermission("orders:view") };

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const updateStatusAction = updateOrderStatus.bind(null, id);
  const updateNotesAction = updateOrderNotes.bind(null, id);
  const updateTrackingAction = updateOrderTracking.bind(null, id);
  const updatePostSaleAction = updateOrderPostSale.bind(null, id);
  const executeRefundAction = executeOrderRefund.bind(null, id);
  const normalizedPaymentStatus = (order.paymentStatus || "").toLowerCase();
  const createdAt = formatAdminDateParts(order.createdAt);
  const hasRefundWorkflowStarted = ["REQUESTED", "APPROVED", "REFUNDED"].includes(order.refundStatus || "");
  const canExecuteRefund = hasAdminPermission(session.user.role, "orders:manage")
    && Boolean(order.paymentId)
    && hasRefundWorkflowStarted
    && ["approved", "partially_refunded"].includes(normalizedPaymentStatus)
    && (order.refundAmount == null || order.refundAmount < order.total);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-md shadow-sm border border-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pedido #{formatOrderCode(id)}</h1>
          <p className="mt-1 text-sm text-gray-500">Criado em {createdAt.date} às {createdAt.time}</p>
          <p className="text-xs text-gray-400 font-mono mt-1">{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhes Principais */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Linha do pedido
              </h2>
            </div>
            <div className="p-4">
              <OrderTimeline status={order.status} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                Itens do Pedido ({order.items.length})
              </h2>
            </div>
            <div className="p-4">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium text-center">Qtd</th>
                    <th className="pb-3 font-medium text-right">Preço Unit.</th>
                    <th className="pb-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.variant?.sku || item.product.sku || "N/A"}</p>
                        {item.variant ? <p className="text-xs text-gray-500 mt-0.5">Variação: {normalizeDisplayText(item.variant.name)}</p> : null}
                      </td>
                      <td className="py-3 text-center text-gray-700">{item.quantity}x</td>
                      <td className="py-3 text-right text-gray-700">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frete</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Desconto</span>
                  <span>- {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.discount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg text-gray-900 pt-2 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  Endereço de entrega
                </h2>
              </div>
              <div className="p-4 text-sm text-gray-700 space-y-1">
                <p>{order.addressStreet}, {order.addressNumber}</p>
                {order.addressComplement ? <p>{order.addressComplement}</p> : null}
                <p>{order.addressDistrict}</p>
                <p>{order.addressCity}/{order.addressState}</p>
                <p>CEP {order.addressZipcode}</p>
                <p>{order.addressCountry || "Brasil"}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  Pagamento e frete
                </h2>
              </div>
              <div className="p-4 text-sm text-gray-700 space-y-2">
                <p><span className="text-gray-500">Método:</span> <span className="font-medium text-gray-900">{order.paymentMethod || "Não informado"}</span></p>
                <p><span className="text-gray-500">Status:</span> <span className="font-medium text-gray-900">{getPaymentStatusLabel(order.paymentStatus)}</span></p>
                <p><span className="text-gray-500">Payment ID:</span> <span className="font-medium text-gray-900 break-all">{order.paymentId || "—"}</span></p>
                <p><span className="text-gray-500">Serviço:</span> <span className="font-medium text-gray-900">{normalizeDisplayText(order.shippingService || "A definir") || "A definir"}</span></p>
                <p><span className="text-gray-500">Prazo:</span> <span className="font-medium text-gray-900">{order.shippingEstimatedDays ? `${order.shippingEstimatedDays} dia(s) úteis` : "A definir"}</span></p>
                <p><span className="text-gray-500">Região:</span> <span className="font-medium text-gray-900">{normalizeDisplayText(order.shippingRegion || "—") || "—"}</span></p>
                <p><span className="text-gray-500">Documento:</span> <span className="font-medium text-gray-900">{normalizeDisplayText(order.customerDocument || "Não informado") || "Não informado"}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-500" />
                Operação e envio
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm">
                <p className="text-gray-500 mb-1">Status Atual</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getOrderStatusTone(order.status)}`}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              {hasAdminPermission(session.user.role, "orders:manage") ? (
                <form action={updateStatusAction} className="space-y-3 pt-3 border-t border-gray-100">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Atualizar Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={order.status}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="PROCESSING">Processando</option>
                    <option value="SHIPPED">Enviado</option>
                    <option value="DELIVERED">Entregue</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Salvar
                  </button>
                </form>
              ) : (
                <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Seu perfil possui acesso somente para consulta deste pedido.
                </div>
              )}

              {hasAdminPermission(session.user.role, "orders:manage") ? (
                <form action={updateTrackingAction} className="space-y-3 pt-3 border-t border-gray-100">
                  <label htmlFor="trackingCode" className="block text-sm font-medium text-gray-700">
                    Código de rastreio
                  </label>
                  <input
                    id="trackingCode"
                    name="trackingCode"
                    defaultValue={order.trackingCode || ""}
                    placeholder="BR123456789BR"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    name="trackingUrl"
                    defaultValue={order.trackingUrl || ""}
                    placeholder="https://transportadora.com/rastreio/..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50"
                  >
                    Salvar rastreio
                  </button>
                </form>
              ) : order.trackingCode ? (
                <div className="pt-3 border-t border-gray-100 text-sm text-gray-600">
                  Código de rastreio: <span className="font-semibold text-gray-900">{normalizeDisplayText(order.trackingCode)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-gray-500" />
                Observações internas
              </h2>
            </div>
            <div className="p-4">
              {hasAdminPermission(session.user.role, "orders:manage") ? (
                <form action={updateNotesAction} className="space-y-3">
                  <textarea
                    name="notes"
                    rows={5}
                    defaultValue={order.notes || ""}
                    placeholder="Registre instruções, contatos realizados, particularidades da expedição ou do pagamento."
                    className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                  >
                    Salvar observações
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes || "Sem observações registradas."}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-gray-500" />
                Pós-venda e reembolso
              </h2>
            </div>
            <div className="p-4">
              {hasAdminPermission(session.user.role, "orders:manage") ? (
                <form action={updatePostSaleAction} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Status do reembolso/devolução
                    <select
                      name="refundStatus"
                      defaultValue={order.refundStatus || "NONE"}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                      <option value="NONE">Sem solicitação</option>
                      <option value="REQUESTED">Solicitado</option>
                      <option value="APPROVED">Aprovado</option>
                      <option value="REFUNDED">Reembolsado</option>
                      <option value="DENIED">Negado</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor reembolsado
                    <input
                      name="refundAmount"
                      defaultValue={order.refundAmount ?? ""}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Motivo / observação do pós-venda
                    <textarea
                      name="returnReason"
                      rows={4}
                      defaultValue={order.returnReason || ""}
                      placeholder="Ex.: arrependimento, defeito, avaria no transporte, acordo comercial."
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                  >
                    Salvar pós-venda
                  </button>
                </form>
              ) : (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Status: <span className="font-medium text-gray-900">{order.refundStatus || "Sem solicitação"}</span></p>
                  <p>Valor reembolsado: <span className="font-medium text-gray-900">{order.refundAmount != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.refundAmount) : "—"}</span></p>
                  <p>Motivo: <span className="font-medium text-gray-900">{normalizeDisplayText(order.returnReason || "—") || "—"}</span></p>
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-4 space-y-1 text-xs text-gray-500">
                <p>Solicitado em: {order.refundRequestedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.refundRequestedAt) : "—"}</p>
                <p>Reembolsado em: {order.refundedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(order.refundedAt) : "—"}</p>
              </div>

              {hasAdminPermission(session.user.role, "orders:manage") ? (
                <form action={executeRefundAction} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                  <input type="hidden" name="refundAmount" value={order.refundAmount ?? ""} />
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {order.refundAmount != null
                      ? `Ao executar agora, será solicitado um reembolso de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.refundAmount)} no Mercado Pago.`
                      : "Ao executar agora, será solicitado o reembolso integral do pedido no Mercado Pago."}
                  </div>
                  <button
                    type="submit"
                    disabled={!canExecuteRefund}
                    className={`w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white ${canExecuteRefund ? "bg-rose-600 hover:bg-rose-700" : "cursor-not-allowed bg-gray-300"}`}
                  >
                    Executar reembolso no Mercado Pago
                  </button>
                  {!order.paymentId ? <p className="text-xs text-gray-500">O pedido ainda não possui Payment ID para reembolso automático.</p> : null}
                  {order.paymentId && !["approved", "partially_refunded"].includes(normalizedPaymentStatus) ? <p className="text-xs text-gray-500">O pagamento precisa estar aprovado para liberar o reembolso automático.</p> : null}
                  {order.paymentId && !hasRefundWorkflowStarted ? <p className="text-xs text-gray-500">Marque o pós-venda como solicitado ou aprovado antes de executar o reembolso.</p> : null}
                </form>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                Cliente
              </h2>
            </div>
            <div className="p-4 text-sm space-y-3">
              <div>
                <p className="text-gray-500 mb-0.5">Nome</p>
                <p className="font-medium text-gray-900">{normalizeDisplayText(order.user?.name || order.guestName || "Visitante")}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Email</p>
                <p className="font-medium text-gray-900">{normalizeDisplayText(order.user?.email || order.guestEmail || "Não informado")}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Tipo</p>
                <p className="font-medium text-gray-800">{order.isGuest ? "Visitante (Checkout Rápido)" : "Usuário Cadastrado"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Pagamento</p>
                <p className="font-medium text-gray-800">{normalizeDisplayText(order.paymentMethod || "Não informado") || "Não informado"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Status do pagamento</p>
                <p className="font-medium text-gray-800">{getPaymentStatusLabel(order.paymentStatus)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Status de pós-venda</p>
                <p className="font-medium text-gray-800">{normalizeDisplayText(order.refundStatus || "Sem solicitação") || "Sem solicitação"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Cupom</p>
                <p className="font-medium text-gray-800">{normalizeDisplayText(order.couponCode || "Sem cupom") || "Sem cupom"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
