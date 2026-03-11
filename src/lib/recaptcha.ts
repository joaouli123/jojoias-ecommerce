import { getSiteUrl } from "@/lib/site-url";

type VerifyRecaptchaInput = {
  token: string;
  action: string;
  remoteIp?: string | null;
  minScore?: number;
};

type VerifyRecaptchaResponse = {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

const DEFAULT_MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");

function getExpectedHostname() {
  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return null;
  }
}

export function isRecaptchaEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptchaToken(input: VerifyRecaptchaInput) {
  if (!isRecaptchaEnabled()) {
    return { ok: true, skipped: true, score: 1 };
  }

  const token = input.token.trim();
  if (!token) {
    return { ok: false, reason: "Token do reCAPTCHA ausente." };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: false, reason: "Chave secreta do reCAPTCHA não configurada." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (input.remoteIp?.trim()) {
    body.set("remoteip", input.remoteIp.trim());
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, reason: "Falha ao validar o reCAPTCHA com o Google." };
  }

  const payload = (await response.json()) as VerifyRecaptchaResponse;

  if (!payload.success) {
    return {
      ok: false,
      reason: "Validação reCAPTCHA recusada.",
      details: payload["error-codes"] ?? [],
    };
  }

  if (payload.action !== input.action) {
    return { ok: false, reason: "Ação do reCAPTCHA inválida." };
  }

  const expectedHostname = getExpectedHostname();
  if (expectedHostname && payload.hostname && payload.hostname !== expectedHostname) {
    return { ok: false, reason: "Hostname do reCAPTCHA inválido." };
  }

  const minScore = input.minScore ?? (Number.isFinite(DEFAULT_MIN_SCORE) ? DEFAULT_MIN_SCORE : 0.5);
  const score = typeof payload.score === "number" ? payload.score : 0;

  if (score < minScore) {
    return {
      ok: false,
      reason: `Score do reCAPTCHA abaixo do mínimo (${score.toFixed(2)} < ${minScore.toFixed(2)}).`,
      score,
    };
  }

  return { ok: true, score };
}

export async function assertRecaptchaToken(input: VerifyRecaptchaInput) {
  const result = await verifyRecaptchaToken(input);

  if (!result.ok) {
    throw new Error(result.reason || "Falha na validação do reCAPTCHA.");
  }

  return result;
}

export function readRecaptchaIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headers.get("x-real-ip");
}