import type { Metadata } from "next";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/lib/site-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacidade",
  description: "Conheça a política de privacidade da Luxijóias e como seus dados são tratados com segurança e transparência.",
  path: "/privacidade",
});

export default async function PrivacyPage() {
  const settings = await getStoreSettings();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Privacidade", path: "/privacidade" },
  ]);
  const pageJsonLd = buildPageJsonLd({
    title: "Privacidade",
    description: "Conheça a política de privacidade da Luxijóias e como seus dados são tratados com segurança e transparência.",
    path: "/privacidade",
  });

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <InstitutionalHero
        eyebrow="Privacidade"
        title="Proteção de dados e segurança em cada interação"
        description="Tratamos suas informações com responsabilidade para garantir uma jornada segura, transparente e confiável."
      />

      <section className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="max-w-4xl">
          <article className="whitespace-pre-line text-base leading-7 text-[#1A1A1A]">
            {settings.privacyContent}
          </article>
        </div>
      </section>
    </div>
  );
}
