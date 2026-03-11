"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";

type RegisterResponse = {
  error?: string;
};

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { execute } = useRecaptchaV3();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    let recaptchaToken = "";

    try {
      recaptchaToken = await execute("register_submit");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível validar a segurança do cadastro.");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, recaptchaToken, recaptchaAction: "register_submit" }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as RegisterResponse;
      setError(payload.error ?? "Não foi possível criar sua conta.");
      setIsLoading(false);
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (login?.error) {
      window.location.href = "/login";
      return;
    }

    window.location.href = "/account";
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950">Criar conta</h1>
      <p className="mt-2 text-sm text-zinc-500">Compre mais rápido e acompanhe pedidos em tempo real.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Crie uma senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        <Input
          type="tel"
          placeholder="Telefone (opcional)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <Button type="submit" className="h-12 w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-zinc-500">
        Já possui conta?{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
          Entrar
        </Link>
      </p>
    </section>
  </div>
  );
}

