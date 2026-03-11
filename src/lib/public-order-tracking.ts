import { prisma } from "@/lib/prisma";

export async function findTrackableOrder(lookup: string, email?: string | null) {
  const normalizedLookup = lookup.trim();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedLookup || !normalizedEmail) {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: {
      AND: [
        {
          OR: [
            { id: normalizedLookup },
            { trackingCode: normalizedLookup },
          ],
        },
        {
          OR: [
            { guestEmail: normalizedEmail },
            { user: { email: normalizedEmail } },
          ],
        },
      ],
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return order;
}
