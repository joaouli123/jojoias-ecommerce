import type { ReactNode } from "react";
import Link from "next/link";
import { Gem, ShieldCheck, Truck } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle?: string;
  asideDescription?: string;
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    text: "Login com validação de segurança e dados protegidos durante toda a navegação.",
  },
  {
    icon: Truck,
    title: "Pedidos na mão",
    text: "Acompanhe seus envios, histórico e checkout com mais rapidez no celular ou desktop.",
  },
  {
    icon: Gem,
    title: "Experiência Luxijóias",
    text: "Favoritos, ofertas e atendimento centralizados na sua conta para comprar com menos atrito.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  asideTitle = "Sua conta Luxijóias em um só lugar",
  asideDescription = "Entre ou crie sua conta para acompanhar pedidos, salvar favoritos e finalizar compras com mais agilidade.",
}: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 md:py-10 lg:px-8 lg:py-12">
      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden border-r border-zinc-200 bg-zinc-50 lg:block lg:px-10 lg:py-10">
            <div className="relative">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
              <h1 className="mt-4 max-w-lg text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{asideTitle}</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 sm:text-[15px]">{asideDescription}</p>

              <div className="mt-8 grid gap-3">
                {highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-[22px] border border-zinc-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-zinc-950">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-zinc-600">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[22px] border border-zinc-200 bg-white px-5 py-4">
                <p className="text-sm font-semibold text-zinc-950">Atendimento humano quando precisar</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Se tiver qualquer dúvida sobre cadastro, pedido ou recuperação de acesso, fale com nossa central.
                </p>
                <Link href="/atendimento" className="mt-3 inline-flex text-sm font-bold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-950">
                  Ir para atendimento
                </Link>
              </div>
            </div>
          </div>

          <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-lg">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-[15px]">{description}</p>
              <div className="mt-7">{children}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}