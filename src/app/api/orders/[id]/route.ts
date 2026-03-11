import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const token = new URL(request.url).searchParams.get("token");

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
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const isAdmin = hasAdminPermission(session?.user?.role, "orders:view");
  const isOwner = Boolean(session?.user?.id && order.userId === session.user.id);
  const isGuestWithToken = Boolean(order.isGuest && order.checkoutToken && token === order.checkoutToken);

  if (!isAdmin && !isOwner && !isGuestWithToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ order });
}
