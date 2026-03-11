type CheckoutStepsProps = {
  currentStep: number;
};

const STEPS = [
  "Dados",
  "Endereço",
  "Frete",
  "Pagamento",
  "Confirmação",
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                    ? "border-[#D4AF37] bg-[#D4AF37] text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500"
                }`}
              >
                {step}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${isActive ? "text-zinc-950" : "text-zinc-500"}`}>{label}</p>
              </div>
              {index < STEPS.length - 1 ? <div className="hidden h-px flex-1 bg-zinc-200 md:block" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
