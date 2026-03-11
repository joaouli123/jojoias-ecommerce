import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jojoias.com.br";

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

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="whitespace-pre-line text-base leading-8 text-zinc-600">{settings.privacyContent}</p>
        </div>
      </section>
    </div>
  );
}
