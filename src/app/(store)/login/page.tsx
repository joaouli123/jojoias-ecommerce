"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";
import { AuthShell } from "@/components/auth/auth-shell";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "SUPPORT"]);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { execute } = useRecaptchaV3();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    let recaptchaToken = "";

    try {
      recaptchaToken = await execute("login_submit");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível validar a segurança do login.");
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      recaptchaToken,
      recaptchaAction: "login_submit",
      redirect: false,
    });

    if (result?.error) {
      setError("Credenciais inválidas ou validação de segurança recusada. Verifique e tente novamente.");
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    const destination = STAFF_ROLES.has(session?.user?.role ?? "") ? "/admin" : "/account";

    window.location.href = destination;
  }

  return (
    <AuthShell
      eyebrow="Acesso"
      title="Entrar na conta"
      description="Acesse seus pedidos, favoritos e checkout rápido com o mesmo padrão visual da loja."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-semibold text-[#1A1A1A]">E-mail</label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-semibold text-[#1A1A1A]">Senha</label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <Button type="submit" className="h-12 w-full bg-[#111111] text-white hover:bg-[#111111]/92" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 space-y-3 border-t border-[#e7ddce] pt-5 text-sm text-[#666666]">
        <p>
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold text-[#111111] underline decoration-[#D4AF37] decoration-2 underline-offset-4 hover:text-[#8a6e1e]">
            Criar conta
          </Link>
        </p>
        <p>
          Esqueceu sua senha?{" "}
          <Link href="/forgot-password" className="font-semibold text-[#8a6e1e] underline decoration-[#D4AF37]/50 underline-offset-4 hover:text-[#6f5817]">
            Recuperar acesso
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

