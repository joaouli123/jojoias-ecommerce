"use client";

import type { ComponentType, InputHTMLAttributes, SVGProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Barcode, Calendar, CreditCard, Hash, QrCode, ShieldCheck, User } from "lucide-react";
import { PixIcon } from "@/components/ui/icons";

type Method = "PIX" | "CARD" | "BOLETO";

type PaymentMethodsSectionProps = {
  pixDiscountPercent: number;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: IconType }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        {...props}
        className="h-11 w-full rounded-[20px] border border-zinc-200 pl-10 pr-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
      />
    </div>
  );
}

export function PaymentMethodsSection({ pixDiscountPercent }: PaymentMethodsSectionProps) {
  const [method, setMethod] = useState<Method>("PIX");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const pixSelected = method === "PIX";
  const cardSelected = method === "CARD";
  const boletoSelected = method === "BOLETO";
  const paymentStatusId = "checkout-payment-status";

  const installments = useMemo(
    () => [
      "1x sem juros",
      "2x sem juros",
      "3x sem juros",
      "6x sem juros",
      "10x sem juros",
      "12x sem juros",
    ],
    [],
  );

  const emitPaymentUpdate = useCallback(
    (nextMethod: Method) => {
      window.dispatchEvent(
        new CustomEvent("payment:updated", {
          detail: {
            method: nextMethod,
            pixDiscountPercent,
          },
        }),
      );
    },
    [pixDiscountPercent],
  );

  function handleMethodChange(nextMethod: Method) {
    setMethod(nextMethod);
  }

  useEffect(() => {
    emitPaymentUpdate(method);
  }, [emitPaymentUpdate, method]);

  return (
    <section className="rounded-[20px] border border-zinc-200 bg-white p-5 md:p-6" aria-labelledby="checkout-payment-heading" aria-describedby={paymentStatusId}>
      <h2 id="checkout-payment-heading" className="text-xl font-bold text-zinc-900 mb-4">Pagamento</h2>
      <p className="mb-4 text-sm text-zinc-500">Se o Mercado Pago estiver ativo no painel, a finalização seguirá para o ambiente seguro do gateway após concluir o pedido.</p>
      <p id={paymentStatusId} className="sr-only" aria-live="polite" aria-atomic="true">
        {pixSelected ? `Pix selecionado com ${pixDiscountPercent}% de desconto.` : cardSelected ? "Cartão de crédito selecionado." : "Boleto bancário selecionado."}
      </p>
      <div className="space-y-3" role="radiogroup" aria-label="Métodos de pagamento">
        <label className="block rounded-[20px] border border-zinc-200 bg-zinc-50 p-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                value="PIX"
                checked={pixSelected}
                onChange={() => handleMethodChange("PIX")}
                aria-describedby={pixSelected ? "checkout-payment-pix-panel" : undefined}
                className="accent-[#111111]"
              />
              <PixIcon className="h-5 w-5 text-[#32BCAD]" />
              <span className="text-sm font-semibold text-zinc-800">Pix</span>
            </div>
            <span className="inline-flex h-6 items-center rounded-md bg-[#32BCAD] px-3 text-[11px] font-bold uppercase tracking-wide text-white">{pixDiscountPercent}% OFF</span>
          </div>

          {pixSelected && (
            <div id="checkout-payment-pix-panel" className="mt-3 rounded-[20px] border border-[#32BCAD]/40 bg-white p-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900 flex items-center gap-2"><QrCode className="h-4 w-4 text-[#32BCAD]" /> QR Code na próxima tela</p>
              <p className="mt-1 text-zinc-600">Após clicar em Finalizar compra, o QR Code Pix será gerado para pagamento imediato.</p>
            </div>
          )}
        </label>

        <label className="block rounded-[20px] border border-zinc-200 bg-zinc-50 p-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={cardSelected}
              onChange={() => handleMethodChange("CARD")}
              aria-describedby={cardSelected ? "checkout-payment-card-panel" : undefined}
              className="accent-[#111111]"
            />
            <CreditCard className="h-5 w-5 text-zinc-700" />
            <span className="text-sm font-semibold text-zinc-800">Cartão de crédito</span>
          </div>

          {cardSelected && (
            <div id="checkout-payment-card-panel" className="mt-3 rounded-[20px] border border-zinc-200 bg-white p-3 space-y-3">
              <InputWithIcon
                icon={CreditCard}
                name="cardNumber"
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                placeholder="Número do cartão"
                inputMode="numeric"
                autoComplete="cc-number"
                aria-label="Número do cartão"
              />
              <InputWithIcon
                icon={User}
                name="cardHolder"
                placeholder="Nome impresso no cartão"
                autoComplete="cc-name"
                aria-label="Nome impresso no cartão"
              />
              <div className="grid grid-cols-2 gap-3">
                <InputWithIcon
                  icon={Calendar}
                  name="cardExpiry"
                  value={cardExpiry}
                  onChange={(event) => setCardExpiry(formatExpiry(event.target.value))}
                  placeholder="Validade (MM/AA)"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  aria-label="Validade do cartão"
                />
                <InputWithIcon
                  icon={Hash}
                  name="cardCvv"
                  value={cardCvv}
                  onChange={(event) => setCardCvv(onlyDigits(event.target.value).slice(0, 4))}
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  aria-label="Código de segurança do cartão"
                />
              </div>
              <select
                name="cardInstallments"
                aria-label="Parcelamento do cartão"
                className="h-11 w-full rounded-[20px] border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              >
                {installments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Dados protegidos por criptografia.</p>
            </div>
          )}
        </label>

        <label className="block rounded-[20px] border border-zinc-200 bg-zinc-50 p-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value="BOLETO"
              checked={boletoSelected}
              onChange={() => handleMethodChange("BOLETO")}
              aria-describedby={boletoSelected ? "checkout-payment-boleto-panel" : undefined}
              className="accent-[#111111]"
            />
            <Barcode className="h-5 w-5 text-zinc-700" />
            <span className="text-sm font-semibold text-zinc-800">Boleto bancário</span>
          </div>

          {boletoSelected && (
            <div id="checkout-payment-boleto-panel" className="mt-3 rounded-[20px] border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Boleto gerado na próxima tela</p>
              <p className="mt-1 text-zinc-600">Após finalizar a compra, o boleto será exibido para impressão e pagamento.</p>
            </div>
          )}
        </label>
      </div>
    </section>
  );
}
