import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/lib/site-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = buildPageMetadata({
  title: "Termos de Uso",
  description: "Confira as condições gerais de navegação e compra da Luxijóias, com regras comerciais e operacionais da loja.",
  path: "/termos-de-uso",
});

export default async function TermsPage() {
  const settings = await getStoreSettings();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Termos de Uso", path: "/termos-de-uso" },
  ]);
  const pageJsonLd = buildPageJsonLd({
    title: "Termos de Uso",
    description: "Confira as condições gerais de navegação e compra da Luxijóias, com regras comerciais e operacionais da loja.",
    path: "/termos-de-uso",
  });

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <InstitutionalHero
        eyebrow="Termos de uso"
        title="Condições gerais para navegar e comprar na Luxijóias"
        description="Reunimos aqui as principais diretrizes comerciais e operacionais aplicáveis à utilização da loja."
      />

      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="max-w-4xl">
          <article className="whitespace-pre-line text-base leading-7 text-zinc-900">
            {settings.termsContent}
          </article>
        </div>
      </section>
    </div>
  );
}
