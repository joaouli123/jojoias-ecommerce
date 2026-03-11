import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertRecaptchaToken, readRecaptchaIp } from "@/lib/recaptcha";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await assertRecaptchaToken({
      token: typeof body.recaptchaToken === "string" ? body.recaptchaToken : "",
      action: "register_submit",
      remoteIp: readRecaptchaIp(request.headers),
    });

    if (body.recaptchaAction !== "register_submit") {
      return NextResponse.json({ error: "Ação do reCAPTCHA inválida." }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const { name, email, password, phone } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno ao criar conta" }, { status: 500 });
  }
}

