import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Conheca a politica de privacidade da JoJoias e como seus dados sao tratados com seguranca e transparencia.",
  alternates: {
    canonical: "/privacidade",
  },
  openGraph: {
    title: "Privacidade | JoJoias",
    description: "Conheca a politica de privacidade da JoJoias e como seus dados sao tratados com seguranca e transparencia.",
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

      <section className="mx-auto max-w-4xl px-6 py-14 sm:px-8 lg:px-10 lg:py-16">
        <article className="whitespace-pre-line text-[15px] leading-8 text-zinc-700 sm:text-base">
          {settings.privacyContent}
        </article>
      </section>
    </div>
  );
}
