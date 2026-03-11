import { NextResponse } from "next/server";
import { requireAdminPermission, unauthorizedJson } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminPermission("reports:view");
  } catch {
    return unauthorizedJson();
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [orders, revenue, subscribers, products] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({
    summary: {
      orders,
      revenue: revenue._sum.total ?? 0,
      subscribers,
      activeProducts: products,
    },
  });
}
