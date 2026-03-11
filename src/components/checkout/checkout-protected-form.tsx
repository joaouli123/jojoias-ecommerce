"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";

type CheckoutProtectedFormProps = {
  checkoutToken: string;
  children: React.ReactNode;
};

export function CheckoutProtectedForm({ checkoutToken, children }: CheckoutProtectedFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { execute } = useRecaptchaV3();
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = await execute("checkout_submit");
      setRecaptchaToken(token);

      const formElement = formRef.current;
      if (!formElement) {
        throw new Error("Não foi possível inicializar o formulário de checkout.");
      }

      const formData = new FormData(formElement);
      formData.set("checkoutToken", checkoutToken);
      formData.set("recaptchaToken", token);
      formData.set("recaptchaAction", "checkout_submit");

      const response = await fetch("/api/checkout/submit", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; nextUrl?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível concluir o checkout.");
      }

      if (!payload?.nextUrl) {
        throw new Error("O checkout foi concluído, mas não retornou a próxima etapa.");
      }

      router.push(payload.nextUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível validar a segurança do checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <input type="hidden" name="checkoutToken" value={checkoutToken} />
      <input type="hidden" name="recaptchaToken" value={recaptchaToken} />
      <input type="hidden" name="recaptchaAction" value="checkout_submit" />
      <input type="hidden" name="checkoutMode" value="transparent" />
      {error ? (
        <div className="lg:col-span-12 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <fieldset disabled={isSubmitting} className="contents disabled:opacity-80">
        {children}
      </fieldset>
    </form>
  );
}