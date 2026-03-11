import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InstitutionalHero } from "@/components/store/institutional-hero";
import { getStoreSettings } from "@/lib/store-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a JoJoias por telefone, WhatsApp ou e-mail para suporte, duvidas sobre pedidos e atendimento em todo o Brasil.",
  alternates: {
    canonical: "/contato",
  },
  openGraph: {
    title: "Contato | JoJoias",
    description: "Fale com a JoJoias por telefone, WhatsApp ou e-mail para suporte, duvidas sobre pedidos e atendimento em todo o Brasil.",
    url: `${siteUrl}/contato`,
    type: "website",
    locale: "pt_BR",
  },
};

export default async function ContactPage() {
  const settings = await getStoreSettings();

  return (
    <div className="bg-white">
      <InstitutionalHero
        eyebrow="Contato"
        title="Fale com a JoJoias pelo canal que for mais conveniente para você"
        description="Seja para tirar dúvidas, acompanhar pedidos ou solicitar suporte, nossa equipe está pronta para atender com rapidez."
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
            <h2 className="text-2xl font-bold text-zinc-950">Atendimento consultivo</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              Conte com nossa equipe para sugestões de peças, informações sobre materiais, suporte pós-compra, pedidos especiais e acompanhamento de entregas.
            </p>
            <div className="mt-6 space-y-3 text-sm text-zinc-600">
              <p>• Resposta rápida para dúvidas comerciais e operacionais.</p>
              <p>• Suporte para pagamentos, cupons, endereços e rastreamento.</p>
              <p>• Atendimento humanizado em toda a jornada do cliente.</p>
            </div>
          </div>

          <div className="rounded-[20px] border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Base de operação</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{settings.addressLine}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">Atendimento online com cobertura nacional e acompanhamento dedicado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
