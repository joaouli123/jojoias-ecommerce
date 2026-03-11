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
    title: "Experiência JoJoias",
    text: "Favoritos, ofertas e atendimento centralizados na sua conta para comprar com menos atrito.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  asideTitle = "Sua conta JoJoias em um só lugar",
  asideDescription = "Entre ou crie sua conta para acompanhar pedidos, salvar favoritos e finalizar compras com mais agilidade.",
}: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 md:py-12 lg:px-8 lg:py-16">
      <section className="overflow-hidden rounded-[32px] border border-[#d9cfbf] bg-[linear-gradient(180deg,#fffdf8_0%,#f6f1e8_100%)] shadow-[0_20px_60px_-40px_rgba(17,17,17,0.35)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden border-b border-[#e7ddce] px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(17,17,17,0.08),transparent_38%)]" />
            <div className="relative">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#8a6e1e]">{eyebrow}</p>
              <h1 className="mt-4 max-w-lg text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{asideTitle}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 sm:text-[15px]">{asideDescription}</p>

              <div className="mt-8 grid gap-3 sm:gap-4">
                {highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-[24px] border border-white/70 bg-white/70 p-4 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#eadfce] bg-[#fffaf1] text-[#b8932e]">
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

              <div className="mt-8 rounded-[24px] bg-[#111111] px-5 py-4 text-white">
                <p className="text-sm font-semibold text-[#d4af37]">Atendimento humano quando precisar</p>
                <p className="mt-1 text-sm leading-6 text-white/78">
                  Se tiver qualquer dúvida sobre cadastro, pedido ou recuperação de acesso, fale com nossa central.
                </p>
                <Link href="/atendimento" className="mt-3 inline-flex text-sm font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  Ir para atendimento
                </Link>
              </div>
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="mx-auto max-w-md">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8a6e1e]">{eyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-[15px]">{description}</p>
              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}