import { unstable_cache } from "next/cache";
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
  storeName: "Luxijóias",
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
  aboutDescription: "A Luxijóias nasceu para oferecer semijoias com curadoria refinada, acabamento premium e atendimento próximo em todas as etapas da compra.",
  aboutContent: `Na Luxijóias, cada coleção é pensada para acompanhar a rotina de mulheres que desejam sofisticação sem abrir mão da praticidade. Selecionamos peças versáteis, com banho de alta qualidade e design atual, para criar uma experiência que une beleza, durabilidade e confiança.

Nosso compromisso vai além do produto. Investimos em atendimento humanizado, expedição ágil, descrição clara das peças e uma jornada de compra segura do primeiro clique ao pós-venda.

Trabalhamos para que cada pedido chegue com o mesmo cuidado que guiou a curadoria da coleção. Por isso, mantemos processos de conferência, comunicação transparente e canais de suporte acessíveis para acompanhar você em cada etapa.`,
  shippingContent:
    "Trabalhamos com expedição rápida e acompanhamento completo do pedido. Após a confirmação do pagamento, seu pedido entra em separação e você recebe atualizações por e-mail ou painel do cliente. Os prazos variam conforme CEP e modalidade escolhida no checkout. Sempre que houver frete promocional ou envio expresso disponível, mostramos as opções antes da finalização da compra.",
  exchangesContent: `1. DIREITO DE ARREPENDIMENTO
Para compras realizadas no ecommerce, o cliente pode solicitar devolução por arrependimento em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor. O pedido deve ser feito pelos canais oficiais da Luxijóias, com número do pedido e motivo da solicitação.

2. CONDIÇÕES PARA TROCA OU DEVOLUÇÃO
Para análise, o produto deve ser devolvido sem sinais de uso, sem avarias causadas por mau uso, com embalagem original quando disponível e com todos os acessórios enviados. Peças personalizadas, ajustadas sob medida ou com indícios de uso inadequado podem ser recusadas, nos limites da legislação aplicável.

3. PRODUTO COM DEFEITO OU DIVERGÊNCIA
Caso o cliente receba item com defeito de fabricação, avaria de transporte ou divergência em relação ao pedido, a Luxijóias deve ser informada em prazo razoável após o recebimento. Nossa equipe realizará a análise do caso e poderá orientar troca, reparo, crédito ou reembolso, conforme a situação.

4. ANÁLISE E APROVAÇÃO
Toda solicitação passa por conferência interna. Se a devolução for aprovada, a Luxijóias enviará as orientações de postagem ou coleta, quando aplicável. O prazo de análise começa a contar a partir do recebimento do produto retornado em nossa base de operação.

5. FORMAS DE SOLUÇÃO
Após a aprovação, a solução poderá ocorrer por troca do item, vale-compra, reenvio da peça ou estorno do valor pago, conforme disponibilidade de estoque, natureza da ocorrência e escolha compatível com a legislação vigente.

6. REEMBOLSO
Quando houver estorno, o prazo e a forma de devolução dependem do meio de pagamento utilizado no pedido. Pagamentos por Pix podem ser devolvidos em conta indicada pelo titular. Em compras por cartão, o crédito segue o fluxo da administradora.

7. CUSTO DE ENVIO
Nos casos de arrependimento dentro do prazo legal ou defeito confirmado, a Luxijóias orientará a logística reversa conforme a política vigente. Em situações fora das hipóteses legais de responsabilidade da loja, poderá haver cobrança de novo frete ou devolução por conta do cliente.

8. ATENDIMENTO
Para iniciar qualquer solicitação, entre em contato por nossos canais oficiais com número do pedido, nome completo, e-mail utilizado na compra e breve descrição do ocorrido.`,
  privacyContent: `1. COMPROMISSO COM A PRIVACIDADE
A Luxijóias trata dados pessoais com responsabilidade, transparência e finalidade legítima. Esta política descreve como coletamos, utilizamos, armazenamos e protegemos informações de clientes, visitantes e contatos da loja.

2. DADOS COLETADOS
Podemos coletar dados cadastrais, como nome, CPF quando necessário, e-mail, telefone e endereço; dados de pedido, pagamento e entrega; dados de navegação, dispositivo, IP, cookies e preferências de uso; além de informações fornecidas em formulários de atendimento, newsletter ou recuperação de acesso.

3. FINALIDADES DE USO
Os dados podem ser utilizados para criar e administrar contas, processar pedidos, emitir comunicações transacionais, liberar acesso a áreas restritas, realizar atendimento, prevenir fraudes, cumprir obrigações legais e melhorar a experiência de navegação e compra.

4. BASES LEGAIS
O tratamento pode ocorrer com base na execução de contrato, cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse e, quando necessário, consentimento do titular, em conformidade com a legislação aplicável e com a LGPD.

5. COMPARTILHAMENTO DE DADOS
Seus dados podem ser compartilhados apenas com operadores e parceiros essenciais à operação do ecommerce, como gateways de pagamento, transportadoras, ferramentas antifraude, plataformas de atendimento e provedores de infraestrutura. Não comercializamos dados pessoais.

6. COOKIES E TECNOLOGIAS SEMELHANTES
Utilizamos cookies e recursos equivalentes para autenticação, segurança, desempenho, personalização, medição e marketing, quando habilitados. O navegador permite bloquear ou remover cookies, mas isso pode afetar funcionalidades da loja.

7. ARMAZENAMENTO E SEGURANÇA
Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida. Apesar dos esforços, nenhum ambiente digital é absolutamente imune a riscos.

8. TEMPO DE RETENÇÃO
Os dados são mantidos pelo período necessário para cumprir as finalidades desta política, atender exigências legais, resguardar direitos da Luxijóias e permitir suporte ao cliente em etapas posteriores da compra.

9. DIREITOS DO TITULAR
O titular pode solicitar confirmação de tratamento, acesso, correção, atualização, anonimização quando cabível, exclusão de dados tratados com consentimento, portabilidade e informações sobre compartilhamento, observadas as hipóteses legais aplicáveis.

10. CONTATO
Para dúvidas, solicitações sobre seus dados ou exercício de direitos, fale com a Luxijóias por nossos canais oficiais de atendimento e informe os dados necessários para identificação do titular.`,
  termsContent: `1. ACEITAÇÃO DOS TERMOS
Ao acessar, navegar ou realizar compras na Luxijóias, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso, com a Política de Privacidade e com as demais regras publicadas na loja.

2. CADASTRO E RESPONSABILIDADE DO USUÁRIO
Algumas funcionalidades dependem de cadastro. O cliente deve fornecer informações verdadeiras, atualizadas e completas, mantendo seus dados em segurança. O uso indevido da conta por terceiros em razão de compartilhamento de senha é de responsabilidade do titular, sem prejuízo das medidas de segurança disponíveis.

3. PRODUTOS, IMAGENS E DISPONIBILIDADE
A Luxijóias busca apresentar descrições, fotos, preços e estoque com o máximo de precisão. Ainda assim, podem ocorrer variações de tonalidade, proporção visual, disponibilidade ou atualização comercial sem aviso prévio. A inclusão do produto no carrinho não garante reserva até a confirmação do pagamento.

4. PREÇOS E CONDIÇÕES COMERCIAIS
Os preços e promoções vigentes são os exibidos no momento da finalização do pedido. Campanhas promocionais podem ter duração limitada, regras específicas, estoque restrito e critérios próprios de elegibilidade. Cupons não são cumulativos, salvo quando informado de forma expressa.

5. PAGAMENTO E APROVAÇÃO
Os pedidos estão sujeitos à análise de pagamento, validação antifraude e confirmação dos dados informados. A Luxijóias pode cancelar pedidos diante de inconsistências cadastrais, suspeita de fraude, indisponibilidade superveniente de estoque ou descumprimento destes termos, com restituição do valor pago quando aplicável.

6. ENTREGA E PRAZOS
Os prazos de entrega variam conforme CEP, modalidade escolhida, disponibilidade do item e confirmação do pagamento. Eventuais atrasos por força maior, restrições logísticas, dados incorretos ou ausência no recebimento podem impactar o cronograma originalmente informado.

7. TROCAS, DEVOLUÇÕES E PÓS-VENDA
As regras de arrependimento, troca, devolução e atendimento pós-venda estão detalhadas em página própria da loja. Ao comprar na Luxijóias, o cliente concorda que essas solicitações seguirão os fluxos operacionais e os prazos compatíveis com a legislação vigente.

8. PROPRIEDADE INTELECTUAL
Marcas, textos, imagens, layouts, arquivos, identidade visual e demais conteúdos da Luxijóias não podem ser reproduzidos, copiados, distribuídos ou explorados sem autorização prévia, exceto nos limites legais.

9. USO ADEQUADO DA PLATAFORMA
É proibido utilizar a loja para atividades ilícitas, tentativas de fraude, engenharia reversa, violação de segurança, coleta automatizada não autorizada ou qualquer conduta que comprometa a operação do site ou os direitos de terceiros.

10. LIMITAÇÃO DE RESPONSABILIDADE
A Luxijóias adota esforços razoáveis para manter a loja disponível e segura, mas não garante funcionamento ininterrupto ou livre de falhas. O usuário reconhece que indisponibilidades técnicas, manutenção, integração com terceiros e fatores externos podem afetar temporariamente a navegação.

11. ATENDIMENTO E COMUNICAÇÕES
As comunicações oficiais sobre pedidos, cadastro, recuperação de acesso, status de entrega e pós-venda podem ser realizadas por e-mail, WhatsApp, telefone ou painel do cliente, conforme os dados informados pelo titular.

12. DISPOSIÇÕES GERAIS
Estes termos podem ser atualizados a qualquer momento para refletir alterações legais, operacionais ou comerciais. A versão vigente será sempre a publicada na loja no momento do acesso. Em caso de dúvida, o cliente pode falar com nossa equipe de atendimento antes de concluir a compra.`,
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

const getStoreSettingsCached = unstable_cache(
  async (): Promise<StoreSettings> => {
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
  },
  ["store-settings"],
  {
    revalidate: 300,
    tags: ["store:settings"],
  },
);

export async function getStoreSettings(): Promise<StoreSettings> {
  return getStoreSettingsCached();
}
