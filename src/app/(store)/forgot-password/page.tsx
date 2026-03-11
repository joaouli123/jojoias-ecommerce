"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/account";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { execute } = useRecaptchaV3();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const recaptchaToken = await execute("forgot_password_submit");
        formData.set("recaptchaToken", recaptchaToken);
        formData.set("recaptchaAction", "forgot_password_submit");
        await requestPasswordResetAction(formData);
        setMessage("Se o e-mail existir na base, você receberá um link de recuperação.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Não foi possível enviar o link.");
      }
    });
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Recuperar senha</h1>
        <p className="mt-2 text-sm text-zinc-500">Informe seu e-mail para receber o link de redefinição.</p>

        <form action={onSubmit} className="mt-6 space-y-4">
          <input name="email" type="email" placeholder="Seu e-mail" required className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />

          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button type="submit" disabled={isPending} className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#111111]/90 disabled:opacity-70">
            {isPending ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-500">
          Lembrou a senha? <Link href="/login" className="font-semibold text-[#D4AF37] hover:text-[#b8932e]">Voltar para login</Link>
        </p>
      </section>
    </div>
  );
}