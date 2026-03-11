import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoPaymentDetails, syncMercadoPagoPayment } from "@/lib/mercado-pago";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      isGuest: true,
      checkoutToken: true,
      paymentId: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentExpiresAt: true,
      status: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const isOwner = Boolean(session?.user?.id && order.userId === session.user.id);
  const hasValidGuestToken = Boolean(order.isGuest && order.checkoutToken && token === order.checkoutToken);

  if (!isOwner && !hasValidGuestToken) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 404 });
  }

  if (order.paymentId && ["pending", "in_process", "in_mediation"].includes((order.paymentStatus || "").toLowerCase())) {
    await syncMercadoPagoPayment(order.paymentId).catch(() => undefined);
  }

  const refreshedOrder = await prisma.order.findUnique({
    where: { id },
    select: {
      paymentId: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentExpiresAt: true,
      status: true,
    },
  });

  const paymentDetails = refreshedOrder?.paymentId
    ? await getMercadoPagoPaymentDetails(refreshedOrder.paymentId).catch(() => null)
    : null;

  return NextResponse.json({
    orderStatus: refreshedOrder?.status ?? order.status,
    paymentMethod: refreshedOrder?.paymentMethod ?? order.paymentMethod,
    paymentStatus: refreshedOrder?.paymentStatus ?? order.paymentStatus,
    paymentExpiresAt: refreshedOrder?.paymentExpiresAt?.toISOString() ?? order.paymentExpiresAt?.toISOString() ?? null,
    paymentDetails,
  });
}