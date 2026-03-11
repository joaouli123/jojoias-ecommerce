import { NextResponse } from "next/server";
import { requireAdminPermission, unauthorizedJson } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { assertRecaptchaToken, readRecaptchaIp } from "@/lib/recaptcha";

export async function GET() {
  try {
    await requireAdminPermission("marketing:manage");
  } catch {
    return unauthorizedJson();
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  return NextResponse.json({ subscribers });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; name?: string; source?: string; recaptchaToken?: string; recaptchaAction?: string };

    await assertRecaptchaToken({
      token: body.recaptchaToken || "",
      action: "newsletter_subscribe",
      remoteIp: readRecaptchaIp(request.headers),
    });

    if (body.recaptchaAction !== "newsletter_subscribe") {
      return NextResponse.json({ error: "Ação do reCAPTCHA inválida." }, { status: 400 });
    }

    const subscriber = await subscribeToNewsletter({
      email: body.email || "",
      name: body.name,
      source: body.source || "storefront",
    });

    return NextResponse.json({
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        status: subscriber.status,
      },
      message: "Inscrição realizada com sucesso.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao inscrever na newsletter." }, { status: 400 });
  }
}
