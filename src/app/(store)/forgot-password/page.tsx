"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/actions/account";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";
import { AuthShell } from "@/components/auth/auth-shell";

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
    <AuthShell
      eyebrow="Recuperação"
      title="Recuperar senha"
      description="Informe seu e-mail principal para receber um link seguro de redefinição de senha."
      asideTitle="Recupere o acesso sem complicação"
      asideDescription="Se o e-mail informado estiver cadastrado, enviamos um link de recuperação. Por segurança, a mensagem de retorno é discreta e não revela se a conta existe ou não."
    >
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="forgot-email" className="text-sm font-semibold text-[#1A1A1A]">E-mail da conta</label>
          <Input id="forgot-email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required />
        </div>

        {message ? <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <Button type="submit" disabled={isPending} className="h-12 w-full bg-[#111111] text-white hover:bg-[#111111]/92">
          {isPending ? "Enviando..." : "Enviar link de recuperação"}
        </Button>
      </form>

      <p className="mt-5 border-t border-[#e7ddce] pt-5 text-sm text-[#666666]">
        Lembrou a senha? <Link href="/login" className="font-semibold text-[#111111] underline decoration-[#D4AF37] decoration-2 underline-offset-4 hover:text-[#8a6e1e]">Voltar para login</Link>
      </p>
    </AuthShell>
  );
}