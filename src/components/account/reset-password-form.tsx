"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/account";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { execute } = useRecaptchaV3();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const recaptchaToken = await execute("reset_password_submit");
        formData.set("recaptchaToken", recaptchaToken);
        formData.set("recaptchaAction", "reset_password_submit");
        await resetPasswordAction(formData);
        setMessage("Senha redefinida com sucesso. Agora você já pode entrar.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Não foi possível redefinir a senha.");
      }
    });
  }

  return (
    <form action={onSubmit} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1.5">
        <label htmlFor="reset-password" className="text-sm font-semibold text-zinc-900">Nova senha</label>
        <Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={6} required placeholder="Crie uma nova senha segura" />
        <p className="text-xs leading-5 text-zinc-500">Use pelo menos 6 caracteres. Se puder, combine letras e números.</p>
      </div>

      {message ? <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <Button type="submit" disabled={isPending} className="h-12 w-full bg-[#111111] text-white hover:bg-[#111111]/92">
        {isPending ? "Salvando..." : "Redefinir senha"}
      </Button>

      <p className="text-sm text-zinc-500">
        <Link href="/login" className="font-semibold text-[#111111] underline decoration-[#D4AF37] decoration-2 underline-offset-4 hover:text-[#8a6e1e]">Voltar para login</Link>
      </p>
    </form>
  );
}