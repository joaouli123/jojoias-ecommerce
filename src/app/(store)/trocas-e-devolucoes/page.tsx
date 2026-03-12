import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/lib/site-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = buildPageMetadata({
  title: "Trocas e Devoluções",
  description: "Consulte a política de trocas e devoluções da Luxijóias e entenda o fluxo de atendimento pós-venda da loja.",
  path: "/trocas-e-devolucoes",
});

const steps = [
  "Entre em contato com nossa central informando o número do pedido e o motivo da solicitação.",
  "Nossa equipe valida o cenário e orienta a melhor forma de envio ou coleta, quando aplicável.",
  "Após a conferência do produto, seguimos com troca, crédito na loja ou estorno conforme o caso.",
];

export default async function ExchangesPage() {
  const settings = await getStoreSettings();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Trocas e Devoluções", path: "/trocas-e-devolucoes" },
  ]);
  const pageJsonLd = buildPageJsonLd({
    title: "Trocas e Devoluções",
    description: "Consulte a política de trocas e devoluções da Luxijóias e entenda o fluxo de atendimento pós-venda da loja.",
    path: "/trocas-e-devolucoes",
  });

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <InstitutionalHero
        eyebrow="Pós-venda"
        title="Trocas e devoluções com orientação clara e atendimento ágil"
        description="Nosso objetivo é resolver qualquer necessidade com transparência e praticidade para você comprar com confiança."
      />

      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.82fr]">
          <article>
            <h2 className="text-2xl font-medium font-serif text-[#1A1A1A]">Política de trocas</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-[#1A1A1A]">{settings.exchangesContent}</p>
          </article>

          <aside className="rounded-[24px] border border-zinc-200 bg-white p-8">
            <h2 className="text-2xl font-medium font-serif text-[#1A1A1A]">Fluxo de atendimento</h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 text-sm leading-7 text-[#666666]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-[#F9F8F6] text-xs font-medium font-serif text-[#1A1A1A]">
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
