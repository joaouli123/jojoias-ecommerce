import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "Trocas e Devolucoes",
  description: "Consulte a politica de trocas e devolucoes da Luxijóias e entenda o fluxo de atendimento pos-venda da loja.",
  alternates: {
    canonical: "/trocas-e-devolucoes",
  },
  openGraph: {
    title: "Trocas e Devolucoes | Luxijóias",
    description: "Consulte a politica de trocas e devolucoes da Luxijóias e entenda o fluxo de atendimento pos-venda da loja.",
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

      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.82fr]">
          <article>
            <h2 className="text-2xl font-bold text-zinc-950">Política de trocas</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-zinc-900">{settings.exchangesContent}</p>
          </article>

          <aside className="rounded-[24px] border border-zinc-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-zinc-950">Fluxo de atendimento</h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 text-sm leading-7 text-zinc-600">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-xs font-bold text-zinc-900">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>
    </div>
  );
}
