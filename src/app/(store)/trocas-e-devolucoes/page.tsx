import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jojoias.com.br";

export const metadata: Metadata = {
  title: "Trocas e Devolucoes",
  description: "Consulte a politica de trocas e devolucoes da JoJoias e entenda o fluxo de atendimento pos-venda da loja.",
  alternates: {
    canonical: "/trocas-e-devolucoes",
  },
  openGraph: {
    title: "Trocas e Devolucoes | JoJoias",
    description: "Consulte a politica de trocas e devolucoes da JoJoias e entenda o fluxo de atendimento pos-venda da loja.",
    url: `${siteUrl}/trocas-e-devolucoes`,
    type: "website",
    locale: "pt_BR",
  },
};

const steps = [
  "Entre em contato com nossa central informando o número do pedido e o motivo da solicitação.",
  "Nossa equipe valida o cenário e orienta a melhor forma de envio ou coleta, quando aplicável.",
  "Após a conferência do produto, seguimos com troca, crédito na loja ou estorno conforme o caso.",
];

export default async function ExchangesPage() {
  const settings = await getStoreSettings();

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Pós-venda"
        title="Trocas e devoluções com orientação clara e atendimento ágil"
        description="Nosso objetivo é resolver qualquer necessidade com transparência e praticidade para você comprar com confiança."
      />

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[20px] border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Política de trocas</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-8 text-zinc-600">{settings.exchangesContent}</p>
          </div>

          <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-8">
            <h2 className="text-2xl font-bold text-zinc-950">Fluxo de atendimento</h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 text-sm leading-7 text-zinc-600">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
