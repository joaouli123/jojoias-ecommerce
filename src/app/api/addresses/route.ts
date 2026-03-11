import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = hasAdminPermission(session.user.role, "customers:view");
  const addresses = await prisma.address.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    include: {
      user: isAdmin,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ addresses });
}
