"use server";

import crypto from "node:crypto";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, profileSchema, resetPasswordSchema } from "@/lib/validators";
import { getSiteUrl } from "@/lib/site-url";
import { getIntegrationSettings } from "@/lib/integrations";
import { assertRecaptchaToken } from "@/lib/recaptcha";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function sendResetPasswordEmail(email: string, name: string, token: string) {
  const resend = await getIntegrationSettings("resend");

  if (!resend?.isEnabled || !resend.secretKey) {
    return;
  }

  const endpoint = (resend.endpointUrl || "https://api.resend.com").replace(/\/$/, "");
  const from = typeof resend.extraConfig.fromEmail === "string" && resend.extraConfig.fromEmail
    ? resend.extraConfig.fromEmail
    : "JoJoias <onboarding@resend.dev>";
  const link = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  await fetch(`${endpoint}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resend.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Recuperação de senha - JoJoias",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h1>Olá, ${name}!</h1>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p><a href="${link}" style="display:inline-block;background:#111111;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">Redefinir senha</a></p>
          <p>Se você não solicitou, basta ignorar este e-mail.</p>
        </div>
      `,
    }),
  }).catch((error) => {
    console.error("Erro ao enviar e-mail de recuperação:", error);
  });
}

export async function updateProfileAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }

  const parsed = profileSchema.safeParse({
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    phone: readField(formData, "phone"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: parsed.data.email,
      id: { not: session.user.id },
    },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Este e-mail já está em uso por outra conta.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath("/account");
}

export async function requestPasswordResetAction(formData: FormData) {
  await assertRecaptchaToken({
    token: readField(formData, "recaptchaToken"),
    action: "forgot_password_submit",
  });

  if (readField(formData, "recaptchaAction") !== "forgot_password_submit") {
    throw new Error("A validação de segurança do formulário falhou.");
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: readField(formData, "email"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "E-mail inválido.");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return { success: true };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${user.id}`,
      token,
      expires,
    },
  });

  await sendResetPasswordEmail(user.email, user.name, token);

  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  await assertRecaptchaToken({
    token: readField(formData, "recaptchaToken"),
    action: "reset_password_submit",
  });

  if (readField(formData, "recaptchaAction") !== "reset_password_submit") {
    throw new Error("A validação de segurança do formulário falhou.");
  }

  const parsed = resetPasswordSchema.safeParse({
    token: readField(formData, "token"),
    password: readField(formData, "password"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos.");
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.expires < new Date() || !record.identifier.startsWith("reset:")) {
    throw new Error("Link de recuperação inválido ou expirado.");
  }

  const userId = record.identifier.replace("reset:", "");
  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    }),
    prisma.verificationToken.delete({
      where: { token: parsed.data.token },
    }),
  ]);

  return { success: true };
}