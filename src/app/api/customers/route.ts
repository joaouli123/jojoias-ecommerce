import { NextResponse } from "next/server";
import { requireAdminPermission, unauthorizedJson } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminPermission("customers:view");
  } catch {
    return unauthorizedJson();
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: { id: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      addresses: {
        select: { id: true, city: true, state: true, zipcode: true },
        take: 3,
      },
    },
    take: 100,
  });

  return NextResponse.json({ customers });
}
