import { CreditCard, Map, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  { icon: ShieldCheck, title: "Loja 100% segura", subtitle: "selo de segurança" },
  { icon: Map, title: "Entregamos", subtitle: "em todo o Brasil" },
  { icon: CreditCard, title: "Parcele suas compras", subtitle: "em até 12x" },
  { icon: Truck, title: "Frete grátis", subtitle: "para SP" },
];

export function BenefitsStrip() {
  return (
    <section className="relative mx-auto w-full max-w-[1440px] bg-white px-4 pt-8 sm:px-6 md:pt-12 lg:px-8">
      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-5 md:grid-cols-4 md:gap-0 md:px-0 md:py-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;

          return (
            <div key={benefit.title} className={`flex items-center justify-center px-2 ${index !== benefits.length - 1 ? "md:border-r md:border-zinc-200" : ""}`}>
              <div className="flex w-full items-center justify-center gap-4 rounded-xl p-3">
                <Icon className="h-8 w-8 shrink-0 stroke-[1.5] text-zinc-900" />
                <div className="flex flex-col text-left">
                  <strong className="block text-sm font-bold leading-tight text-zinc-950 md:text-[15px]">{benefit.title}</strong>
                  <span className="text-xs text-zinc-600 md:text-[13px]">{benefit.subtitle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}