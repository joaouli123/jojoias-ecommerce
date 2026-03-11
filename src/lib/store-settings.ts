import { hasDatabaseUrl, prisma } from "@/lib/prisma";

type StoreSettingsPayload = {
  storeName?: string;
  tagline?: string;
  brandShowcaseEnabled?: boolean;
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementSecondaryText?: string;
  announcementLinkLabel?: string;
  announcementLinkHref?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappPhone?: string;
  whatsappUrl?: string;
  addressLine?: string;
  cityState?: string;
  businessHours?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutContent?: string;
  shippingContent?: string;
  exchangesContent?: string;
  privacyContent?: string;
  termsContent?: string;
};

export type StoreSettings = Required<StoreSettingsPayload>;

export const defaultStoreSettings: StoreSettings = {
  storeName: "JoJoias",
  tagline: "Semijoias selecionadas com qualidade premium, entrega rápida e uma experiência elegante do início ao fim.",
  brandShowcaseEnabled: true,
  announcementEnabled: true,
  announcementText: "Use o cupom PRIM e ganhe 10% OFF na primeira compra.",
  announcementSecondaryText: "Pix com condição especial e parcelamento sem juros nas coleções premium.",
  announcementLinkLabel: "Rastrear pedido",
  announcementLinkHref: "/rastreio",
  supportEmail: "contato@luxijoias.com.br",
  supportPhone: "(81) 98818-5372",
  whatsappPhone: "(81) 98818-5372",
  whatsappUrl: "https://wa.me/5581988185372",
  addressLine: "Recife - PE, Brasil",
  cityState: "Recife - PE",
  businessHours: "Seg a Sex: 10h às 19h",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  youtubeUrl: "https://youtube.com",
  aboutTitle: "Elegância, brilho e confiança em cada detalhe.",
  aboutDescription: "A JoJoias nasceu para oferecer semijoias com curadoria refinada, acabamento premium e atendimento próximo em todas as etapas da compra.",
  aboutContent:
    "Na JoJoias, cada coleção é pensada para acompanhar a rotina de mulheres que desejam sofisticação sem abrir mão da praticidade. Selecionamos peças versáteis, com banho de alta qualidade e design atual, para criar uma experiência que une beleza, durabilidade e confiança. Nosso compromisso vai além do produto: investimos em atendimento humanizado, expedição rápida e uma jornada de compra segura do início ao fim.",
  shippingContent:
    "Trabalhamos com expedição rápida e acompanhamento completo do pedido. Após a confirmação do pagamento, seu pedido entra em separação e você recebe atualizações por e-mail ou painel do cliente. Os prazos variam conforme CEP e modalidade escolhida no checkout. Sempre que houver frete promocional ou envio expresso disponível, mostramos as opções antes da finalização da compra.",
  exchangesContent:
    "Queremos que sua experiência seja impecável. Caso precise solicitar troca ou devolução, entre em contato com nossa equipe de atendimento informando o número do pedido e o motivo. Produtos sem sinais de uso e dentro do prazo legal seguem para análise e orientações de postagem. Em casos de defeito ou divergência, priorizamos o suporte com agilidade para resolver a situação da melhor forma.",
  privacyContent:
    "Seus dados são tratados com responsabilidade e utilizados apenas para processar pedidos, prestar atendimento e melhorar a experiência na loja. Não comercializamos informações pessoais. Utilizamos recursos de segurança para proteger transações, credenciais e histórico de navegação, respeitando as bases legais aplicáveis para comunicação e operação do ecommerce.",
  termsContent:
    "Ao navegar e comprar na JoJoias, você concorda com nossas condições comerciais, políticas de atendimento, prazos logísticos e regras promocionais vigentes. Valores, disponibilidade e campanhas podem ser alterados sem aviso prévio. Em caso de dúvidas, nossa equipe permanece disponível para esclarecer qualquer etapa antes ou depois da compra.",
};

function safeParseSettings(value: string | null): StoreSettingsPayload {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as StoreSettingsPayload;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!hasDatabaseUrl()) {
    return defaultStoreSettings;
  }

  const saved = await prisma.integrationSetting.findUnique({
    where: { provider: "store_settings" },
    select: { extraConfig: true },
  });

  return {
    ...defaultStoreSettings,
    ...safeParseSettings(saved?.extraConfig ?? null),
  };
}
