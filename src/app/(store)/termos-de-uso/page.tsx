import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Confira as condicoes gerais de navegacao e compra da JoJoias, com regras comerciais e operacionais da loja.",
  alternates: {
    canonical: "/termos-de-uso",
  },
  openGraph: {
    title: "Termos de Uso | JoJoias",
    description: "Confira as condicoes gerais de navegacao e compra da JoJoias, com regras comerciais e operacionais da loja.",
    url: `${siteUrl}/termos-de-uso`,
    type: "website",
    locale: "pt_BR",
  },
};

export default async function TermsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Termos de uso"
        title="Condições gerais para navegar e comprar na JoJoias"
        description="Reunimos aqui as principais diretrizes comerciais e operacionais aplicáveis à utilização da loja."
      />

      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <article className="whitespace-pre-line text-base leading-8 text-[#3f3f46] opacity-100">
            {settings.termsContent}
          </article>
        </div>
      </section>
    </div>
  );
}
