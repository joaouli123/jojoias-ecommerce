import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = hasAdminPermission(session.user.role, "orders:view");
  const orders = await prisma.order.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: isAdmin,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    take: 100,
  });

  return NextResponse.json({ orders });
}
