"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/actions/account";

type ProfileFormProps = {
  name: string;
  email: string;
  phone?: string | null;
};

export function ProfileForm({ name, email, phone }: ProfileFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        setMessage("Perfil atualizado com sucesso.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Não foi possível atualizar o perfil.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-medium font-serif text-[#1A1A1A]">Dados pessoais</h2>
        <p className="mt-1 text-sm text-[#666666]">Mantenha suas informações atualizadas para pedidos e comunicação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-[#666666]">Nome completo</label>
          <input id="name" name="name" defaultValue={name} className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-[#666666]">E-mail</label>
          <input id="email" name="email" type="email" defaultValue={email} className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" required />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-semibold text-[#666666]">Telefone</label>
        <input id="phone" name="phone" defaultValue={phone ?? ""} className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
      </div>

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#111111] px-5 text-sm font-medium font-serif text-white hover:bg-[#111111]/90 disabled:opacity-70">
        {isPending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}