"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";
import { AuthShell } from "@/components/auth/auth-shell";

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
    <AuthShell
      eyebrow="Cadastro"
      title="Criar conta"
      description="Preencha seus dados para acompanhar pedidos, salvar favoritos e finalizar compras com mais rapidez."
      asideTitle="Cadastro rápido, claro e sem ruído"
      asideDescription="Pedimos apenas as informações necessárias para sua conta começar bem configurada. Depois você pode completar endereço e outros dados dentro da área do cliente."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="register-name" className="text-sm font-semibold text-zinc-900">Nome completo</label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Como devemos te chamar?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-sm font-semibold text-zinc-900">E-mail principal</label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <p className="text-xs leading-5 text-zinc-500">Usaremos esse e-mail para login, recuperação de senha, pedidos e mensagens importantes da compra.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-sm font-semibold text-zinc-900">Senha</label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie uma senha segura"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
          <p className="text-xs leading-5 text-zinc-500">Use pelo menos 6 caracteres. Se puder, combine letras e números para aumentar a segurança.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-phone" className="text-sm font-semibold text-zinc-900">Telefone</label>
          <Input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            placeholder="Opcional, para contato e suporte"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

        <div className="rounded-[20px] border border-[#eadfce] bg-[#fffaf1] px-4 py-3 text-xs leading-5 text-zinc-600">
          Ao criar sua conta, você poderá acompanhar pedidos, recuperar acesso por e-mail e receber comunicações transacionais da loja quando necessário.
        </div>

        <Button type="submit" className="h-12 w-full bg-[#111111] text-white hover:bg-[#111111]/92" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-5 border-t border-[#e7ddce] pt-5 text-sm text-zinc-600">
        Já possui conta?{" "}
        <Link href="/login" className="font-semibold text-[#111111] underline decoration-[#D4AF37] decoration-2 underline-offset-4 hover:text-[#8a6e1e]">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}

