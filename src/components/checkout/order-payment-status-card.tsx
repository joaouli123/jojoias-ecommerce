"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Copy, Download, QrCode } from "lucide-react";

type PaymentDetails = {
  paymentId: string | null;
  paymentMethodId: string | null;
  status: string;
  statusDetail: string | null;
  amount: number | null;
  expirationDate: string | null;
  approvedAt: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  barcodeContent: string | null;
};

type OrderPaymentStatusCardProps = {
  orderId: string;
  checkoutToken?: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  paymentExpiresAt?: string | null;
  initialPaymentDetails?: PaymentDetails | null;
};

function formatTimeRemaining(value: string | null | undefined) {
  if (!value) return null;

  const expiresAt = new Date(value).getTime();
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expirado";

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function OrderPaymentStatusCard({
  orderId,
  checkoutToken,
  paymentMethod,
  paymentStatus,
  paymentExpiresAt,
  initialPaymentDetails = null,
}: OrderPaymentStatusCardProps) {
  const [details, setDetails] = useState<PaymentDetails | null>(initialPaymentDetails);
  const [status, setStatus] = useState((paymentStatus || initialPaymentDetails?.status || "pending").toLowerCase());
  const [expiresAt, setExpiresAt] = useState(paymentExpiresAt || initialPaymentDetails?.expirationDate || null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const isPending = ["pending", "in_process", "in_mediation"].includes(status);
  const isApproved = status === "approved";
  const isFailed = ["rejected", "cancelled", "failure", "charged_back"].includes(status);
  const countdown = useMemo(() => formatTimeRemaining(expiresAt), [expiresAt, status]);

  useEffect(() => {
    if (!isPending) return;

    const poll = window.setInterval(async () => {
      const params = new URLSearchParams();
      if (checkoutToken) {
        params.set("token", checkoutToken);
      }

      const response = await fetch(`/api/orders/${orderId}/payment-status?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;

      const payload = (await response.json()) as {
        paymentStatus?: string | null;
        paymentExpiresAt?: string | null;
        paymentDetails?: PaymentDetails | null;
      };

      setStatus((payload.paymentStatus || details?.status || status).toLowerCase());
      setExpiresAt(payload.paymentExpiresAt || payload.paymentDetails?.expirationDate || expiresAt);
      setDetails(payload.paymentDetails || details);
    }, 5000);

    return () => window.clearInterval(poll);
  }, [checkoutToken, details, expiresAt, isPending, orderId, status]);

  useEffect(() => {
    if (!copyFeedback) return;
    const timer = window.setTimeout(() => setCopyFeedback(null), 2500);
    return () => window.clearTimeout(timer);
  }, [copyFeedback]);

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback("Código copiado.");
    } catch {
      setCopyFeedback("Não foi possível copiar.");
    }
  }

  if (!["PIX", "BOLETO", "CARD"].includes(paymentMethod || "")) {
    return null;
  }

  const HeaderIcon = isApproved ? CheckCircle2 : isFailed ? AlertCircle : Clock3;
  const headerColor = isApproved ? "text-emerald-600" : isFailed ? "text-rose-600" : "text-amber-500";

  return (
    <section className="rounded-[20px] border border-zinc-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <HeaderIcon className={`mt-0.5 h-6 w-6 shrink-0 ${headerColor}`} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium font-serif text-[#1A1A1A]">Pagamento no site</h2>
          <p className="mt-1 text-sm text-[#666666]">
            {isApproved
              ? "Pagamento identificado com sucesso."
              : isFailed
                ? "O pagamento não foi aprovado. Você pode revisar os dados e tentar novamente no checkout."
                : "Aguardando confirmação automática do pagamento."}
          </p>
          {countdown && isPending ? <p className="mt-2 text-sm font-semibold text-amber-700">Expira em {countdown}</p> : null}
          {copyFeedback ? <p className="mt-2 text-xs font-semibold text-[#666666]">{copyFeedback}</p> : null}
        </div>
      </div>

      {paymentMethod === "PIX" && details?.qrCodeBase64 ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[20px] border border-zinc-200 bg-[#FFFFFF] p-4">
            <img
              src={`data:image/png;base64,${details.qrCodeBase64}`}
              alt="QR Code Pix"
              className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2"><QrCode className="h-4 w-4 text-[#32BCAD]" /> Pix copia e cola</p>
            <div className="rounded-[20px] border border-zinc-200 bg-[#FFFFFF] p-4 text-sm text-[#666666] break-all">
              {details.qrCode || "Código Pix indisponível."}
            </div>
            {details.qrCode ? (
              <button
                type="button"
                onClick={() => void handleCopy(details.qrCode || "")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] bg-[#111111] px-5 text-sm font-medium font-serif text-white hover:bg-[#111111]/90"
              >
                <Copy className="h-4 w-4" /> Copiar código Pix
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {paymentMethod === "BOLETO" ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[20px] border border-zinc-200 bg-[#FFFFFF] p-4 text-sm text-[#666666]">
            <p className="font-semibold text-[#1A1A1A]">Boleto gerado com instruções de pagamento</p>
            <p className="mt-1">Use o botão abaixo para abrir ou baixar o boleto e acompanhe a compensação automática nesta página.</p>
            {details?.barcodeContent ? <p className="mt-3 break-all text-xs text-[#666666]">Linha digitável: {details.barcodeContent}</p> : null}
          </div>
          {details?.ticketUrl ? (
            <>
              <div className="overflow-hidden rounded-[20px] border border-zinc-200 bg-white">
                <iframe title="Boleto" src={details.ticketUrl} className="h-[560px] w-full" />
              </div>
              <a
                href={details.ticketUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] bg-[#111111] px-5 text-sm font-medium font-serif text-white hover:bg-[#111111]/90"
              >
                <Download className="h-4 w-4" /> Abrir ou baixar boleto
              </a>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}