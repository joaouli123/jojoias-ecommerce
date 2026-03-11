const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  in_process: "Em análise",
  in_mediation: "Em mediação",
  refunded: "Reembolsado",
  partially_refunded: "Parcialmente reembolsado",
  charged_back: "Chargeback",
  failure: "Falhou",
};

function stableNumericHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 900000;
  }

  return hash + 100000;
}

function shouldAttemptMojibakeRepair(value: string) {
  return /[ÃÂÕ�]/.test(value);
}

function decodeLatin1AsUtf8(value: string) {
  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

export function normalizeDisplayText(value: string | null | undefined) {
  if (!value) return "";

  const normalized = value.normalize("NFC").trim();
  if (!normalized) return "";

  if (!shouldAttemptMojibakeRepair(normalized)) {
    return normalized;
  }

  const repaired = decodeLatin1AsUtf8(normalized).normalize("NFC").trim();
  return repaired && !/[ÃÂ]/.test(repaired) ? repaired : normalized;
}

export function normalizeInputText(value: string | null | undefined) {
  return value ? value.normalize("NFC").trim() : "";
}

export function formatOrderCode(orderId: string) {
  return String(stableNumericHash(orderId)).padStart(6, "0");
}

export function formatAdminDateParts(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);

  return {
    date: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getPaymentStatusLabel(status: string | null | undefined) {
  if (!status) return "Pendente";
  return PAYMENT_STATUS_LABELS[status.toLowerCase()] ?? status;
}

export function getOrderStatusTone(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "PROCESSING":
      return "bg-sky-100 text-sky-800";
    case "SHIPPED":
      return "bg-violet-100 text-violet-800";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-rose-100 text-rose-800";
  }
}

export function parseCurrencyInput(value: FormDataEntryValue | string | null | undefined) {
  const raw = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  const normalized = raw.replace(/\s/g, "").replace(/R\$/gi, "").replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}