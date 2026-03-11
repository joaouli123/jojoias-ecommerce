"use client";

import { useRef, useState } from "react";
import { useRecaptchaV3 } from "@/components/recaptcha/use-recaptcha-v3";

type CheckoutProtectedFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  checkoutToken: string;
  children: React.ReactNode;
};

export function CheckoutProtectedForm({ action, checkoutToken, children }: CheckoutProtectedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const bypassRef = useRef(false);
  const { execute } = useRecaptchaV3();
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (bypassRef.current) {
      bypassRef.current = false;
      return;
    }

    event.preventDefault();
    setError(null);

    try {
      const token = await execute("checkout_submit");
      setRecaptchaToken(token);
      bypassRef.current = true;

      requestAnimationFrame(() => {
        formRef.current?.requestSubmit();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível validar a segurança do checkout.");
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <input type="hidden" name="checkoutToken" value={checkoutToken} />
      <input type="hidden" name="recaptchaToken" value={recaptchaToken} />
      <input type="hidden" name="recaptchaAction" value="checkout_submit" />
      {error ? (
        <div className="lg:col-span-12 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {children}
    </form>
  );
}