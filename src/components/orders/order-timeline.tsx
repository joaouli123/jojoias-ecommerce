import { CheckCircle2, Circle, Clock3, PackageCheck, Truck } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

const STATUS_STEPS: Array<{ status: OrderStatus; label: string; description: string }> = [
  { status: "PENDING", label: "Pedido recebido", description: "Pedido criado e aguardando confirmação inicial." },
  { status: "PROCESSING", label: "Em preparação", description: "Itens separados e conferidos para envio." },
  { status: "SHIPPED", label: "Enviado", description: "Pedido despachado para a transportadora." },
  { status: "DELIVERED", label: "Entregue", description: "Pedido entregue ao destinatário." },
];

const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((step, index) => [step.status, index])) as Record<OrderStatus, number>;

function getStepState(currentStatus: OrderStatus, stepStatus: OrderStatus) {
  if (currentStatus === "CANCELLED") {
    return stepStatus === "PENDING" ? "completed" : "pending";
  }

  const currentIndex = STATUS_INDEX[currentStatus] ?? 0;
  const stepIndex = STATUS_INDEX[stepStatus] ?? 0;

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

function StepIcon({ status, state }: { status: OrderStatus; state: "completed" | "current" | "pending" }) {
  const className = state === "pending" ? "text-gray-300" : state === "current" ? "text-amber-600" : "text-emerald-600";

  switch (status) {
    case "PENDING":
      return state === "completed" ? <CheckCircle2 className={`h-5 w-5 ${className}`} /> : <Clock3 className={`h-5 w-5 ${className}`} />;
    case "PROCESSING":
      return state === "completed" ? <CheckCircle2 className={`h-5 w-5 ${className}`} /> : <PackageCheck className={`h-5 w-5 ${className}`} />;
    case "SHIPPED":
      return state === "completed" ? <CheckCircle2 className={`h-5 w-5 ${className}`} /> : <Truck className={`h-5 w-5 ${className}`} />;
    case "DELIVERED":
      return <CheckCircle2 className={`h-5 w-5 ${className}`} />;
    default:
      return <Circle className={`h-5 w-5 ${className}`} />;
  }
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <p className="font-bold text-rose-800">Pedido cancelado</p>
        <p className="mt-1">O fluxo foi interrompido antes da conclusão da entrega. O estoque já foi reajustado quando aplicável.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {STATUS_STEPS.map((step, index) => {
        const state = getStepState(status, step.status);
        const isLast = index === STATUS_STEPS.length - 1;

        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} state={state} />
              {!isLast ? <span className={`mt-1 h-full w-px ${state === "pending" ? "bg-gray-200" : "bg-emerald-200"}`} /> : null}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-bold ${state === "pending" ? "text-gray-400" : state === "current" ? "text-amber-700" : "text-emerald-700"}`}>
                {step.label}
              </p>
              <p className="mt-1 text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}