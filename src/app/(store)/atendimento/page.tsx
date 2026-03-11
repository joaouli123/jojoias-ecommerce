import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "Atendimento",
  description: "Central de ajuda da JoJoias para suporte sobre produtos, pedidos, entregas, trocas e acompanhamento pos-venda.",
  alternates: {
    canonical: "/atendimento",
  },
  openGraph: {
    title: "Atendimento | JoJoias",
    description: "Central de ajuda da JoJoias para suporte sobre produtos, pedidos, entregas, trocas e acompanhamento pos-venda.",
    url: `${siteUrl}/atendimento`,
    type: "website",
    locale: "pt_BR",
  },
};

export default async function SupportPage() {
  const settings = await getStoreSettings();

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Central de ajuda"
        title="Atendimento próximo para acompanhar sua compra do início ao fim"
        description="Fale com nossa equipe para tirar dúvidas sobre produtos, pedidos, entrega, trocas e suporte pós-venda."
      />

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
            <Phone className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">Telefone</h2>
            <p className="mt-2 text-sm text-zinc-600">{settings.supportPhone}</p>
          </div>
          <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
            <MessageCircle className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">WhatsApp</h2>
            <Link href={settings.whatsappUrl} target="_blank" className="mt-2 inline-flex text-sm text-zinc-600 hover:text-[#D4AF37]">
              {settings.whatsappPhone}
            </Link>
          </div>
          <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
            <Mail className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">E-mail</h2>
            <a href={`mailto:${settings.supportEmail}`} className="mt-2 inline-flex text-sm text-zinc-600 hover:text-[#D4AF37]">
              {settings.supportEmail}
            </a>
          </div>
          <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
            <Clock3 className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="mt-4 text-lg font-bold text-zinc-950">Horário</h2>
            <p className="mt-2 text-sm text-zinc-600">{settings.businessHours}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-8">
            <h2 className="text-2xl font-bold text-zinc-950">Como podemos ajudar?</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-600">
              <li>• Dúvidas sobre materiais, banhos, medidas e conservação das peças.</li>
              <li>• Acompanhamento de pedidos, pagamentos e atualização de entrega.</li>
              <li>• Solicitações de troca, devolução ou suporte em casos de divergência.</li>
              <li>• Atendimento para compras em datas especiais, presentes e campanhas.</li>
            </ul>
          </div>

          <div className="rounded-[20px] border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Base de operação</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{settings.addressLine}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">Atendimento digital com acompanhamento rápido para todo o Brasil.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
