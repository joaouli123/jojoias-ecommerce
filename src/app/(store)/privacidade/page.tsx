import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Conheca a politica de privacidade da Luxijóias e como seus dados sao tratados com seguranca e transparencia.",
  alternates: {
    canonical: "/privacidade",
  },
  openGraph: {
    title: "Privacidade | Luxijóias",
    description: "Conheca a politica de privacidade da Luxijóias e como seus dados sao tratados com seguranca e transparencia.",
    url: `${siteUrl}/privacidade`,
    type: "website",
    locale: "pt_BR",
  },
};

export default async function PrivacyPage() {
  const settings = await getStoreSettings();

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Privacidade"
        title="Proteção de dados e segurança em cada interação"
        description="Tratamos suas informações com responsabilidade para garantir uma jornada segura, transparente e confiável."
      />

      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="max-w-4xl">
          <article className="whitespace-pre-line text-base leading-7 text-zinc-900">
            {settings.privacyContent}
          </article>
        </div>
      </section>
    </div>
  );
}
