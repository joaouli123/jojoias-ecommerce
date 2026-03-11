import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ isAuthenticated: false, canReview: false });
  }

  const { productId } = await params;
  const canReview = Boolean(await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      items: { some: { productId } },
    },
    select: { id: true },
  }));

  return NextResponse.json({ isAuthenticated: true, canReview });
}