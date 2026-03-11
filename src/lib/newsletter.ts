import { prisma } from "@/lib/prisma";
import { newsletterSubscriptionSchema } from "@/lib/validators";

export async function subscribeToNewsletter(input: { email: string; name?: string; source?: string }) {
  const parsed = newsletterSubscriptionSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos para newsletter.");
  }

  const data = parsed.data;

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email: data.email.toLowerCase() },
    update: {
      name: data.name || null,
      source: data.source || null,
      status: "ACTIVE",
      unsubscribedAt: null,
      subscribedAt: new Date(),
    },
    create: {
      email: data.email.toLowerCase(),
      name: data.name || null,
      source: data.source || null,
      status: "ACTIVE",
    },
  });

  return subscriber;
}
