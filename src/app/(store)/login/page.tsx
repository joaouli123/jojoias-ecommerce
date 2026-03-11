"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"]);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Credenciais inválidas. Verifique e tente novamente.");
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    const destination = STAFF_ROLES.has(session?.user?.role ?? "") ? "/admin" : "/account";

    window.location.href = destination;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950">Entrar na conta</h1>
      <p className="mt-2 text-sm text-zinc-500">Acesse seu histórico, pedidos e checkout rápido.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <Button type="submit" className="h-12 w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-zinc-500">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
          Criar conta
        </Link>
      </p>

      <p className="mt-3 text-sm text-zinc-500">
        Esqueceu sua senha?{" "}
        <Link href="/forgot-password" className="font-semibold text-[#D4AF37] hover:text-[#b8932e]">
          Recuperar acesso
        </Link>
      </p>
    </section>
  </div>
  );
}

