"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";

type MessageState = {
  text: string;
  tone: "neutral" | "success" | "error";
};

export function NewsletterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [isPending, startTransition] = useTransition();
  const { execute } = useRecaptchaV3();

  return (
    <form
      className="max-w-sm space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);

        if (!showNameField) {
          if (!email.trim()) {
            setMessage({ text: "Informe seu melhor e-mail para continuar.", tone: "error" });
            return;
          }

          setShowNameField(true);
          setMessage({ text: "Agora informe seu nome para concluir a inscrição.", tone: "neutral" });
          return;
        }

        if (!name.trim()) {
          setMessage({ text: "Informe seu nome para concluir a inscrição.", tone: "error" });
          return;
        }

        startTransition(async () => {
          let recaptchaToken = "";

          try {
            recaptchaToken = await execute("newsletter_subscribe");
          } catch (submitError) {
            setMessage({ text: submitError instanceof Error ? submitError.message : "Não foi possível validar a segurança da inscrição.", tone: "error" });
            return;
          }

          const response = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, source: "footer", recaptchaToken, recaptchaAction: "newsletter_subscribe" }),
          });

          const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };

          if (!response.ok) {
            setMessage({ text: payload.error || "Não foi possível concluir a inscrição.", tone: "error" });
            return;
          }

          setEmail("");
          setName("");
          setShowNameField(false);
          setMessage({ text: payload.message || "Inscrição confirmada com sucesso.", tone: "success" });
        });
      }}
    >
      <div className="space-y-3">
        <div className="relative flex items-center">
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-12 w-full rounded-full border border-zinc-300 bg-white px-5 pr-14 text-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
          <button
            type="submit"
            aria-label={showNameField ? "Confirmar inscrição" : "Continuar inscrição"}
            disabled={isPending}
            className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] text-white transition-colors hover:bg-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {showNameField ? (
          <div className="w-full">
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              className="h-12 w-full rounded-full border border-zinc-300 bg-white px-5 text-sm outline-none transition-all focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
        ) : null}
      </div>
      {message ? (
        <p
          className={`flex items-center gap-2 text-sm ${
            message.tone === "success"
              ? "font-medium text-emerald-600"
              : message.tone === "error"
              ? "text-red-600"
              : "text-[#666666]"
          }`}
        >
          {message.tone === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
          <span>{message.text}</span>
        </p>
      ) : null}
    </form>
  );
}
