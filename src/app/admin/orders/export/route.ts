import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPermission } from "@/lib/admin-permissions";

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  if (!/[";,\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAdminPermission(session.user.role, "orders:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const header = [
    "pedido_id",
    "criado_em",
    "status",
    "pagamento_metodo",
    "pagamento_status",
    "frete_servico",
    "frete_regiao",
    "prazo_frete",
    "rastreamento",
    "cliente_nome",
    "cliente_email",
    "cliente_documento",
    "cep",
    "cidade",
    "estado",
    "subtotal",
    "frete",
    "desconto",
    "total",
    "cupom",
    "itens",
    "observacoes",
  ];

  const rows = orders.map((order) => {
    const customerName = order.user?.name || order.guestName || "Visitante";
    const customerEmail = order.user?.email || order.guestEmail || "";
    const items = order.items.map((item) => `${item.quantity}x ${item.product.name}`).join(" | ");

    return [
      order.id,
      order.createdAt.toISOString(),
      order.status,
      order.paymentMethod || "",
      order.paymentStatus || "",
      order.shippingService || "",
      order.shippingRegion || "",
      order.shippingEstimatedDays || "",
      order.trackingCode || "",
      customerName,
      customerEmail,
      order.customerDocument || "",
      order.addressZipcode || "",
      order.addressCity || "",
      order.addressState || "",
      order.subtotal.toFixed(2),
      order.shipping.toFixed(2),
      order.discount.toFixed(2),
      order.total.toFixed(2),
      order.couponCode || "",
      items,
      order.notes || "",
    ].map(escapeCsvValue).join(";");
  });

  const csv = `\uFEFF${header.join(";")}\n${rows.join("\n")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}