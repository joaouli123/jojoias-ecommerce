import type { Metadata } from "next";
import { Gem, ShieldCheck, Truck } from "lucide-react";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/lib/site-seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = buildPageMetadata({
  title: "Quem Somos",
  description: "Conheça a Luxijóias, sua curadoria de joias e acessórios com compra segura, entrega ágil e atendimento próximo em todo o Brasil.",
  path: "/quem-somos",
});

const highlights = [
  {
    title: "Curadoria premium",
    description: "Seleção de peças elegantes, versáteis e alinhadas às principais tendências.",
    icon: Gem,
  },
  {
    title: "Compra segura",
    description: "Processo de checkout protegido, atendimento próximo e acompanhamento em cada etapa.",
    icon: ShieldCheck,
  },
  {
    title: "Entrega ágil",
    description: "Separação rápida e transparência sobre prazo, frete e atualização do pedido.",
    icon: Truck,
  },
];

export default async function AboutPage() {
  const settings = await getStoreSettings();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Quem Somos", path: "/quem-somos" },
  ]);
  const pageJsonLd = buildPageJsonLd({
    title: settings.aboutTitle,
    description: settings.aboutDescription,
    path: "/quem-somos",
    type: "AboutPage",
  });

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <InstitutionalHero eyebrow="A Luxijóias" title={settings.aboutTitle} description={settings.aboutDescription} />

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:py-20">
        <div className="rounded-[20px] border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-zinc-950">Nossa essência</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-8 text-zinc-600">{settings.aboutContent}</p>
        </div>

        <div className="space-y-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-zinc-950 text-[#D4AF37]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
