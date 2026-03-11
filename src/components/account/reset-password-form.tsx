"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/account";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
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
      <input name="password" type="password" minLength={6} required placeholder="Nova senha" className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button type="submit" disabled={isPending} className="h-12 w-full rounded-xl bg-[#111111] text-sm font-bold text-white hover:bg-[#111111]/90 disabled:opacity-70">
        {isPending ? "Salvando..." : "Redefinir senha"}
      </button>

      <p className="text-sm text-zinc-500">
        <Link href="/login" className="font-semibold text-[#D4AF37] hover:text-[#b8932e]">Voltar para login</Link>
      </p>
    </form>
  );
}